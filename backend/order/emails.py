import html
import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def _build_tracking_url(order_id):
    base = getattr(settings, "FRONTEND_PUBLIC_URL", "http://localhost:5173").rstrip("/")
    return f"{base}/track-order?order_id={order_id}"


def _send_order_email(order, subject, heading, intro_text):
    recipient_email = getattr(getattr(order, "user", None), "email", "")
    if not recipient_email:
        return False

    tracking_url = _build_tracking_url(order.id)
    short_ref = str(order.id)[:8].upper()
    items = list(order.items.select_related("product").all())

    lines_txt = []
    lines_html = []
    for item in items:
        name = item.product.name if item.product else "Curated Piece"
        variant_note = f" [{item.selected_variant}]" if item.selected_variant else ""
        lines_txt.append(f"  - {name}{variant_note} x {item.quantity}: ${item.total_price}")
        lines_html.append(
            f"<tr>"
            f"<td style='padding:8px 0;border-bottom:1px solid #ece3d2;color:#1F1916;'>"
            f"{html.escape(name)}{html.escape(variant_note)} &times; {item.quantity}</td>"
            f"<td style='padding:8px 0;border-bottom:1px solid #ece3d2;text-align:right;font-weight:600;color:#1F1916;'>"
            f"${item.total_price}</td>"
            f"</tr>"
        )

    items_block_txt = "\n".join(lines_txt) or "  - Curated Maison Order"
    items_block_html = "".join(lines_html)

    text_body = (
        f"BAZARO — Apnar Desher Bazaar\n"
        f"{heading}\n\n"
        f"{intro_text}\n\n"
        f"Order Reference: #{short_ref} ({order.id})\n"
        f"Fulfillment Status: {order.status}\n"
        f"Payment Status: {order.payment_status} ({order.payment_method})\n"
        f"{f'Transaction Ref: {order.transaction_id}\n' if order.transaction_id else ''}\n"
        f"Items:\n{items_block_txt}\n\n"
        f"Total Payable: ${order.total_price}\n"
        f"Track Your Parcel: {tracking_url}\n\n"
        f"Warm regards,\nBAZARO Royal Concierge\n"
    )

    html_body = f"""
    <div style="background:#FAF5EB;padding:28px;font-family:Georgia,serif;color:#1F1916;">
      <div style="max-width:600px;margin:0 auto;background:#FDF9F1;border:1px solid #C59B4B;border-radius:18px;overflow:hidden;">
        <div style="background:#0D0A08;padding:22px 26px;text-align:center;border-bottom:1px solid rgba(197,155,75,0.35);">
          <p style="margin:0;color:#E5C77A;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:sans-serif;">
            BAZARO &bull; Apnar Desher Bazaar
          </p>
          <h1 style="margin:8px 0 0;color:#FDF9F1;font-size:24px;font-weight:600;">
            {html.escape(heading)}
          </h1>
        </div>
        <div style="padding:26px;font-family:sans-serif;font-size:14px;line-height:1.6;">
          <p style="margin:0 0 16px;color:#4F4337;">{html.escape(intro_text)}</p>
          <div style="background:#F4EDE0;border-radius:12px;padding:14px 16px;margin-bottom:18px;font-size:13px;">
            <div><strong>Order Ref:</strong> #{short_ref}</div>
            <div><strong>Fulfillment:</strong> {html.escape(order.status)}</div>
            <div><strong>Payment:</strong> {html.escape(order.payment_status)} ({html.escape(order.payment_method)})</div>
            {f"<div><strong>Transaction:</strong> {html.escape(order.transaction_id)}</div>" if order.transaction_id else ""}
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
            {items_block_html}
            <tr>
              <td style="padding:12px 0 0;font-weight:700;color:#1F1916;">Total Settled / Payable</td>
              <td style="padding:12px 0 0;text-align:right;font-weight:700;color:#8E6A28;font-size:16px;">${order.total_price}</td>
            </tr>
          </table>
          <div style="text-align:center;margin-top:22px;">
            <a href="{html.escape(tracking_url)}" style="display:inline-block;background:#1A1512;color:#F6E3B4;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
              Track Live Parcel Status
            </a>
          </div>
        </div>
      </div>
    </div>
    """

    try:
        from_email = getattr(
            settings, "DEFAULT_FROM_EMAIL", "BAZARO Concierge <concierge@bazaro.com.bd>"
        )
        msg = EmailMultiAlternatives(subject, text_body, from_email, [recipient_email])
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        return True
    except Exception as exc:
        logger.warning("Order email dispatch skipped for %s: %s", order.id, exc)
        return False


def send_order_created_email(order):
    short_ref = str(order.id)[:8].upper()
    return _send_order_email(
        order,
        subject=f"BAZARO Order Confirmed (#{short_ref})",
        heading="Your Order Has Been Inscribed",
        intro_text=(
            "Thank you for acquiring from BAZARO. Our Banani atelier specialists have "
            "received your reservation and reserved inventory for dispatch."
        ),
    )


def send_order_status_email(order, previous_status=None):
    short_ref = str(order.id)[:8].upper()
    if order.payment_status == order.PAYMENT_PAID and previous_status == order.NOT_PAID:
        subject = f"BAZARO Settlement Confirmed (#{short_ref})"
        heading = "Payment Authenticated"
        intro = (
            "Your digital settlement is verified. Your curated pieces are now "
            "entering atelier packaging for priority dispatch."
        )
    elif order.status == order.SHIPPED:
        subject = f"BAZARO Parcel Dispatched (#{short_ref})"
        heading = "Your Parcel Is On Its Way"
        intro = "Your insured BAZARO shipment has left our Banani atelier with priority courier."
    elif order.status == order.DELIVERED:
        subject = f"BAZARO Order Delivered (#{short_ref})"
        heading = "Edition Delivered"
        intro = "Your BAZARO order has been marked delivered. We hope you cherish every detail."
    elif order.status == order.CANCELED:
        subject = f"BAZARO Order Canceled (#{short_ref})"
        heading = "Order Canceled & Inventory Released"
        intro = "Your order has been canceled cleanly and stock allocations have been restored."
    else:
        subject = f"BAZARO Order Update: {order.status} (#{short_ref})"
        heading = f"Status Updated: {order.status}"
        intro = "There has been a curated update on your BAZARO parcel progression."

    return _send_order_email(order, subject=subject, heading=heading, intro_text=intro)
