from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import CampaignSetting, FooterSetting, NewsletterSubscriber

User = get_user_model()


class FooterSettingsApiTests(APITestCase):
    def setUp(self):
        self.url = "/api/v1/footer-settings/"
        self.customer = User.objects.create_user(
            email="patron@bazaro.com",
            password="StrongPass123!",
            is_active=True,
            is_staff=False,
        )
        self.admin = User.objects.create_user(
            email="staff@bazaro.com",
            password="StrongPass123!",
            is_active=True,
            is_staff=True,
        )

    def test_anonymous_can_read_default_footer_settings(self):
        res = self.client.get(self.url, HTTP_HOST="localhost")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["brand_name"], "BAZARO")
        self.assertEqual(res.data["brand_tagline"], "Apnar Desher Bazaar")
        self.assertIsInstance(res.data["collections_links"], list)
        self.assertGreaterEqual(len(res.data["collections_links"]), 1)
        self.assertIsInstance(res.data["payment_badges"], list)

    def test_non_admin_cannot_update_footer_settings(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.patch(
            self.url,
            {"brand_tagline": "Compromised Tagline"},
            format="json",
            HTTP_HOST="localhost",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_full_footer_and_xss_urls_rejected(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "brand_name": "BAZARO ATELIER",
            "brand_tagline": "Dhaka Luxury Maison",
            "address": "Gulshan Avenue, Dhaka 1212",
            "phone": "+880 1700-112233",
            "email": "atelier@bazaro.com.bd",
            "collections_links": [
                {"label": "Timepieces", "to": "/shop?category=watches"},
                {"label": "Royal Oud", "to": "/shop?category=oud"},
            ],
            "payment_badges": ["bKash", "Nagad", "AMEX"],
        }
        res = self.client.patch(self.url, payload, format="json", HTTP_HOST="localhost")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["brand_name"], "BAZARO ATELIER")
        self.assertEqual(len(res.data["collections_links"]), 2)
        self.assertEqual(res.data["payment_badges"], ["bKash", "Nagad", "AMEX"])
        self.assertEqual(FooterSetting.get_solo().address, "Gulshan Avenue, Dhaka 1212")

        # Reject javascript: URI injection
        bad_res = self.client.patch(
            self.url,
            {"collections_links": [{"label": "Evil", "to": "javascript:alert(1)"}]},
            format="json",
            HTTP_HOST="localhost",
        )
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)


class CampaignAndNewsletterApiTests(APITestCase):
    def setUp(self):
        self.campaign_url = "/api/v1/campaign-settings/"
        self.newsletter_url = "/api/v1/newsletter/"
        self.customer = User.objects.create_user(
            email="patron2@bazaro.com",
            password="StrongPass123!",
            is_active=True,
            is_staff=False,
        )
        self.admin = User.objects.create_user(
            email="staff2@bazaro.com",
            password="StrongPass123!",
            is_active=True,
            is_staff=True,
        )

    def test_campaign_settings_public_read_and_admin_update(self):
        res = self.client.get(self.campaign_url, HTTP_HOST="localhost")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["top_bar_enabled"])
        self.assertTrue(res.data["flash_enabled"])

        # Customer blocked
        self.client.force_authenticate(user=self.customer)
        self.assertEqual(
            self.client.patch(
                self.campaign_url,
                {"flash_highlight": "Hacked"},
                format="json",
                HTTP_HOST="localhost",
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # Admin succeeds and unsafe CTA rejected
        self.client.force_authenticate(user=self.admin)
        ok_res = self.client.patch(
            self.campaign_url,
            {
                "top_bar_code": "ROYAL25",
                "flash_highlight": "Save 25%",
                "flash_coupon_code": "ROYAL25",
            },
            format="json",
            HTTP_HOST="localhost",
        )
        self.assertEqual(ok_res.status_code, status.HTTP_200_OK)
        self.assertEqual(CampaignSetting.get_solo().flash_coupon_code, "ROYAL25")

        bad_cta = self.client.patch(
            self.campaign_url,
            {"top_bar_cta_to": "javascript:alert(1)"},
            format="json",
            HTTP_HOST="localhost",
        )
        self.assertEqual(bad_cta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_newsletter_public_idempotent_subscribe_and_admin_list(self):
        # Anonymous can subscribe
        r1 = self.client.post(
            self.newsletter_url,
            {"email": "VIP.Patron@Bazaro.com"},
            format="json",
            HTTP_HOST="localhost",
        )
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)
        self.assertEqual(
            NewsletterSubscriber.objects.first().email,
            "vip.patron@bazaro.com",
        )

        # Duplicate subscribe handled cleanly with 200
        r2 = self.client.post(
            self.newsletter_url,
            {"email": "vip.patron@bazaro.com"},
            format="json",
            HTTP_HOST="localhost",
        )
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertTrue(r2.data["already_subscribed"])
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

        # Customer cannot list subscribers
        self.client.force_authenticate(user=self.customer)
        self.assertEqual(
            self.client.get(self.newsletter_url, HTTP_HOST="localhost").status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # Admin can list & delete subscribers
        self.client.force_authenticate(user=self.admin)
        list_res = self.client.get(self.newsletter_url, HTTP_HOST="localhost")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        sub_id = r1.data["subscriber"]["id"]
        del_res = self.client.delete(
            f"{self.newsletter_url}{sub_id}/",
            HTTP_HOST="localhost",
        )
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(NewsletterSubscriber.objects.count(), 0)
