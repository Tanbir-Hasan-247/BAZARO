from rest_framework import serializers
from api.models import CampaignSetting, FooterSetting, NewsletterSubscriber


def _is_safe_destination(value: str, allow_relative: bool = True) -> bool:
    """Ensure a URL or internal route is safe against script/data URI injection."""
    cleaned = value.strip()
    if not cleaned:
        return False
    lowered = cleaned.lower()
    if lowered.startswith(("javascript:", "vbscript:", "data:")):
        return False
    if allow_relative and cleaned.startswith("/"):
        return True
    return lowered.startswith(("http://", "https://", "mailto:", "tel:"))


def _validate_nav_links(value, field_label: str):
    if not isinstance(value, list):
        raise serializers.ValidationError(f"{field_label} must be a list of link objects.")
    if len(value) > 12:
        raise serializers.ValidationError(f"{field_label} cannot exceed 12 links.")

    cleaned = []
    for idx, item in enumerate(value):
        if not isinstance(item, dict):
            raise serializers.ValidationError(
                f"Entry #{idx + 1} in {field_label} must be an object with 'label' and 'to'."
            )
        label = str(item.get("label", "")).strip()
        to = str(item.get("to", "")).strip()
        if not label:
            raise serializers.ValidationError(
                f"Entry #{idx + 1} in {field_label} requires a non-empty label."
            )
        if not _is_safe_destination(to, allow_relative=True):
            raise serializers.ValidationError(
                f"Entry '{label}' has an invalid or unsafe destination URL."
            )
        cleaned.append({"label": label[:80], "to": to[:240]})
    return cleaned


class FooterSettingSerializer(serializers.ModelSerializer):
    """Validates and serializes the editable global footer CMS record."""

    class Meta:
        model = FooterSetting
        fields = [
            "brand_name",
            "brand_tagline",
            "logo_url",
            "description",
            "github_url",
            "linkedin_url",
            "instagram_url",
            "facebook_url",
            "authenticity_badge",
            "collections_title",
            "collections_links",
            "patron_care_title",
            "patron_care_links",
            "dispatch_title",
            "address",
            "phone",
            "email",
            "newsletter_hint",
            "newsletter_placeholder",
            "copyright_text",
            "settlement_label",
            "payment_badges",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate_logo_url(self, value):
        if not _is_safe_destination(value, allow_relative=True):
            raise serializers.ValidationError(
                "Logo URL must start with '/', 'http://', or 'https://'."
            )
        return value.strip()

    def validate_collections_links(self, value):
        return _validate_nav_links(value, "collections_links")

    def validate_patron_care_links(self, value):
        return _validate_nav_links(value, "patron_care_links")

    def validate_payment_badges(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("payment_badges must be a list of strings.")
        cleaned = [str(item).strip()[:40] for item in value if str(item).strip()]
        if len(cleaned) > 10:
            raise serializers.ValidationError("payment_badges cannot exceed 10 items.")
        return cleaned


class CampaignSettingSerializer(serializers.ModelSerializer):
    """Validates and serializes singleton announcement ribbon and flash sale CMS fields."""

    class Meta:
        model = CampaignSetting
        fields = [
            "id",
            "top_bar_enabled",
            "top_bar_badge",
            "top_bar_message",
            "top_bar_code",
            "top_bar_cta_label",
            "top_bar_cta_to",
            "flash_enabled",
            "flash_badge",
            "flash_title",
            "flash_highlight",
            "flash_description",
            "flash_coupon_code",
            "flash_cta_label",
            "flash_cta_to",
            "flash_ends_at",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate_top_bar_cta_to(self, value):
        if not _is_safe_destination(value, allow_relative=True):
            raise serializers.ValidationError(
                "Destination must start with '/', 'http://', or 'https://'."
            )
        return value.strip()

    def validate_flash_cta_to(self, value):
        if not _is_safe_destination(value, allow_relative=True):
            raise serializers.ValidationError(
                "Destination must start with '/', 'http://', or 'https://'."
            )
        return value.strip()


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    """Serializes newsletter email subscriptions for storefront and admin viewer."""

    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "source", "is_active", "subscribed_at"]
        read_only_fields = ["id", "subscribed_at"]

    def validate_email(self, value):
        return (value or "").strip().lower()
