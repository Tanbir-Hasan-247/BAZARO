import { useEffect, useRef } from "react";

/**
 * Coordinates an HTML <dialog> modal with showModal(), native closedby="any",
 * and a bounding-box light-dismiss fallback when closedBy is unsupported.
 */
export function useAccessibleDialog(isOpen, onClose) {
  const dialogRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose?.();
    };

    // Fallback for browsers without native dialog closedby="any" support:
    // require both pointerdown and pointerup outside dialog content so text-selection drags never dismiss.
    let pressedOutside = false;
    const isOutsideContent = (event) => {
      const target = contentRef.current || dialog;
      if (!target) return event.target === dialog;
      const r = target.getBoundingClientRect();
      return (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      );
    };

    const handlePointerDown = (event) => {
      if ("closedBy" in HTMLDialogElement.prototype) return;
      pressedOutside = isOutsideContent(event);
    };

    const handlePointerUp = (event) => {
      if ("closedBy" in HTMLDialogElement.prototype) return;
      if (pressedOutside && isOutsideContent(event)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("pointerdown", handlePointerDown);
    dialog.addEventListener("pointerup", handlePointerUp);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onClose]);

  return { dialogRef, contentRef };
}
