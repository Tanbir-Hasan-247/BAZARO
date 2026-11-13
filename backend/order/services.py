from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from product.models import Product
from .models import Cart, Coupon, Order, OrderItem


def _dispatch_order_email_on_commit(order_id, email_type="created", previous_status=""):
    def _send():
        from .emails import send_order_created_email, send_order_status_email

        order_obj = (
            Order.objects.select_related("user")
            .prefetch_related("items__product")
            .filter(pk=order_id)
            .first()
        )
        if not order_obj:
            return
        if email_type == "created":
            send_order_created_email(order_obj)
        else:
            send_order_status_email(order_obj, previous_status=previous_status)

    transaction.on_commit(_send)


class OrderService:
    FREE_SHIPPING_THRESHOLD = Decimal('50.00')
    STANDARD_SHIPPING_FEE = Decimal('5.00')

    @staticmethod
    def validate_coupon(code, subtotal=Decimal('0.00'), lock_row=False):
        clean_code = (code or '').strip().upper()
        if not clean_code:
            return None, Decimal('0.00')

        qs = Coupon.objects.all()
        if lock_row:
            qs = qs.select_for_update()

        coupon = qs.filter(code__iexact=clean_code, is_active=True).first()
        if not coupon:
            raise ValidationError({'coupon_code': f"Invalid or inactive coupon '{clean_code}'."})

        if coupon.valid_until and coupon.valid_until < timezone.now():
            raise ValidationError({'coupon_code': f"Coupon '{clean_code}' has expired."})

        if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
            raise ValidationError({'coupon_code': f"Coupon '{clean_code}' usage limit reached."})

        if subtotal < coupon.min_order_amount:
            raise ValidationError(
                {
                    'coupon_code': (
                        f"Minimum order of ${coupon.min_order_amount} required "
                        f"for coupon '{clean_code}'."
                    )
                }
            )

        discount = (subtotal * Decimal(coupon.discount_percent)) / Decimal('100')
        if coupon.max_discount_amount is not None:
            discount = min(discount, coupon.max_discount_amount)

        return coupon, discount.quantize(Decimal('0.01'))

    @staticmethod
    def create_order(
        user_id,
        cart_id=None,
        items_data=None,
        shipping_address='',
        contact_phone='',
        recipient_name='',
        payment_method='COD',
        transaction_id='',
        coupon_code='',
    ):
        with transaction.atomic():
            qty_by_product = {}
            variant_lines = {}
            cart = None

            if cart_id:
                try:
                    cart = Cart.objects.select_for_update().get(
                        pk=cart_id, user_id=user_id
                    )
                except Cart.DoesNotExist:
                    raise ValidationError({'cart_id': 'Cart not found for this user.'})

                cart_items = list(cart.items.select_related('product').all())
                if not cart_items:
                    raise ValidationError({'cart_id': 'Cart is empty.'})

                for ci in cart_items:
                    variant = (getattr(ci, 'selected_variant', '') or '').strip()[:120]
                    qty_by_product[ci.product_id] = (
                        qty_by_product.get(ci.product_id, 0) + ci.quantity
                    )
                    key = (ci.product_id, variant)
                    variant_lines[key] = variant_lines.get(key, 0) + ci.quantity
            elif items_data:
                for entry in items_data:
                    pid = int(entry['product_id'])
                    qty = int(entry['quantity'])
                    variant = (entry.get('selected_variant') or '').strip()[:120]
                    if qty < 1:
                        raise ValidationError({'items': 'Item quantity must be at least 1.'})
                    qty_by_product[pid] = qty_by_product.get(pid, 0) + qty
                    key = (pid, variant)
                    variant_lines[key] = variant_lines.get(key, 0) + qty
            else:
                raise ValidationError(
                    {'detail': 'Provide either a valid cart_id or non-empty items list.'}
                )

            if not qty_by_product:
                raise ValidationError({'detail': 'Order must contain at least one item.'})

            # Lock products in consistent ID order to prevent deadlocks
            sorted_ids = sorted(qty_by_product.keys())
            locked_products = {
                p.id: p
                for p in Product.objects.select_for_update()
                .filter(id__in=sorted_ids)
                .order_by('id')
            }

            if len(locked_products) != len(sorted_ids):
                missing = [pid for pid in sorted_ids if pid not in locked_products]
                raise ValidationError({'items': f'Products not found: {missing}'})

            # Enforce real inventory limits before deducting
            subtotal = Decimal('0.00')
            for pid in sorted_ids:
                product = locked_products[pid]
                req_qty = qty_by_product[pid]
                if product.stock < req_qty:
                    raise ValidationError(
                        {
                            'stock': (
                                f"Insufficient stock for '{product.name}'. "
                                f"Available: {product.stock}, Requested: {req_qty}."
                            )
                        }
                    )
                subtotal += product.price * req_qty

            subtotal = subtotal.quantize(Decimal('0.01'))

            # Validate & apply coupon server-side
            coupon = None
            discount_amount = Decimal('0.00')
            if coupon_code:
                coupon, discount_amount = OrderService.validate_coupon(
                    coupon_code, subtotal=subtotal, lock_row=True
                )

            shipping_fee = (
                Decimal('0.00')
                if subtotal > OrderService.FREE_SHIPPING_THRESHOLD
                else OrderService.STANDARD_SHIPPING_FEE
            )
            total_price = max(
                Decimal('0.00'),
                subtotal - discount_amount + shipping_fee,
            ).quantize(Decimal('0.01'))

            clean_txn = (transaction_id or '').strip()
            clean_method = (payment_method or 'COD').strip()

            order = Order.objects.create(
                user_id=user_id,
                status=Order.NOT_PAID,
                subtotal=subtotal,
                discount_amount=discount_amount,
                shipping_fee=shipping_fee,
                tax_amount=Decimal('0.00'),
                total_price=total_price,
                coupon_code=coupon.code if coupon else '',
                payment_status=Order.PAYMENT_PENDING,
                payment_method=clean_method,
                transaction_id=clean_txn,
                recipient_name=(recipient_name or '').strip(),
                shipping_address=(shipping_address or '').strip(),
                contact_phone=(contact_phone or '').strip(),
            )

            # Create order items and atomically decrement product stock
            for pid in sorted_ids:
                product = locked_products[pid]
                req_qty = qty_by_product[pid]
                product.stock -= req_qty
                product.save(update_fields=['stock', 'updated_at'])

            order_items = []
            for (pid, variant), line_qty in variant_lines.items():
                product = locked_products[pid]
                order_items.append(
                    OrderItem(
                        order=order,
                        product=product,
                        price=product.price,
                        quantity=line_qty,
                        total_price=(product.price * line_qty).quantize(Decimal('0.01')),
                        selected_variant=variant,
                    )
                )

            OrderItem.objects.bulk_create(order_items)

            if coupon:
                coupon.used_count += 1
                coupon.save(update_fields=['used_count'])

            if cart is not None:
                cart.delete()

            _dispatch_order_email_on_commit(order.id, 'created')
            return order

    @staticmethod
    def cancel_order(user, order):
        with transaction.atomic():
            locked_order = (
                Order.objects.select_for_update()
                .prefetch_related('items__product')
                .get(pk=order.pk)
            )

            if not user.is_staff and locked_order.user_id != user.id:
                raise PermissionDenied({'detail': 'You can only cancel your own order.'})

            if locked_order.status == Order.CANCELED:
                raise ValidationError({'detail': 'Order is already canceled.'})

            if not user.is_staff and locked_order.status in [
                Order.SHIPPED,
                Order.DELIVERED,
            ]:
                raise ValidationError(
                    {
                        'detail': (
                            f'Cannot cancel order after it has been '
                            f'{locked_order.status.lower()}.'
                        )
                    }
                )

            # Restore inventory idempotently in sorted product order
            if not locked_order.stock_restored:
                items = list(locked_order.items.all())
                pid_to_qty = {}
                for it in items:
                    pid_to_qty[it.product_id] = pid_to_qty.get(it.product_id, 0) + it.quantity

                if pid_to_qty:
                    products = (
                        Product.objects.select_for_update()
                        .filter(id__in=sorted(pid_to_qty.keys()))
                        .order_by('id')
                    )
                    for prod in products:
                        prod.stock += pid_to_qty[prod.id]
                        prod.save(update_fields=['stock', 'updated_at'])

                locked_order.stock_restored = True

            if locked_order.payment_status == Order.PAYMENT_PAID:
                locked_order.payment_status = Order.PAYMENT_REFUNDED

            prev_status = locked_order.status
            locked_order.status = Order.CANCELED
            locked_order.save()
            _dispatch_order_email_on_commit(locked_order.id, 'status', prev_status)
            return locked_order

    @staticmethod
    def update_order_status(user, order, new_status, payment_status=None):
        if not user.is_staff:
            raise PermissionDenied({'detail': 'Only staff admins can update order status.'})

        if new_status == Order.CANCELED:
            return OrderService.cancel_order(user=user, order=order)

        with transaction.atomic():
            locked_order = Order.objects.select_for_update().get(pk=order.pk)
            if locked_order.status == Order.CANCELED:
                raise ValidationError({'detail': 'Cannot reactivate a canceled order.'})

            prev_status = locked_order.status
            locked_order.status = new_status
            if payment_status:
                locked_order.payment_status = payment_status
            locked_order.save()
            if prev_status != new_status or payment_status:
                _dispatch_order_email_on_commit(locked_order.id, 'status', prev_status)
            return locked_order

    @staticmethod
    def confirm_payment(user, order, payment_method='', transaction_id=''):
        with transaction.atomic():
            locked_order = Order.objects.select_for_update().get(pk=order.pk)
            if not user.is_staff and locked_order.user_id != user.id:
                raise PermissionDenied({'detail': 'You cannot confirm payment for another user.'})

            if locked_order.status == Order.CANCELED:
                raise ValidationError({'detail': 'Cannot pay for a canceled order.'})

            if locked_order.payment_status == Order.PAYMENT_PAID:
                return locked_order

            clean_txn = (transaction_id or '').strip()
            if not clean_txn:
                raise ValidationError({'transaction_id': 'A valid transaction_id is required.'})

            prev_status = locked_order.status
            if payment_method:
                locked_order.payment_method = payment_method.strip()
            locked_order.transaction_id = clean_txn
            locked_order.payment_status = Order.PAYMENT_PAID
            if locked_order.status == Order.NOT_PAID:
                locked_order.status = Order.READY_TO_SHIP
            locked_order.save()
            _dispatch_order_email_on_commit(locked_order.id, 'status', prev_status)
            return locked_order
