import { useState } from "react";
import { Link } from "react-router";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiMail,
  FiShield,
} from "react-icons/fi";
import apiClient from "../Services/api-client";
import { useDeferredValidation } from "../hooks/useDeferredValidation";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { fieldErrors, getFieldProps, validateFormOnSubmit } =
    useDeferredValidation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateFormOnSubmit(e.currentTarget)) return;

    setLoading(true);
    try {
      await apiClient.post("/auth/users/reset_password/", {
        email: email.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.email?.[0] ||
          err.response?.data?.detail ||
          "Could not process password recovery right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-surface="light"
      className="w-full min-h-screen bg-[#FAF5EB] pt-32 pb-20 px-4 sm:px-8 flex items-center justify-center relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[380px] rounded-full bg-[#C59B4B]/12 blur-[120px]"
      />

      <div className="w-full max-w-4xl rounded-[28px] overflow-hidden shadow-[0_32px_80px_-24px_rgba(13,10,8,0.3)] border border-[#C59B4B]/26 grid grid-cols-1 lg:grid-cols-12 relative z-10">
        {/* Left Architectural Obsidian Pillar */}
        <div
          data-surface="dark"
          className="lg:col-span-5 bg-[#0D0A08] bazaro-grain text-[#FAF5EB] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-5 rounded-t-[150px] rounded-b-2xl border border-[#C59B4B]/18"
          />

          <div className="relative z-10 text-center flex flex-col items-center pt-4">
            <div className="w-14 h-14 rounded-full bg-[#FAF5EB] p-1.5 border border-[#C59B4B] shadow-lg mb-5">
              <img
                src="/bazaro-icon.png"
                alt="BAZARO Crest"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.26em] text-[#C59B4B] font-semibold mb-2">
              Patron Recovery
            </span>
            <h1 className="font-serif-editorial text-3xl font-semibold text-[#FDF9F1]">
              Restore Access
            </h1>
            <p className="mt-4 text-xs sm:text-sm text-[#B8AB98] leading-relaxed max-w-xs">
              Enter your registered patron email and our concierge will dispatch a
              tokenized key link to reset your vault passphrase.
            </p>
          </div>

          <div className="relative z-10 mt-10 pt-5 border-t border-[#C59B4B]/18 flex items-center gap-2.5 text-xs text-[#C59B4B]">
            <FiShield className="shrink-0" />
            <span>Single-use cryptographic reset token</span>
          </div>
        </div>

        {/* Right Editorial Recovery Form */}
        <div className="lg:col-span-7 bg-[#FDF9F1] p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7D5E26] hover:text-[#1F1916] transition-colors mb-4"
            >
              <FiArrowLeft />
              <span>Return to Sign In</span>
            </Link>
            <h2 className="font-serif-editorial text-3xl font-semibold text-[#1F1916]">
              Reset Your Passphrase
            </h2>
            <p className="text-xs sm:text-sm text-[#5C4E41] mt-1">
              Provide the email address associated with your BAZARO patron account.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5"
            >
              <FiAlertCircle className="text-base shrink-0 text-red-700" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="p-6 rounded-2xl bg-[#F4EDE0] border border-[#C59B4B]/30 space-y-4">
              <div className="flex items-center gap-3 text-[#1F1916]">
                <FiCheckCircle className="w-6 h-6 text-[#8E6A28] shrink-0" />
                <div>
                  <h3 className="font-serif-editorial text-xl font-semibold">
                    Recovery Dispatch Sent
                  </h3>
                  <p className="text-xs text-[#5C4E41]">
                    If an account exists for <strong>{email}</strong>, we have
                    dispatched password reset instructions.
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-[#6E5F50] border-t border-[#C59B4B]/20 pt-3">
                Note for local preview: check your inbox or the Django server
                terminal console output to open your{" "}
                <code>/password/reset/confirm/...</code> recovery link.
              </p>
              <Link
                to="/login"
                className="bazaro-editorial-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1A1512] text-[#F6E3B4] text-xs font-semibold uppercase tracking-[0.16em]"
              >
                <span>Back to Sign In</span>
                <FiArrowRight />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="bazaro-field-group">
                <label
                  htmlFor="forgot-email"
                  className="block text-[11px] font-semibold text-[#1F1916] uppercase tracking-[0.16em] mb-1.5"
                >
                  Registered Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-3.5 text-[#8E6A28] text-sm pointer-events-none" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="patron@bazaro.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    {...getFieldProps("email", { errorId: "forgot-email-error" })}
                    className="bazaro-field-input w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#C59B4B]/30 text-xs sm:text-sm text-[#1F1916] placeholder-[#9E8F7E] focus:outline-none focus:border-[#C59B4B]"
                  />
                  {fieldErrors.email && (
                    <p
                      id="forgot-email-error"
                      className="bazaro-field-error"
                      data-visible="true"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bazaro-editorial-btn w-full py-3.5 rounded-full bg-[#1A1512] hover:bg-[#2F251D] text-[#F6E3B4] text-xs font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <span>
                  {loading ? "Dispatching Recovery..." : "Send Recovery Link"}
                </span>
                {!loading && <FiArrowRight className="text-sm text-[#E5C77A]" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
