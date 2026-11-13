from django.db import models


def default_collections_links():
    return [
        {"label": "All Masterpieces", "to": "/shop"},
        {"label": "Electronics", "to": "/shop?category=electronics"},
        {"label": "Watches & Horology", "to": "/shop?category=watches%20%26%20horology"},
        {"label": "Vault Flash Deals", "to": "/shop?filter=deals"},
        {"label": "Checkout Bag", "to": "/cart"},
    ]


def default_patron_care_links():
    return [
        {"label": "Order Tracking", "to": "/track-order"},
        {"label": "Patron Portal", "to": "/dashboard"},
        {"label": "Member Sign In", "to": "/login"},
        {"label": "Join BAZARO", "to": "/register"},
        {"label": "Admin Console", "to": "/admin-dashboard"},
    ]


def default_payment_badges():
    return ["bKash", "Nagad", "VISA", "Mastercard"]


class FooterSetting(models.Model):
    """Singleton configuration controlling the entire public storefront footer."""

    brand_name = models.CharField(max_length=80, default="BAZARO")
    brand_tagline = models.CharField(max_length=120, default="Apnar Desher Bazaar")
    logo_url = models.CharField(max_length=300, default="/bazaro-icon.png")
    description = models.TextField(
        default=(
            "Bangladesh's flagship luxury commerce maison — uniting curated "
            "electronics, heritage artisans, insured nationwide dispatch, and "
            "effortless digital checkout."
        )
    )
    github_url = models.URLField(
        max_length=300, blank=True, default="https://github.com/ashrafulx"
    )
    linkedin_url = models.URLField(
        max_length=300, blank=True, default="https://www.linkedin.com/in/ashrafulx"
    )
    instagram_url = models.URLField(max_length=300, blank=True, default="")
    facebook_url = models.URLField(max_length=300, blank=True, default="")
    authenticity_badge = models.CharField(
        max_length=80, default="Verified Authenticity"
    )

    collections_title = models.CharField(max_length=80, default="Collections")
    collections_links = models.JSONField(default=default_collections_links)

    patron_care_title = models.CharField(max_length=80, default="Patron Care")
    patron_care_links = models.JSONField(default=default_patron_care_links)

    dispatch_title = models.CharField(max_length=80, default="The Royal Dispatch")
    address = models.CharField(
        max_length=255, default="Road 11, Banani Atelier, Dhaka 1213, Bangladesh"
    )
    phone = models.CharField(max_length=80, default="+880 1800-BAZARO (229276)")
    email = models.EmailField(max_length=120, default="concierge@bazaro.com.bd")
    newsletter_hint = models.CharField(
        max_length=220,
        default="Receive private releases and vault coupon codes (e.g. name@domain.com)",
    )
    newsletter_placeholder = models.CharField(
        max_length=120, default="you@example.com"
    )

    copyright_text = models.CharField(
        max_length=200, default="Apnar Desher Bazaar. All rights reserved."
    )
    settlement_label = models.CharField(
        max_length=80, default="Trusted Settlement:"
    )
    payment_badges = models.JSONField(default=default_payment_badges)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Footer Setting"
        verbose_name_plural = "Footer Settings"

    def __str__(self):
        return f"Footer Configuration ({self.brand_name})"

    @classmethod
    def get_solo(cls):
        """Return the singleton footer setting row, creating defaults if missing."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class CampaignSetting(models.Model):
    """Singleton configuration for top announcement ribbon and flash sale vault."""

    top_bar_enabled = models.BooleanField(default=True)
    top_bar_badge = models.CharField(max_length=60, default="ROYAL ATELIER OFFER")
    top_bar_message = models.CharField(
        max_length=220,
        default="Complimentary Delivery above $50 • Unlock 20% off with code",
    )
    top_bar_code = models.CharField(max_length=40, blank=True, default="BAZARO20")
    top_bar_cta_label = models.CharField(max_length=60, default="Explore Vault")
    top_bar_cta_to = models.CharField(max_length=200, default="/shop")

    flash_enabled = models.BooleanField(default=True)
    flash_badge = models.CharField(max_length=60, default="PRIVATE VAULT OFFER")
    flash_title = models.CharField(max_length=140, default="Atelier Flash Sale —")
    flash_highlight = models.CharField(max_length=60, default="Save 20%")
    flash_description = models.TextField(
        default=(
            "Curated flagship electronics, signature watches & royal fragrances. "
            "Apply the vault code at settlement."
        )
    )
    flash_coupon_code = models.CharField(max_length=40, blank=True, default="BAZARO20")
    flash_cta_label = models.CharField(max_length=60, default="Claim 20% Off")
    flash_cta_to = models.CharField(max_length=200, default="/shop")
    flash_ends_at = models.DateTimeField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Campaign & Announcement Setting"
        verbose_name_plural = "Campaign & Announcement Settings"

    def __str__(self):
        return f"Campaign Settings ({self.flash_coupon_code or 'No Code'})"

    @classmethod
    def get_solo(cls):
        """Return the singleton campaign setting row, creating defaults if missing."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class NewsletterSubscriber(models.Model):
    """Stores patron email subscriptions captured from the storefront footer."""

    email = models.EmailField(unique=True)
    source = models.CharField(max_length=50, default="footer")
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-subscribed_at"]
        verbose_name = "Newsletter Subscriber"
        verbose_name_plural = "Newsletter Subscribers"

    def __str__(self):
        return self.email
