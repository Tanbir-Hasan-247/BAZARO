from django.db.models import Avg, Count, FloatField
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from api.permissions import IsAdminOrReadOnly
from product.filters import ProductFilter
from product.models import Category, Product, ProductImage, Review, WishlistItem
from product.pagination import DefaultPagination
from product.serializers import (
    CategorySerializer,
    ProductImageSerilizer,
    ProductSerializer,
    ReviewSerializer,
    WishlistItemSerializer,
)
from .permissions import IsReviewAuthorOrReadonly


class ProductViewSet(ModelViewSet):
    """
    API endpoint for managing products in the e-commerce store.
    - Admin users can create, update, and delete products.
    - All users can browse, filter, search, and order products.
    """

    queryset = (
        Product.objects.select_related('category')
        .prefetch_related('images')
        .annotate(
            avg_rating=Coalesce(
                Avg('review__ratings'),
                0.0,
                output_field=FloatField(),
            ),
            total_reviews=Count('review', distinct=True),
        )
        .order_by('-id')
    )
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    pagination_class = DefaultPagination
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'stock']
    permission_classes = [IsAdminOrReadOnly]

    @swagger_auto_schema(
        operation_summary="Create a product by admin",
        operation_description="Allows an authenticated admin to create a product.",
        request_body=ProductSerializer,
        responses={201: ProductSerializer, 400: 'Bad Request'},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)


class ProductImageViewSet(ModelViewSet):
    serializer_class = ProductImageSerilizer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return ProductImage.objects.filter(
            product_id=self.kwargs.get('product_pk')
        ).order_by('id')

    def perform_create(self, serializer):
        product = get_object_or_404(Product, pk=self.kwargs.get('product_pk'))
        serializer.save(product=product)

    def perform_destroy(self, instance):
        if instance.uploaded_file:
            instance.uploaded_file.delete(save=False)
        instance.delete()


class CategoryViewSet(ModelViewSet):
    queryset = (
        Category.objects.annotate(product_count=Count('products'))
        .all()
        .order_by('id')
    )
    serializer_class = CategorySerializer
    pagination_class = DefaultPagination
    permission_classes = [IsAdminOrReadOnly]


class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsReviewAuthorOrReadonly]

    def get_queryset(self):
        return Review.objects.select_related('user').filter(
            product_id=self.kwargs.get('product_pk')
        )

    def perform_create(self, serializer):
        get_object_or_404(Product, pk=self.kwargs.get('product_pk'))
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    def get_serializer_context(self):
        return {
            'product_id': self.kwargs.get('product_pk'),
            'request': self.request,
        }


class ProductList(ListCreateAPIView):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]


class ProductDetails(RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'pk'
    permission_classes = [IsAdminOrReadOnly]


class CategoryList(ListCreateAPIView):
    queryset = Category.objects.annotate(product_count=Count('products')).all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class CategoryDetails(RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'pk'
    permission_classes = [IsAdminOrReadOnly]


class WishlistViewSet(ModelViewSet):
    """Per-user private wishlist CRUD and idempotent toggle endpoint."""

    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return (
            WishlistItem.objects.filter(user=self.request.user)
            .select_related('product', 'product__category')
            .prefetch_related('product__images')
            .annotate(
                product_avg=Coalesce(
                    Avg('product__review__ratings'),
                    0.0,
                    output_field=FloatField(),
                )
            )
            .order_by('-created_at')
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data['product_id']
        item, created = WishlistItem.objects.get_or_create(
            user=request.user,
            product_id=product_id,
        )
        out = self.get_serializer(item).data
        return Response(
            out,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data['product_id']

        existing = WishlistItem.objects.filter(
            user=request.user,
            product_id=product_id,
        ).first()
        if existing:
            existing.delete()
            return Response(
                {'wishlisted': False, 'product_id': product_id},
                status=status.HTTP_200_OK,
            )

        item = WishlistItem.objects.create(user=request.user, product_id=product_id)
        return Response(
            {
                'wishlisted': True,
                'product_id': product_id,
                'item': self.get_serializer(item).data,
            },
            status=status.HTTP_201_CREATED,
        )
