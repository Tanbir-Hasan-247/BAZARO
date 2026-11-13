from decimal import Decimal
import io
import tempfile
from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from product.models import Category, Product, ProductImage, WishlistItem

User = get_user_model()


class ProductAndUserApiTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email='customer@bazaro.com',
            password='StrongPassword123!',
            first_name='Tariq',
        )
        self.admin = User.objects.create_superuser(
            email='staff@bazaro.com',
            password='AdminPassword123!',
        )
        self.category = Category.objects.create(
            name='Home Appliances & Kitchen Living',
            description='Kitchen and smart living appliances',
        )
        self.product = Product.objects.create(
            name='Digital Touchscreen Air Fryer 5.5L Deluxe',
            description='Oil-free smart convection fryer',
            price=Decimal('95.50'),
            stock=12,
            category=self.category,
        )

    def test_admin_can_create_product_with_category_id_alias(self):
        # Regular customer forbidden
        self.client.force_authenticate(user=self.customer)
        r_forbidden = self.client.post(
            '/api/v1/products/',
            {
                'name': 'Unauthorized Item',
                'price': 50.0,
                'stock': 5,
                'category_id': self.category.id,
            },
            format='json',
        )
        self.assertEqual(r_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # Admin allowed & category_id works seamlessly
        self.client.force_authenticate(user=self.admin)
        r_ok = self.client.post(
            '/api/v1/products/',
            {
                'name': 'Ultra Luxury Artisan Ceramic Espresso Brewer',
                'price': 149.99,
                'stock': 8,
                'category_id': self.category.id,
            },
            format='json',
        )
        self.assertEqual(r_ok.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r_ok.data['category'], self.category.id)
        self.assertTrue(r_ok.data['in_stock'])

    def test_duplicate_review_prevented_and_ratings_aggregated(self):
        self.client.force_authenticate(user=self.customer)
        review_url = f'/api/v1/products/{self.product.id}/reviews/'

        r1 = self.client.post(
            review_url, {'ratings': 5, 'comment': 'Fantastic build!'}, format='json'
        )
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        r2 = self.client.post(
            review_url, {'ratings': 4, 'comment': 'Duplicate spam'}, format='json'
        )
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

        prod_res = self.client.get(f'/api/v1/products/{self.product.id}/')
        self.assertEqual(prod_res.status_code, status.HTTP_200_OK)
        self.assertEqual(prod_res.data['review_count'], 1)
        self.assertEqual(prod_res.data['average_rating'], 5.0)

    def test_user_me_exposes_is_staff_and_blocks_privilege_escalation(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.patch(
            '/api/v1/auth/users/me/',
            {'first_name': 'Updated', 'is_staff': True, 'is_superuser': True},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['is_staff'])
        self.assertFalse(res.data['is_superuser'])
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_staff)

    def test_product_variants_and_image_upload_or_url(self):
        self.client.force_authenticate(user=self.admin)
        # Update product variants
        patch_res = self.client.patch(
            f'/api/v1/products/{self.product.id}/',
            {
                'available_colors': ['Obsidian', 'Champagne'],
                'available_sizes': ['5.5L', '7.0L'],
            },
            format='json',
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['available_colors'], ['Obsidian', 'Champagne'])

        # URL image attach
        img_url = f'/api/v1/products/{self.product.id}/images/'
        url_res = self.client.post(
            img_url,
            {'image': '/products/artisan-espresso-roast.jpg'},
            format='json',
        )
        self.assertEqual(url_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(url_res.data['image'], '/products/artisan-espresso-roast.jpg')

        # Multipart file upload to local media storage (no Cloudinary crash)
        with tempfile.TemporaryDirectory() as tmp_media:
            with override_settings(MEDIA_ROOT=tmp_media):
                buf = io.BytesIO()
                Image.new('RGB', (8, 8), color='gold').save(buf, format='PNG')
                buf.seek(0)
                uploaded = SimpleUploadedFile(
                    'swatch.png', buf.read(), content_type='image/png'
                )
                file_res = self.client.post(
                    img_url,
                    {'image': uploaded},
                    format='multipart',
                )
                self.assertEqual(file_res.status_code, status.HTTP_201_CREATED)
                self.assertIn('/media/products/uploads/', file_res.data['image'])

    def test_wishlist_toggle_and_user_isolation(self):
        wishlist_url = '/api/v1/wishlist/'
        toggle_url = '/api/v1/wishlist/toggle/'

        # Unauthenticated rejected
        self.assertEqual(
            self.client.get(wishlist_url).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        # Toggle ON
        self.client.force_authenticate(user=self.customer)
        r_on = self.client.post(
            toggle_url, {'product_id': self.product.id}, format='json'
        )
        self.assertEqual(r_on.status_code, status.HTTP_201_CREATED)
        self.assertTrue(r_on.data['wishlisted'])
        self.assertEqual(WishlistItem.objects.filter(user=self.customer).count(), 1)

        # Admin has isolated empty wishlist
        self.client.force_authenticate(user=self.admin)
        admin_list = self.client.get(wishlist_url)
        self.assertEqual(admin_list.status_code, status.HTTP_200_OK)
        self.assertEqual(admin_list.data, [])

        # Toggle OFF as customer
        self.client.force_authenticate(user=self.customer)
        r_off = self.client.post(
            toggle_url, {'product_id': self.product.id}, format='json'
        )
        self.assertEqual(r_off.status_code, status.HTTP_200_OK)
        self.assertFalse(r_off.data['wishlisted'])
        self.assertEqual(WishlistItem.objects.filter(user=self.customer).count(), 0)
