from django.urls import include, path
from rest_framework_nested import routers

from api.views import FooterSettingView
from order.views import (
    CartItemViewset,
    CartViewset,
    CouponViewSet,
    OrderViewSet,
    SSLCommerzCallbackView,
)
from product.views import (
    CategoryViewSet,
    ProductImageViewSet,
    ProductViewSet,
    ReviewViewSet,
)

router = routers.DefaultRouter()
router.register('products', ProductViewSet, basename='products')
router.register('categories', CategoryViewSet)
router.register('carts', CartViewset, basename='carts')
router.register('orders', OrderViewSet, basename='orders')
router.register('coupons', CouponViewSet, basename='coupons')

product_router = routers.NestedDefaultRouter(router, 'products', lookup='product')
product_router.register('reviews', ReviewViewSet, basename='product-review')
product_router.register('images', ProductImageViewSet, basename='product-images')

cart_router = routers.NestedDefaultRouter(router, 'carts', lookup='cart')
cart_router.register('items', CartItemViewset, basename='cart-items')

from api.views import (
    CampaignSettingView,
    FooterSettingView,
    NewsletterSubscriberViewSet,
)
from product.views import WishlistViewSet

router.register('wishlist', WishlistViewSet, basename='wishlist')
router.register('newsletter', NewsletterSubscriberViewSet, basename='newsletter')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(product_router.urls)),
    path('', include(cart_router.urls)),
    path('footer-settings/', FooterSettingView.as_view(), name='footer-settings'),
    path('campaign-settings/', CampaignSettingView.as_view(), name='campaign-settings'),
    path('payments/sslcommerz/callback/', SSLCommerzCallbackView.as_view(), name='sslcommerz-callback'),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
]
