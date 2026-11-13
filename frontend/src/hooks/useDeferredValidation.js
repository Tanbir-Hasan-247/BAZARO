import { useCallback, useState } from "react";

const SUPPORTS_USER_INVALID =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("selector(:user-invalid)");

/**
 * Manages deferred field validation aligned with :user-invalid semantics:
 * hints stay above inputs, errors render into aria-describedby after interaction
 * or submit, and legacy browsers receive the .user-invalid-fallback class.
 */
export function useDeferredValidation() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedInvalid, setTouchedInvalid] = useState({});

  const syncFieldState = useCallback((el, forceShow = false) => {
    if (!el || !el.name) return;
    const hasInteracted = forceShow || Boolean(el.dataset.interacted);
    const valid = el.checkValidity();

    if (!valid && hasInteracted) {
      if (!SUPPORTS_USER_INVALID) {
        el.classList.add("user-invalid-fallback");
      }
      setTouchedInvalid((prev) => (prev[el.name] ? prev : { ...prev, [el.name]: true }));
      setFieldErrors((prev) =>
        prev[el.name] === el.validationMessage
          ? prev
          : { ...prev, [el.name]: el.validationMessage }
      );
    } else if (valid) {
      if (!SUPPORTS_USER_INVALID) {
        el.classList.remove("user-invalid-fallback");
      }
      setTouchedInvalid((prev) => {
        if (!prev[el.name]) return prev;
        const next = { ...prev };
        delete next[el.name];
        return next;
      });
      setFieldErrors((prev) => {
        if (!prev[el.name]) return prev;
        const next = { ...prev };
        delete next[el.name];
        return next;
      });
    }
  }, []);

  const getFieldProps = useCallback(
    (name, { hintId, errorId, extraDescribedBy } = {}) => {
      const errorMsg = fieldErrors[name] || "";
      const isInvalid = Boolean(touchedInvalid[name] && errorMsg);

      const describedByParts = [];
      if (hintId) describedByParts.push(hintId);
      if (extraDescribedBy) describedByParts.push(extraDescribedBy);
      if (isInvalid && errorId) describedByParts.push(errorId);

      return {
        name,
        "aria-invalid": isInvalid ? "true" : undefined,
        "aria-describedby":
          describedByParts.length > 0 ? describedByParts.join(" ") : undefined,
        onBlur: (e) => {
          e.currentTarget.dataset.interacted = "true";
          syncFieldState(e.currentTarget, true);
        },
        onInput: (e) => {
          if (e.currentTarget.dataset.interacted) {
            syncFieldState(e.currentTarget, true);
          }
        },
        onInvalid: (e) => {
          e.preventDefault();
          e.currentTarget.dataset.interacted = "true";
          syncFieldState(e.currentTarget, true);
        },
      };
    },
    [fieldErrors, touchedInvalid, syncFieldState]
  );

  const validateFormOnSubmit = useCallback(
    (formEl) => {
      if (!formEl) return true;
      const controls = formEl.querySelectorAll("input, select, textarea");
      let firstInvalid = null;

      controls.forEach((el) => {
        if (!el.willValidate) return;
        el.dataset.interacted = "true";
        syncFieldState(el, true);
        if (!el.checkValidity() && !firstInvalid) {
          firstInvalid = el;
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return false;
      }
      return true;
    },
    [syncFieldState]
  );

  const resetValidation = useCallback(() => {
    setFieldErrors({});
    setTouchedInvalid({});
  }, []);

  return {
    fieldErrors,
    getFieldProps,
    validateFormOnSubmit,
    resetValidation,
  };
}
