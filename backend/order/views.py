import re
from decimal import Decimal
from uuid import UUID

from django.conf import settings
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, DestroyModelMixin, RetrieveModelMixin
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ModelViewSet

from order.models import Cart, Cartitem, Coupon, Order
from order.serializers import (
    AddCartItemSerializers,
    CartItemSerializers,
    CartSerializers,
    ConfirmPaymentSerializer,
    CouponSerializer,
    CreateOrderSerializer,
    EmptySerializer,
    InitiatePaymentSerializer,
    OrderSerializer,
    PublicOrderTrackingSerializer,
    UpdateCartItemSerializer,
    UpdateOrderSerializer,
    ValidateCouponSerializer,
    VerifyStripeSessionSerializer,
)
from .gateways import PaymentGatewayService
from .services import OrderService


def _normalize_digits(value: str) -> str:
    return re.sub(r'\D+', '', value or '')


class CartViewset(
    CreateModelMixin, RetrieveModelMixin, DestroyModelMixin, GenericViewSet
):
    serializer_class = CartSerializers
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'])
    def current(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Cart.objects.none()
        return Cart.objects.prefetch_related('items__product').filter(
            user=self.request.user
        )


class CartItemViewset(ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete']
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AddCartItemSerializers
        if self.request.method == 'PATCH':
            return UpdateCartItemSerializer
        return CartItemSerializers

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Cartitem.objects.none()
        return Cartitem.objects.select_related('product').filter(
            cart_id=self.kwargs.get('cart_pk'),
            cart__user=self.request.user,
        )

    def perform_create(self, serializer):
        # Verify the cart exists and belongs strictly to the authenticated user
        get_object_or_404(Cart, pk=self.kwargs.get('cart_pk'), user=self.request.user)
        serializer.save()

    def get_serializer_context(self):
        return {
            'cart_id': self.kwargs.get('cart_pk'),
            'user': self.request.user,
        }


class OrderViewSet(ModelViewSet):
    http_method_names = ['get', 'post', 'delete', 'patch', 'head', 'options']
    throttle_scope_map = {'create': 'order_create', 'track': 'order_track'}

    def get_throttles(self):
        if self.action in self.throttle_scope_map:
            self.throttle_scope = self.throttle_scope_map[self.action]
        return super().get_throttles()

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        updated = OrderService.cancel_order(order=order, user=request.user)
        return Response(
            {
                'status': updated.status,
                'payment_status': updated.payment_status,
                'detail': 'Order canceled and stock restored.',
            }
        )

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = UpdateOrderSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        updated = OrderService.update_order_status(
            user=request.user,
            order=order,
            new_status=serializer.validated_data.get('status', order.status),
            payment_status=serializer.validated_data.get('payment_status'),
        )
        return Response(OrderSerializer(updated).data)

    @action(detail=True, methods=['post'])
    def confirm_payment(self, request, pk=None):
        order = self.get_object()
        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = OrderService.confirm_payment(
            user=request.user,
            order=order,
            payment_method=serializer.validated_data.get('payment_method', 'Card'),
            transaction_id=serializer.validated_data['transaction_id'],
        )
        return Response(OrderSerializer(updated).data)

    @action(detail=True, methods=['post'])
    def initiate_payment(self, request, pk=None):
        order = self.get_object()
        if not request.user.is_staff and order.user_id != request.user.id:
            return Response(
                {'detail': 'You cannot initiate payment for another user order.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        backend_base = request.build_absolute_uri('/').rstrip('/')
        frontend_base = getattr(settings, 'FRONTEND_PUBLIC_URL', 'http://localhost:5173')
        result = PaymentGatewayService.initiate(
            order=order,
            provider=serializer.validated_data['provider'],
            backend_base_url=backend_base,
            frontend_base_url=frontend_base,
        )
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def verify_stripe(self, request, pk=None):
        order = self.get_object()
        if not request.user.is_staff and order.user_id != request.user.id:
            return Response(
                {'detail': 'You cannot verify payment for another user order.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = VerifyStripeSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = PaymentGatewayService.verify_stripe_session(
            order=order, session_id=serializer.validated_data['session_id']
        )
        return Response(OrderSerializer(updated).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def track(self, request):
        raw_order_id = (request.query_params.get('order_id') or '').strip().lstrip('#')
        contact = (request.query_params.get('contact') or '').strip()

        if not raw_order_id:
            return Response(
                {'detail': 'Please provide an Order ID to track.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        base_qs = Order.objects.select_related('user').prefetch_related('items__product')
        order = None

        # 1. Exact UUID match
        try:
            parsed_uuid = UUID(raw_order_id)
            order = base_qs.filter(pk=parsed_uuid).first()
        except ValueError:
            parsed_uuid = None

        # 2. Signed-in owner or staff can also match by short 8-char prefix
        if order is None and request.user.is_authenticated and len(raw_order_id) >= 6:
            scoped = base_qs if request.user.is_staff else base_qs.filter(user=request.user)
            target_prefix = raw_order_id.lower()
            for candidate in scoped[:100]:
                if str(candidate.id).lower().startswith(target_prefix):
                    order = candidate
                    break

        if not order:
            return Response(
                {'detail': 'No matching order found. Please verify your Order ID.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Authenticated owner or staff gets full order details
        if request.user.is_authenticated and (
            request.user.is_staff or order.user_id == request.user.id
        ):
            return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

        # Unauthenticated lookup requires BOTH full UUID AND verified email or phone match
        if parsed_uuid is None or not contact:
            return Response(
                {'detail': 'Please provide your full Order ID and registered email or phone number.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        email_match = (
            '@' in contact
            and order.user.email
            and order.user.email.strip().lower() == contact.lower()
        )
        input_digits = _normalize_digits(contact)
        saved_digits = _normalize_digits(order.contact_phone)
        phone_match = (
            len(input_digits) >= 7
            and saved_digits
            and (
                saved_digits == input_digits
                or saved_digits.endswith(input_digits[-8:])
            )
        )

        if not (email_match or phone_match):
            return Response(
                {'detail': 'Order credentials do not match our dispatch records.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(PublicOrderTrackingSerializer(order).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def validate_coupon(self, request):
        serializer = ValidateCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subtotal = serializer.validated_data.get('subtotal', Decimal('0.00'))
        coupon, discount = OrderService.validate_coupon(
            serializer.validated_data['code'], subtotal=subtotal
        )
        return Response(
            {
                'valid': True,
                'code': coupon.code,
                'discount_percent': coupon.discount_percent,
                'discount_amount': discount,
                'min_order_amount': coupon.min_order_amount,
            }
        )

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        serializer = UpdateOrderSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = OrderService.update_order_status(
            user=request.user,
            order=order,
            new_status=serializer.validated_data.get('status', order.status),
            payment_status=serializer.validated_data.get('payment_status'),
        )
        return Response(OrderSerializer(updated).data)

    def get_serializer_class(self):
        if self.action == 'cancel':
            return EmptySerializer
        if self.action == 'create':
            return CreateOrderSerializer
        if self.action in ['update_status', 'partial_update', 'update']:
            return UpdateOrderSerializer
        if self.action == 'confirm_payment':
            return ConfirmPaymentSerializer
        if self.action == 'initiate_payment':
            return InitiatePaymentSerializer
        if self.action == 'verify_stripe':
            return VerifyStripeSessionSerializer
        if self.action == 'validate_coupon':
            return ValidateCouponSerializer
        return OrderSerializer

    def get_permissions(self):
        if self.action in ['validate_coupon', 'track']:
            return [AllowAny()]
        if self.action in ['update_status', 'partial_update', 'update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        return {'user_id': self.request.user.id, 'user': self.request.user}

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Order.objects.none()
        if self.request.user.is_staff:
            return Order.objects.select_related('user').prefetch_related('items__product').all()
        return (
            Order.objects.select_related('user')
            .prefetch_related('items__product')
            .filter(user=self.request.user)
        )


class SSLCommerzCallbackView(APIView):
    """Handles SSLCommerz browser redirect and server IPN notifications securely."""

    permission_classes = [AllowAny]

    def _handle(self, request):
        payload = request.data if request.method == 'POST' else request.query_params
        order, outcome = PaymentGatewayService.verify_sslcommerz_callback(payload)

        accept = request.META.get('HTTP_ACCEPT', '')
        wants_json = 'application/json' in accept and 'text/html' not in accept
        if wants_json:
            return Response(
                {
                    'order_id': str(order.id),
                    'outcome': outcome,
                    'status': order.status,
                    'payment_status': order.payment_status,
                    'transaction_id': order.transaction_id,
                },
                status=status.HTTP_200_OK,
            )

        frontend_base = getattr(settings, 'FRONTEND_PUBLIC_URL', 'http://localhost:5173').rstrip('/')
        return HttpResponseRedirect(
            f"{frontend_base}/track-order?order_id={order.id}&payment={outcome}"
        )

    def post(self, request):
        return self._handle(request)

    def get(self, request):
        return self._handle(request)


class CouponViewSet(ModelViewSet):
    queryset = Coupon.objects.all().order_by('-created_at')
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]
