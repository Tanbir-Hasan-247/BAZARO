from django.contrib import admin
from api.models import CampaignSetting, FooterSetting, NewsletterSubscriber


@admin.register(FooterSetting)
class FooterSettingAdmin(admin.ModelAdmin):
    list_display = ("brand_name", "brand_tagline", "email", "updated_at")


@admin.register(CampaignSetting)
class CampaignSettingAdmin(admin.ModelAdmin):
    list_display = ("top_bar_enabled", "top_bar_code", "flash_enabled", "flash_coupon_code", "updated_at")


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "source", "is_active", "subscribed_at")
    search_fields = ("email",)
    list_filter = ("is_active", "source")
