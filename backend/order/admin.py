from django.contrib import admin
from order.models import Cart, Cartitem, Coupon, Order, OrderItem


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'user',
        'status',
        'payment_status',
        'total_price',
        'created_at',
    ]
    list_filter = ['status', 'payment_status', 'created_at']


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_percent', 'is_active', 'used_count', 'usage_limit']


admin.site.register(Cartitem)
admin.site.register(OrderItem)
