from decimal import Decimal
from django.shortcuts import get_object_or_404
from rest_framework import serializers

from order.models import Cart, Cartitem, Coupon, Order, OrderItem
from product.models import Product
from .services import OrderService


class MinimalProductSerializers(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price']


class CartItemSerializers(serializers.ModelSerializer):
    product = MinimalProductSerializers()
    total_price = serializers.SerializerMethodField('get_total_price')

    class Meta:
        model = Cartitem
        fields = ['id', 'product', 'quantity', 'selected_variant', 'total_price']

    def get_total_price(self, cart_item: Cartitem):
        return cart_item.product.price * cart_item.quantity


class CartSerializers(serializers.ModelSerializer):
    items = CartItemSerializers(many=True, read_only=True)
    total_price = serializers.SerializerMethodField('get_total_price')

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total_price']
        read_only_fields = ['user']

    def get_total_price(self, cart: Cart):
        return sum(
            [item.product.price * item.quantity for item in cart.items.all()],
            Decimal('0.00'),
        )


class AddCartItemSerializers(serializers.ModelSerializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    selected_variant = serializers.CharField(
        max_length=120, required=False, allow_blank=True, default=''
    )

    class Meta:
        model = Cartitem
        fields = ['id', 'product_id', 'quantity', 'selected_variant']

    def validate(self, attrs):
        product_id = attrs['product_id']
        quantity = attrs['quantity']
        attrs['selected_variant'] = (attrs.get('selected_variant') or '').strip()[:120]
        cart_id = self.context['cart_id']
        user = self.context.get('user')

        cart = get_object_or_404(Cart, pk=cart_id, user=user)
        product = Product.objects.filter(pk=product_id).first()
        if not product:
            raise serializers.ValidationError(
                {'product_id': f'Product with id {product_id} does not exist.'}
            )

        existing_total = sum(
            Cartitem.objects.filter(cart=cart, product=product).values_list(
                'quantity', flat=True
            )
        )
        projected_qty = existing_total + quantity
        if projected_qty > product.stock:
            raise serializers.ValidationError(
                {
                    'quantity': (
                        f"Insufficient stock for '{product.name}'. "
                        f"Available: {product.stock}, total requested: {projected_qty}."
                    )
                }
            )
        return attrs

    def save(self, **kwargs):
        cart_id = self.context['cart_id']
        product_id = self.validated_data['product_id']
        quantity = self.validated_data['quantity']
        variant = self.validated_data.get('selected_variant', '')

        try:
            cart_item = Cartitem.objects.get(
                cart_id=cart_id,
                product_id=product_id,
                selected_variant=variant,
            )
            cart_item.quantity += quantity
            cart_item.save()
            self.instance = cart_item
        except Cartitem.DoesNotExist:
            self.instance = Cartitem.objects.create(
                cart_id=cart_id,
                product_id=product_id,
                quantity=quantity,
                selected_variant=variant,
            )

        return self.instance


class UpdateCartItemSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField(min_value=1)

    class Meta:
        model = Cartitem
        fields = ['quantity']

    def validate_quantity(self, quantity):
        if self.instance:
            other_variants_qty = sum(
                Cartitem.objects.filter(
                    cart=self.instance.cart,
                    product=self.instance.product,
                )
                .exclude(pk=self.instance.pk)
                .values_list('quantity', flat=True)
            )
            if other_variants_qty + quantity > self.instance.product.stock:
                raise serializers.ValidationError(
                    f"Insufficient stock for '{self.instance.product.name}'. "
                    f"Available: {self.instance.product.stock}."
                )
        return quantity


class OrderItemSerializer(serializers.ModelSerializer):
    product = MinimalProductSerializers()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'total_price', 'selected_variant']


class DirectOrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    selected_variant = serializers.CharField(
        max_length=120, required=False, allow_blank=True, default=''
    )


class CreateOrderSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField(required=False, allow_null=True)
    items = DirectOrderItemInputSerializer(many=True, required=False)
    shipping_address = serializers.CharField(
        required=False, allow_blank=True, default=''
    )
    contact_phone = serializers.CharField(
        required=False, allow_blank=True, default=''
    )
    recipient_name = serializers.CharField(
        required=False, allow_blank=True, default=''
    )
    payment_method = serializers.CharField(
        required=False, allow_blank=True, default='COD'
    )
    transaction_id = serializers.CharField(
        required=False, allow_blank=True, default=''
    )
    coupon_code = serializers.CharField(
        required=False, allow_blank=True, default=''
    )

    def validate_cart_id(self, cart_id):
        if cart_id is None:
            return None
        user_id = self.context['user_id']
        if not Cart.objects.filter(pk=cart_id, user_id=user_id).exists():
            raise serializers.ValidationError('No cart found for this user!')
        if not Cartitem.objects.filter(cart_id=cart_id).exists():
            raise serializers.ValidationError('Cart is empty!')
        return cart_id

    def validate(self, attrs):
        if not attrs.get('cart_id') and not attrs.get('items'):
            raise serializers.ValidationError(
                'Provide either cart_id or a non-empty items list.'
            )
        return attrs

    def create(self, validated_data):
        user_id = self.context['user_id']
        return OrderService.create_order(
            user_id=user_id,
            cart_id=validated_data.get('cart_id'),
            items_data=validated_data.get('items'),
            shipping_address=validated_data.get('shipping_address', ''),
            contact_phone=validated_data.get('contact_phone', ''),
            recipient_name=validated_data.get('recipient_name', ''),
            payment_method=validated_data.get('payment_method', 'COD'),
            transaction_id=validated_data.get('transaction_id', ''),
            coupon_code=validated_data.get('coupon_code', ''),
        )

    def to_representation(self, instance):
        return OrderSerializer(instance).data


class UpdateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status', 'payment_status']


class ConfirmPaymentSerializer(serializers.Serializer):
    payment_method = serializers.CharField(
        required=False, allow_blank=True, default='Card'
    )
    transaction_id = serializers.CharField(required=True, allow_blank=False)


class InitiatePaymentSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(
        choices=['sslcommerz', 'stripe'], default='sslcommerz'
    )


class VerifyStripeSessionSerializer(serializers.Serializer):
    session_id = serializers.CharField(required=True, allow_blank=False)


class ValidateCouponSerializer(serializers.Serializer):
    code = serializers.CharField(required=True, allow_blank=False)
    subtotal = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        default=Decimal('0.00'),
    )


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id',
            'code',
            'discount_percent',
            'max_discount_amount',
            'min_order_amount',
            'is_active',
            'valid_until',
            'usage_limit',
            'used_count',
        ]
        read_only_fields = ['used_count']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'user',
            'user_email',
            'status',
            'subtotal',
            'discount_amount',
            'shipping_fee',
            'tax_amount',
            'total_price',
            'coupon_code',
            'payment_status',
            'payment_method',
            'transaction_id',
            'recipient_name',
            'shipping_address',
            'contact_phone',
            'created_at',
            'updated_at',
            'items',
        ]


class PublicOrderTrackingSerializer(serializers.ModelSerializer):
    """Sanitized public tracking representation without exposing full PII."""

    items = OrderItemSerializer(many=True, read_only=True)
    recipient_label = serializers.SerializerMethodField()
    destination_hint = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'status',
            'subtotal',
            'discount_amount',
            'shipping_fee',
            'total_price',
            'coupon_code',
            'payment_status',
            'payment_method',
            'transaction_id',
            'recipient_label',
            'destination_hint',
            'created_at',
            'updated_at',
            'items',
        ]

    def get_recipient_label(self, obj: Order):
        name = (obj.recipient_name or '').strip()
        if not name:
            return 'Verified Patron'
        first = name.split()[0]
        return f"{first[0]}***" if len(first) <= 2 else f"{first[:2]}***"

    def get_destination_hint(self, obj: Order):
        addr = (obj.shipping_address or '').strip()
        if not addr:
            return 'Courier Destination Verified'
        parts = [p.strip() for p in addr.split(',') if p.strip()]
        return parts[-1] if parts else 'Bangladesh'


class EmptySerializer(serializers.Serializer):
    pass
