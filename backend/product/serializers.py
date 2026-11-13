from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework import serializers
from product.models import Product, ProductImage, Category, Review, WishlistItem
from product.validators import validate_file_size


def _clean_variant_list(value, field_label):
    if value is None or value == '':
        return []
    if isinstance(value, str):
        items = [part.strip() for part in value.split(',') if part.strip()]
    elif isinstance(value, list):
        items = [str(part).strip() for part in value if str(part).strip()]
    else:
        raise serializers.ValidationError(f"{field_label} must be a list of values.")

    deduped = []
    seen = set()
    for item in items:
        clean = item[:40]
        lowered = clean.lower()
        if lowered not in seen:
            seen.add(lowered)
            deduped.append(clean)
        if len(deduped) >= 16:
            break
    return deduped


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(
        read_only=True,
        help_text='Return the number of products in this category',
    )

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'product_count']


class ProductImageSerilizer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField(method_name='get_image_url')
    uploaded_file = serializers.ImageField(
        write_only=True,
        required=False,
        validators=[validate_file_size],
    )
    image_url = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=500,
    )

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'uploaded_file', 'image_url']

    def to_internal_value(self, data):
        mutable = data.copy() if hasattr(data, 'copy') else dict(data)
        raw_image = mutable.get('image')
        if raw_image is not None:
            if hasattr(raw_image, 'read') and 'uploaded_file' not in mutable:
                mutable['uploaded_file'] = raw_image
            elif isinstance(raw_image, str) and raw_image.strip() and 'image_url' not in mutable:
                mutable['image_url'] = raw_image.strip()
        return super().to_internal_value(mutable)

    def validate_image_url(self, value):
        clean = (value or '').strip()
        if not clean:
            return ''
        if not (
            clean.startswith('/')
            or clean.startswith('http://')
            or clean.startswith('https://')
        ):
            raise serializers.ValidationError(
                "Image URL must start with '/', 'http://', or 'https://'."
            )
        return clean

    def validate(self, attrs):
        if self.instance is None and not attrs.get('uploaded_file') and not attrs.get('image_url'):
            raise serializers.ValidationError(
                {'image': 'Provide an image file upload or a valid image_url.'}
            )
        return attrs

    def get_image_url(self, obj):
        if not obj:
            return None
        if obj.image_url:
            return obj.image_url
        if obj.uploaded_file:
            url = obj.uploaded_file.url
            request = self.context.get('request') if hasattr(self, 'context') else None
            return request.build_absolute_uri(url) if request else url
        if not obj.image:
            return None
        public_id = getattr(obj.image, 'public_id', None)
        fmt = getattr(obj.image, 'format', None)
        if public_id and (
            public_id.startswith('http://')
            or public_id.startswith('https://')
            or public_id.startswith('/')
        ):
            return f"{public_id}.{fmt}" if fmt else public_id
        if hasattr(obj.image, 'url'):
            return obj.image.url
        return str(obj.image)


ProductImageSerializer = ProductImageSerilizer


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerilizer(many=True, read_only=True)
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False,
    )
    price_with_tax = serializers.SerializerMethodField(method_name='calculate_tax')
    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    available_colors = serializers.JSONField(required=False, default=list)
    available_sizes = serializers.JSONField(required=False, default=list)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'price',
            'stock',
            'in_stock',
            'category',
            'category_name',
            'available_colors',
            'available_sizes',
            'price_with_tax',
            'average_rating',
            'review_count',
            'images',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_available_colors(self, value):
        return _clean_variant_list(value, 'available_colors')

    def validate_available_sizes(self, value):
        return _clean_variant_list(value, 'available_sizes')

    def to_internal_value(self, data):
        # Support frontends that send `category_id` alongside standard `category`
        if hasattr(data, 'copy') and 'category_id' in data and 'category' not in data:
            mutable = data.copy()
            mutable['category'] = mutable.get('category_id')
            return super().to_internal_value(mutable)
        return super().to_internal_value(data)

    def calculate_tax(self, product):
        if product.price is None:
            return Decimal('0.00')
        return round(Decimal(str(product.price)) * Decimal('1.1'), 2)

    def get_average_rating(self, product):
        avg = getattr(product, 'avg_rating', None)
        if avg is not None:
            return round(float(avg), 2)
        return 0.0

    def get_review_count(self, product):
        cnt = getattr(product, 'total_reviews', None)
        if cnt is not None:
            return int(cnt)
        return 0

    def get_in_stock(self, product):
        return (product.stock or 0) > 0

    def validate_price(self, price):
        if price <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return price

    def validate_stock(self, stock):
        if stock < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return stock


class SimpleUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(method_name='get_current_user_name')

    class Meta:
        model = get_user_model()
        fields = ['id', 'name']

    def get_current_user_name(self, obj):
        return obj.get_full_name() or obj.email.split('@')[0]


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(method_name='get_user')

    class Meta:
        model = Review
        fields = [
            'id',
            'user',
            'product',
            'ratings',
            'comment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['user', 'product', 'created_at', 'updated_at']

    def get_user(self, obj):
        return SimpleUserSerializer(obj.user).data

    def validate(self, attrs):
        product_id = self.context.get('product_id')
        request = self.context.get('request')

        if self.instance is None and product_id and request and request.user.is_authenticated:
            if Review.objects.filter(product_id=product_id, user=request.user).exists():
                raise serializers.ValidationError(
                    {'detail': 'You have already reviewed this product.'}
                )
        return attrs

    def create(self, validate_data):
        product_id = self.context['product_id']
        return Review.objects.create(product_id=product_id, **validate_data)


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'created_at']
        read_only_fields = ['id', 'product', 'created_at']

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Selected product was not found.")
        return value
