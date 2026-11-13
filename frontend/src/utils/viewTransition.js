import { flushSync } from "react-dom";

/**
 * Progressive SPA navigation wrapped in the View Transitions API.
 * Morphs a matching product card photo into `ProductDetail` when supported,
 * passes preview data so the detail view renders immediately with zero flicker,
 * and cleans up temporary transition names cleanly after resolution.
 */
export function navigateWithTransition(
  navigate,
  to,
  { previewProduct = null, imageElement = null, focusSelector = "#product-detail-heading" } = {}
) {
  const navOptions = previewProduct ? { state: { previewProduct } } : undefined;

  if (
    typeof document === "undefined" ||
    !document.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    navigate(to, navOptions);
    if (focusSelector) {
      requestAnimationFrame(() => {
        document.querySelector(focusSelector)?.focus({ preventScroll: true });
      });
    }
    return;
  }

  if (imageElement) {
    // Clear any stray view-transition-name first so only 1 pair matches
    document.querySelectorAll('[data-vt-active="true"]').forEach((el) => {
      el.style.viewTransitionName = "";
      el.removeAttribute("data-vt-active");
    });
    imageElement.setAttribute("data-vt-active", "true");
    imageElement.style.viewTransitionName = "bazaro-product-hero";
  }

  const transition = document.startViewTransition(() => {
    flushSync(() => {
      navigate(to, navOptions);
    });
  });

  transition.finished.finally(() => {
    if (imageElement && imageElement.isConnected) {
      imageElement.style.viewTransitionName = "";
      imageElement.removeAttribute("data-vt-active");
    }
    if (focusSelector) {
      document.querySelector(focusSelector)?.focus({ preventScroll: true });
    }
  });
}
