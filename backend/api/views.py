from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from api.models import CampaignSetting, FooterSetting, NewsletterSubscriber
from api.permissions import IsAdminOrReadOnly
from api.serializers import (
    CampaignSettingSerializer,
    FooterSettingSerializer,
    NewsletterSubscriberSerializer,
)


class FooterSettingView(APIView):
    """Public read / Admin-only update endpoint for the global site footer."""

    permission_classes = [IsAdminOrReadOnly]

    def get(self, request):
        instance = FooterSetting.get_solo()
        serializer = FooterSettingSerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        instance = FooterSetting.get_solo()
        serializer = FooterSettingSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        instance = FooterSetting.get_solo()
        serializer = FooterSettingSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class CampaignSettingView(APIView):
    """Public read / Admin-only update endpoint for top ribbon and flash sale CMS."""

    permission_classes = [IsAdminOrReadOnly]

    def get(self, request):
        instance = CampaignSetting.get_solo()
        serializer = CampaignSettingSerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        instance = CampaignSetting.get_solo()
        serializer = CampaignSettingSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        instance = CampaignSetting.get_solo()
        serializer = CampaignSettingSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class NewsletterSubscriberViewSet(ModelViewSet):
    """Public subscribe endpoint paired with admin-only subscriber management."""

    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAdminUser()]

    def create(self, request, *args, **kwargs):
        raw_email = (request.data.get("email") or "").strip().lower()
        source = (request.data.get("source") or "footer").strip()[:50] or "footer"

        # Validate format using serializer before upsert check
        serializer = self.get_serializer(
            data={"email": raw_email, "source": source}
        )
        existing = NewsletterSubscriber.objects.filter(email__iexact=raw_email).first()
        if existing:
            was_active = existing.is_active
            if not existing.is_active:
                existing.is_active = True
                existing.source = source
                existing.save(update_fields=["is_active", "source"])
            out = self.get_serializer(existing).data
            return Response(
                {
                    "detail": (
                        "You are already subscribed to Royal Dispatch."
                        if was_active
                        else "Welcome back to the Royal Dispatch."
                    ),
                    "already_subscribed": was_active,
                    "subscriber": out,
                },
                status=status.HTTP_200_OK,
            )

        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            {
                "detail": "Welcome to the Royal Dispatch.",
                "already_subscribed": False,
                "subscriber": self.get_serializer(instance).data,
            },
            status=status.HTTP_201_CREATED,
        )
