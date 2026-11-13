from decimal import Decimal
from unittest.mock import Mock, patch
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from order.gateways import _sign_order_token
from order.models import Cart, Cartitem, Coupon, Order
from product.models import Category, Product

User = get_user_model()


class EcommerceOrderSecurityAndFlowTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email='buyer_a@bazaro.com',
            password='StrongPassword123!',
            first_name='Buyer',
            last_name='A',
        )
        self.user_b = User.objects.create_user(
            email='buyer_b@bazaro.com',
            password='StrongPassword123!',
            first_name='Buyer',
            last_name='B',
        )
        self.admin = User.objects.create_superuser(
            email='admin_test@bazaro.com',
            password='AdminPassword123!',
        )

        self.category = Category.objects.create(name='Electronics', description='Tech')
        self.product = Product.objects.create(
            name='Studio Wireless Headphones Pro Edition',
            description='Noise cancelling wireless studio gear',
            price=Decimal('100.00'),
            stock=5,
            category=self.category,
        )
        self.cheap_item = Product.objects.create(
            name='USB-C Braided Cable',
            description='Durable cable',
            price=Decimal('20.00'),
            stock=3,
            category=self.category,
        )
        self.coupon = Coupon.objects.create(
            code='BAZARO20',
            discount_percent=20,
            is_active=True,
        )

    def test_cart_creation_idempotent_and_cart_item_idor_blocked(self):
        self.client.force_authenticate(user=self.user_a)
        res1 = self.client.post('/api/v1/carts/')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        cart_id = res1.data['id']

        # Calling POST /carts/ again returns existing cart instead of 500
        res2 = self.client.post('/api/v1/carts/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['id'], cart_id)

        # Adding item twice updates quantity cleanly and respects stock
        add_url = f'/api/v1/carts/{cart_id}/items/'
        r_add1 = self.client.post(
            add_url, {'product_id': self.product.id, 'quantity': 2}, format='json'
        )
        self.assertEqual(r_add1.status_code, status.HTTP_201_CREATED)

        r_add2 = self.client.post(
            add_url, {'product_id': self.product.id, 'quantity': 2}, format='json'
        )
        self.assertEqual(r_add2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r_add2.data['quantity'], 4)

        # Exceeding stock in cart must fail with 400
        r_exceed = self.client.post(
            add_url, {'product_id': self.product.id, 'quantity': 2}, format='json'
        )
        self.assertEqual(r_exceed.status_code, status.HTTP_400_BAD_REQUEST)

        # Unauthenticated IDOR blocked
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get(add_url).status_code, status.HTTP_401_UNAUTHORIZED)

        # Another customer (user_b) IDOR blocked
        self.client.force_authenticate(user=self.user_b)
        self.assertEqual(
            self.client.get(add_url).data, []
        )
        self.assertEqual(
            self.client.post(
                add_url, {'product_id': self.product.id, 'quantity': 1}, format='json'
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_cross_user_cart_checkout_rejected(self):
        cart_a = Cart.objects.create(user=self.user_a)
        Cartitem.objects.create(cart=cart_a, product=self.product, quantity=1)

        self.client.force_authenticate(user=self.user_b)
        res = self.client.post(
            '/api/v1/orders/', {'cart_id': str(cart_a.id)}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

    def test_direct_checkout_server_pricing_coupon_and_stock_deduction(self):
        self.client.force_authenticate(user=self.user_a)
        # Try spoofing price/over-ordering stock first
        bad_res = self.client.post(
            '/api/v1/orders/',
            {'items': [{'product_id': self.product.id, 'quantity': 10}]},
            format='json',
        )
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid order with coupon BAZARO20 on 2 * $100 ($200 subtotal, 20% off = $40, free ship = $160)
        res = self.client.post(
            '/api/v1/orders/',
            {
                'items': [{'product_id': self.product.id, 'quantity': 2}],
                'coupon_code': 'BAZARO20',
                'shipping_address': 'Dhanmondi 27, Dhaka',
                'contact_phone': '01700000099',
                'recipient_name': 'Buyer A',
                'total_price': 0.01,  # Attempted spoof must be ignored
            },
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(res.data['subtotal'])), Decimal('200.00'))
        self.assertEqual(Decimal(str(res.data['discount_amount'])), Decimal('40.00'))
        self.assertEqual(Decimal(str(res.data['total_price'])), Decimal('160.00'))
        self.assertEqual(res.data['payment_status'], Order.PAYMENT_PENDING)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)

    def test_order_permissions_confirm_payment_and_cancel_restores_stock_once(self):
        self.client.force_authenticate(user=self.user_a)
        res = self.client.post(
            '/api/v1/orders/',
            {'items': [{'product_id': self.cheap_item.id, 'quantity': 2}]},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # Subtotal $40 <= $50 -> $5 shipping -> $45 total
        self.assertEqual(Decimal(str(res.data['shipping_fee'])), Decimal('5.00'))
        self.assertEqual(Decimal(str(res.data['total_price'])), Decimal('45.00'))
        order_id = res.data['id']

        self.cheap_item.refresh_from_db()
        self.assertEqual(self.cheap_item.stock, 1)

        # Customer must NOT be allowed to tamper with update_status or PATCH
        self.assertEqual(
            self.client.patch(
                f'/api/v1/orders/{order_id}/update_status/',
                {'status': Order.DELIVERED},
                format='json',
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.patch(
                f'/api/v1/orders/{order_id}/',
                {'status': Order.DELIVERED},
                format='json',
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # Customer confirms payment
        pay_res = self.client.post(
            f'/api/v1/orders/{order_id}/confirm_payment/',
            {'payment_method': 'bKash', 'transaction_id': 'TXN-998877'},
            format='json',
        )
        self.assertEqual(pay_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pay_res.data['payment_status'], Order.PAYMENT_PAID)
        self.assertEqual(pay_res.data['status'], Order.READY_TO_SHIP)

        # Cancel restores stock and prevents double cancellation
        cancel_res = self.client.post(f'/api/v1/orders/{order_id}/cancel/')
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_res.data['payment_status'], Order.PAYMENT_REFUNDED)

        self.cheap_item.refresh_from_db()
        self.assertEqual(self.cheap_item.stock, 3)

        # Second cancel rejected, stock stays 3
        cancel_again = self.client.post(f'/api/v1/orders/{order_id}/cancel/')
        self.assertEqual(cancel_again.status_code, status.HTTP_400_BAD_REQUEST)
        self.cheap_item.refresh_from_db()
        self.assertEqual(self.cheap_item.stock, 3)

        # Admin status endpoint works cleanly & prevents un-canceling canceled orders
        self.client.force_authenticate(user=self.admin)
        admin_reactivate = self.client.patch(
            f'/api/v1/orders/{order_id}/update_status/',
            {'status': Order.SHIPPED},
            format='json',
        )
        self.assertEqual(admin_reactivate.status_code, status.HTTP_400_BAD_REQUEST)

    def test_selected_variants_carried_through_cart_and_order_and_admin_coupons(self):
        # Customer adds same product with two distinct variants
        self.client.force_authenticate(user=self.user_a)
        cart_res = self.client.post('/api/v1/carts/')
        cart_id = cart_res.data['id']
        items_url = f'/api/v1/carts/{cart_id}/items/'

        v1 = self.client.post(
            items_url,
            {
                'product_id': self.product.id,
                'quantity': 1,
                'selected_variant': 'Obsidian Black / L',
            },
            format='json',
        )
        self.assertEqual(v1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(v1.data['selected_variant'], 'Obsidian Black / L')

        v2 = self.client.post(
            items_url,
            {
                'product_id': self.product.id,
                'quantity': 2,
                'selected_variant': 'Champagne Gold / M',
            },
            format='json',
        )
        self.assertEqual(v2.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(v1.data['id'], v2.data['id'])

        # Total cart items across variants = 3 -> stock check preserves 5 limit
        order_res = self.client.post(
            '/api/v1/orders/',
            {
                'cart_id': cart_id,
                'shipping_address': 'Banani Road 11, Dhaka',
                'contact_phone': '01711112222',
            },
            format='json',
        )
        self.assertEqual(order_res.status_code, status.HTTP_201_CREATED)
        variants_in_order = sorted(
            it['selected_variant'] for it in order_res.data['items']
        )
        self.assertEqual(
            variants_in_order,
            ['Champagne Gold / M', 'Obsidian Black / L'],
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 2)

        # Admin CouponViewSet CRUD works & customer blocked
        coupon_url = '/api/v1/coupons/'
        self.assertEqual(
            self.client.get(coupon_url).status_code, status.HTTP_403_FORBIDDEN
        )
        self.client.force_authenticate(user=self.admin)
        c_create = self.client.post(
            coupon_url,
            {'code': 'EID30', 'discount_percent': 30, 'is_active': True},
            format='json',
        )
        self.assertEqual(c_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(c_create.data['code'], 'EID30')

    def test_order_tracking_privacy_and_verification(self):
        self.client.force_authenticate(user=self.user_a)
        order_res = self.client.post(
            '/api/v1/orders/',
            {
                'items': [{'product_id': self.cheap_item.id, 'quantity': 1}],
                'shipping_address': 'House 19, Banani, Dhaka',
                'contact_phone': '+8801712345678',
                'recipient_name': 'Arif Rahman',
            },
            format='json',
        )
        self.assertEqual(order_res.status_code, status.HTTP_201_CREATED)
        order_id = order_res.data['id']

        # Owner can track by short prefix when signed in and sees full shipping address
        owner_track = self.client.get(f'/api/v1/orders/track/?order_id={order_id[:8]}')
        self.assertEqual(owner_track.status_code, status.HTTP_200_OK)
        self.assertEqual(owner_track.data['shipping_address'], 'House 19, Banani, Dhaka')

        # Other authenticated user cannot access Buyer A order tracking via prefix
        self.client.force_authenticate(user=self.user_b)
        other_track = self.client.get(f'/api/v1/orders/track/?order_id={order_id}')
        self.assertEqual(other_track.status_code, status.HTTP_403_FORBIDDEN)

        # Anonymous caller without contact blocked
        self.client.force_authenticate(user=None)
        anon_no_contact = self.client.get(f'/api/v1/orders/track/?order_id={order_id}')
        self.assertEqual(anon_no_contact.status_code, status.HTTP_403_FORBIDDEN)

        # Anonymous caller with wrong email blocked
        anon_bad = self.client.get(
            f'/api/v1/orders/track/?order_id={order_id}&contact=intruder@bazaro.com'
        )
        self.assertEqual(anon_bad.status_code, status.HTTP_403_FORBIDDEN)

        # Anonymous caller with verified phone receives sanitized summary without full address/PII
        anon_ok = self.client.get(
            f'/api/v1/orders/track/?order_id={order_id}&contact=01712345678'
        )
        self.assertEqual(anon_ok.status_code, status.HTTP_200_OK)
        self.assertNotIn('shipping_address', anon_ok.data)
        self.assertNotIn('user_email', anon_ok.data)
        self.assertEqual(anon_ok.data['destination_hint'], 'Dhaka')

    def test_transactional_emails_and_password_reset(self):
        mail.outbox.clear()
        self.client.force_authenticate(user=self.user_a)

        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post(
                '/api/v1/orders/',
                {'items': [{'product_id': self.cheap_item.id, 'quantity': 1}]},
                format='json',
            )
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            order_id = res.data['id']

            self.client.post(
                f'/api/v1/orders/{order_id}/confirm_payment/',
                {'payment_method': 'bKash MFS', 'transaction_id': 'BAZ-MAIL-01'},
                format='json',
            )

        self.assertGreaterEqual(len(mail.outbox), 2)
        self.assertIn('buyer_a@bazaro.com', mail.outbox[0].to)
        self.assertIn(order_id, mail.outbox[0].body)

        # Admin marks shipped -> email sent
        mail.outbox.clear()
        self.client.force_authenticate(user=self.admin)
        with self.captureOnCommitCallbacks(execute=True):
            ship_res = self.client.patch(
                f'/api/v1/orders/{order_id}/update_status/',
                {'status': Order.SHIPPED},
                format='json',
            )
            self.assertEqual(ship_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Dispatched', mail.outbox[0].subject)

        # Djoser forgot password endpoint triggers password reset email
        mail.outbox.clear()
        self.client.force_authenticate(user=None)
        with self.captureOnCommitCallbacks(execute=True):
            reset_res = self.client.post(
                '/api/v1/auth/users/reset_password/',
                {'email': 'buyer_a@bazaro.com'},
                format='json',
            )
        self.assertEqual(reset_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('password/reset/confirm/', mail.outbox[0].body)

    def test_payment_gateways_sslcommerz_and_stripe_sandbox(self):
        self.client.force_authenticate(user=self.user_a)
        order_res = self.client.post(
            '/api/v1/orders/',
            {'items': [{'product_id': self.cheap_item.id, 'quantity': 2}]},
            format='json',
        )
        self.assertEqual(order_res.status_code, status.HTTP_201_CREATED)
        order_id = order_res.data['id']  # $40 + $5 shipping = $45.00

        # Without gateway secrets, initiate_payment reports sandbox_ready cleanly
        fallback = self.client.post(
            f'/api/v1/orders/{order_id}/initiate_payment/',
            {'provider': 'sslcommerz'},
            format='json',
        )
        self.assertEqual(fallback.status_code, status.HTTP_200_OK)
        self.assertFalse(fallback.data['configured'])
        self.assertEqual(fallback.data['mode'], 'sandbox_ready')

        # With SSLCommerz credentials configured, initiation + verified callback mark PAID
        with override_settings(
            SSLCOMMERZ_STORE_ID='testbox_store',
            SSLCOMMERZ_STORE_PASSWD='testbox_pass',
        ):
            mock_init = Mock()
            mock_init.json.return_value = {
                'status': 'SUCCESS',
                'GatewayPageURL': 'https://sandbox.sslcommerz.com/EasyCheckOut/demo-session',
                'sessionkey': 'SESS-123',
            }
            mock_init.raise_for_status = Mock()

            with patch('order.gateways.requests.post', return_value=mock_init):
                init_res = self.client.post(
                    f'/api/v1/orders/{order_id}/initiate_payment/',
                    {'provider': 'sslcommerz'},
                    format='json',
                )
            self.assertEqual(init_res.status_code, status.HTTP_200_OK)
            self.assertEqual(init_res.data['mode'], 'redirect')
            tran_id = init_res.data['tran_id']

            # Forged callback signature must fail
            forged = self.client.post(
                '/api/v1/payments/sslcommerz/callback/',
                {'value_a': order_id, 'value_b': 'bad-sig', 'tran_id': tran_id, 'val_id': 'V1'},
                HTTP_ACCEPT='application/json',
            )
            self.assertEqual(forged.status_code, status.HTTP_400_BAD_REQUEST)

            # Valid callback with server-side validation settles order
            sig = _sign_order_token(order_id, tran_id)
            mock_val = Mock()
            mock_val.json.return_value = {
                'status': 'VALID',
                'amount': '45.00',
                'tran_id': tran_id,
                'card_type': 'BKASH-BKash',
                'bank_tran_id': 'BANK-SSL-777',
            }
            mock_val.raise_for_status = Mock()

            with patch('order.gateways.requests.get', return_value=mock_val):
                cb_res = self.client.post(
                    '/api/v1/payments/sslcommerz/callback/',
                    {
                        'value_a': order_id,
                        'value_b': sig,
                        'tran_id': tran_id,
                        'val_id': 'VAL-99',
                        'status': 'VALID',
                    },
                    HTTP_ACCEPT='application/json',
                )
            self.assertEqual(cb_res.status_code, status.HTTP_200_OK)
            self.assertEqual(cb_res.data['payment_status'], Order.PAYMENT_PAID)
            self.assertEqual(cb_res.data['transaction_id'], 'BANK-SSL-777')

        # Stripe verify_stripe settles unpaid order cleanly when mocked paid session returns
        order2_res = self.client.post(
            '/api/v1/orders/',
            {'items': [{'product_id': self.cheap_item.id, 'quantity': 1}]},
            format='json',
        )
        order2_id = order2_res.data['id']  # $20 + $5 = $25.00
        with override_settings(STRIPE_SECRET_KEY='sk_test_mock_key'):
            mock_stripe = Mock()
            mock_stripe.json.return_value = {
                'id': 'cs_test_123',
                'payment_status': 'paid',
                'client_reference_id': order2_id,
                'amount_total': 2500,
                'payment_intent': 'pi_test_999',
            }
            mock_stripe.raise_for_status = Mock()
            with patch('order.gateways.requests.get', return_value=mock_stripe):
                verify_res = self.client.post(
                    f'/api/v1/orders/{order2_id}/verify_stripe/',
                    {'session_id': 'cs_test_123'},
                    format='json',
                )
            self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
            self.assertEqual(verify_res.data['payment_status'], Order.PAYMENT_PAID)
            self.assertEqual(verify_res.data['payment_method'], 'Stripe Checkout')
