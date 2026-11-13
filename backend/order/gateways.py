import hashlib
import hmac
from decimal import Decimal, InvalidOperation
from uuid import uuid4

import requests
from django.conf import settings
from rest_framework.exceptions import ValidationError

from .models import Order
from .services import OrderService


def _sign_order_token(order_id: str, tran_id: str) -> str:
    secret = (settings.SECRET_KEY or "bazaro-dev-secret").encode("utf-8")
    payload = f"{order_id}:{tran_id}".encode("utf-8")
    return hmac.new(secret, payload, hashlib.sha256).hexdigest()[:32]


def _verify_order_token(order_id: str, tran_id: str, token: str) -> bool:
    expected = _sign_order_token(order_id, tran_id)
    return hmac.compare_digest(expected, (token or "").strip())


class PaymentGatewayService:
    SSL_SANDBOX_INIT = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
    SSL_LIVE_INIT = "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
    SSL_SANDBOX_VALIDATE = "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
    SSL_LIVE_VALIDATE = "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
    STRIPE_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions"

    @classmethod
    def _ssl_urls(cls):
        is_sandbox = getattr(settings, "SSLCOMMERZ_IS_SANDBOX", True)
        return (
            cls.SSL_SANDBOX_INIT if is_sandbox else cls.SSL_LIVE_INIT,
            cls.SSL_SANDBOX_VALIDATE if is_sandbox else cls.SSL_LIVE_VALIDATE,
        )

    @classmethod
    def initiate(cls, order: Order, provider: str = "sslcommerz", backend_base_url: str = "", frontend_base_url: str = ""):
        clean_provider = (provider or "sslcommerz").strip().lower()
        if order.status == Order.CANCELED:
            raise ValidationError({"detail": "Cannot initiate payment for a canceled order."})
        if order.payment_status == Order.PAYMENT_PAID:
            return {
                "mode": "already_paid",
                "configured": True,
                "provider": clean_provider,
                "order_id": str(order.id),
                "tran_id": order.transaction_id,
            }

        backend_base = (backend_base_url or getattr(settings, "BACKEND_PUBLIC_URL", "http://127.0.0.1:8000")).rstrip("/")
        frontend_base = (frontend_base_url or getattr(settings, "FRONTEND_PUBLIC_URL", "http://localhost:5173")).rstrip("/")
        tran_id = f"BAZ-{str(order.id)[:8].upper()}-{uuid4().hex[:6].upper()}"

        if clean_provider == "sslcommerz":
            store_id = getattr(settings, "SSLCOMMERZ_STORE_ID", "").strip()
            store_passwd = getattr(settings, "SSLCOMMERZ_STORE_PASSWD", "").strip()
            if not store_id or not store_passwd:
                return {
                    "mode": "sandbox_ready",
                    "configured": False,
                    "provider": "sslcommerz",
                    "tran_id": tran_id,
                    "detail": (
                        "SSLCommerz Sandbox credentials are not configured in backend .env; "
                        "built-in BAZARO Settlement Sandbox remains available."
                    ),
                }

            init_url, _ = cls._ssl_urls()
            callback_url = f"{backend_base}/api/v1/payments/sslcommerz/callback/"
            sig = _sign_order_token(str(order.id), tran_id)
            payload = {
                "store_id": store_id,
                "store_passwd": store_passwd,
                "total_amount": f"{order.total_price:.2f}",
                "currency": "USD",
                "tran_id": tran_id,
                "success_url": callback_url,
                "fail_url": callback_url,
                "cancel_url": callback_url,
                "ipn_url": callback_url,
                "shipping_method": "Courier",
                "product_name": f"BAZARO Order #{str(order.id)[:8].upper()}",
                "product_category": "Luxury Retail",
                "product_profile": "general",
                "cus_name": order.recipient_name or order.user.email.split("@")[0],
                "cus_email": order.user.email,
                "cus_add1": order.shipping_address or "Banani, Dhaka",
                "cus_city": "Dhaka",
                "cus_country": "Bangladesh",
                "cus_phone": order.contact_phone or "01700000000",
                "ship_name": order.recipient_name or "BAZARO Patron",
                "ship_add1": order.shipping_address or "Banani, Dhaka",
                "ship_city": "Dhaka",
                "ship_country": "Bangladesh",
                "ship_postcode": "1213",
                "value_a": str(order.id),
                "value_b": sig,
            }
            resp = requests.post(init_url, data=payload, timeout=12)
            resp.raise_for_status()
            data = resp.json()
            gateway_url = data.get("GatewayPageURL")
            if data.get("status") != "SUCCESS" or not gateway_url:
                raise ValidationError(
                    {"detail": data.get("failedreason") or "Failed to initiate SSLCommerz session."}
                )
            return {
                "mode": "redirect",
                "configured": True,
                "provider": "sslcommerz",
                "gateway_url": gateway_url,
                "sessionkey": data.get("sessionkey", ""),
                "tran_id": tran_id,
            }

        if clean_provider == "stripe":
            secret_key = getattr(settings, "STRIPE_SECRET_KEY", "").strip()
            if not secret_key:
                return {
                    "mode": "sandbox_ready",
                    "configured": False,
                    "provider": "stripe",
                    "tran_id": tran_id,
                    "detail": (
                        "Stripe test secret key is not configured in backend .env; "
                        "built-in BAZARO Card Sandbox remains available."
                    ),
                }

            unit_amount = int((order.total_price * 100).quantize(Decimal("1")))
            data = {
                "mode": "payment",
                "client_reference_id": str(order.id),
                "customer_email": order.user.email,
                "success_url": f"{frontend_base}/track-order?order_id={order.id}&stripe_session={{CHECKOUT_SESSION_ID}}",
                "cancel_url": f"{frontend_base}/track-order?order_id={order.id}&payment=canceled",
                "line_items[0][quantity]": 1,
                "line_items[0][price_data][currency]": "usd",
                "line_items[0][price_data][unit_amount]": max(50, unit_amount),
                "line_items[0][price_data][product_data][name]": f"BAZARO Acquisition #{str(order.id)[:8].upper()}",
            }
            resp = requests.post(
                cls.STRIPE_SESSIONS_URL,
                data=data,
                headers={"Authorization": f"Bearer {secret_key}"},
                timeout=12,
            )
            resp.raise_for_status()
            session = resp.json()
            if not session.get("url"):
                raise ValidationError({"detail": "Stripe did not return a checkout URL."})
            return {
                "mode": "redirect",
                "configured": True,
                "provider": "stripe",
                "gateway_url": session["url"],
                "session_id": session.get("id", ""),
                "tran_id": session.get("id", tran_id),
            }

        raise ValidationError({"provider": f"Unsupported payment gateway '{clean_provider}'."})

    @classmethod
    def verify_sslcommerz_callback(cls, payload: dict):
        order_id = (payload.get("value_a") or "").strip()
        sig = (payload.get("value_b") or "").strip()
        tran_id = (payload.get("tran_id") or "").strip()
        val_id = (payload.get("val_id") or "").strip()
        raw_status = (payload.get("status") or "").strip().upper()

        if not order_id or not tran_id:
            raise ValidationError({"detail": "Missing order or transaction identifier."})

        order = Order.objects.select_related("user").filter(pk=order_id).first()
        if not order:
            raise ValidationError({"detail": "Order record not found."})

        if not _verify_order_token(str(order.id), tran_id, sig):
            raise ValidationError({"detail": "Invalid payment callback signature."})

        if raw_status in ("FAILED", "CANCELLED"):
            return order, raw_status.lower()

        store_id = getattr(settings, "SSLCOMMERZ_STORE_ID", "").strip()
        store_passwd = getattr(settings, "SSLCOMMERZ_STORE_PASSWD", "").strip()
        if not store_id or not store_passwd or not val_id:
            raise ValidationError({"detail": "SSLCommerz validation credentials or val_id missing."})

        _, validate_url = cls._ssl_urls()
        resp = requests.get(
            validate_url,
            params={
                "val_id": val_id,
                "store_id": store_id,
                "store_passwd": store_passwd,
                "format": "json",
            },
            timeout=12,
        )
        resp.raise_for_status()
        val_data = resp.json()

        val_status = (val_data.get("status") or "").strip().upper()
        if val_status not in ("VALID", "VALIDATED"):
            raise ValidationError({"detail": "SSLCommerz transaction could not be validated."})

        try:
            paid_amount = Decimal(str(val_data.get("amount", "0"))).quantize(Decimal("0.01"))
        except (InvalidOperation, ValueError):
            paid_amount = Decimal("0.00")

        if paid_amount != order.total_price or (val_data.get("tran_id") or "").strip() != tran_id:
            raise ValidationError({"detail": "Validated amount or transaction ID mismatch."})

        card_type = (val_data.get("card_type") or "SSLCommerz Gateway").strip()
        bank_tran_id = (val_data.get("bank_tran_id") or val_id).strip()
        updated = OrderService.confirm_payment(
            user=order.user,
            order=order,
            payment_method=f"SSLCommerz ({card_type})",
            transaction_id=bank_tran_id,
        )
        return updated, "success"

    @classmethod
    def verify_stripe_session(cls, order: Order, session_id: str):
        secret_key = getattr(settings, "STRIPE_SECRET_KEY", "").strip()
        clean_session = (session_id or "").strip()
        if not secret_key or not clean_session:
            raise ValidationError({"detail": "Stripe configuration or session_id is missing."})

        resp = requests.get(
            f"{cls.STRIPE_SESSIONS_URL}/{clean_session}",
            headers={"Authorization": f"Bearer {secret_key}"},
            timeout=12,
        )
        resp.raise_for_status()
        session = resp.json()

        if session.get("payment_status") != "paid":
            raise ValidationError({"detail": "Stripe session has not been paid yet."})

        if (session.get("client_reference_id") or "") != str(order.id):
            raise ValidationError({"detail": "Stripe session does not belong to this order."})

        expected_cents = int((order.total_price * 100).quantize(Decimal("1")))
        if int(session.get("amount_total", 0)) != expected_cents:
            raise ValidationError({"detail": "Stripe settlement amount mismatch."})

        txn = session.get("payment_intent") or clean_session
        return OrderService.confirm_payment(
            user=order.user,
            order=order,
            payment_method="Stripe Checkout",
            transaction_id=str(txn),
        )
