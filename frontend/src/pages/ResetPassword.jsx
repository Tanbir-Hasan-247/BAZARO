import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
} from "react-icons/fi";
import apiClient from "../Services/api-client";
import { useDeferredValidation } from "../hooks/useDeferredValidation";

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const { fieldErrors, getFieldProps, validateFormOnSubmit } =
    useDeferredValidation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateFormOnSubmit(e.currentTarget)) return;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please enter the same new password.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/users/reset_password_confirm/", {
        uid,
        token,
        new_password: newPassword,
        re_new_password: confirmPassword,
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const data = err.response?.data;
      const firstErr =
        data?.new_password?.[0] ||
        data?.token?.[0] ||
        data?.uid?.[0] ||
        data?.detail ||
        "Invalid or expired reset link. Please request a fresh recovery email.";
      setError(firstErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-surface="light"
      className="w-full min-h-screen bg-[#FAF5EB] pt-32 pb-20 px-4 sm:px-8 flex items-center justify-center relative overflow-hidden"
    >
      <div className="w-full max-w-xl rounded-[28px] bg-[#FDF9F1] border border-[#C59B4B]/28 shadow-[0_30px_70px_-24px_rgba(13,10,8,0.28)] p-8 sm:p-11">
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8E6A28] block mb-1.5">
          BAZARO Vault Key
        </span>
        <h1 className="font-serif-editorial text-3xl font-semibold text-[#1F1916]">
          Establish New Passphrase
        </h1>
        <p className="text-xs sm:text-sm text-[#5C4E41] mt-1.5 mb-6">
          Choose a strong password of at least 8 characters to secure your portal.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5"
          >
            <FiAlertCircle className="text-base shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="p-6 rounded-2xl bg-[#F4EDE0] border border-[#C59B4B]/30 space-y-4">
            <div className="flex items-center gap-3 text-[#1F1916]">
              <FiCheckCircle className="w-6 h-6 text-[#8E6A28] shrink-0" />
              <div>
                <h2 className="font-serif-editorial text-xl font-semibold">
                  Passphrase Updated
                </h2>
                <p className="text-xs text-[#5C4E41]">
                  Redirecting you to sign in with your new credentials...
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="bazaro-editorial-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1A1512] text-[#F6E3B4] text-xs font-semibold uppercase tracking-[0.16em]"
            >
              <span>Sign In Now</span>
              <FiArrowRight />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="bazaro-field-group">
              <label
                htmlFor="reset-pass"
                className="block text-[11px] font-semibold text-[#1F1916] uppercase tracking-[0.16em] mb-1.5"
              >
                New Password *
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-[#8E6A28] text-sm pointer-events-none" />
                <input
                  id="reset-pass"
                  type={showPass ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  {...getFieldProps("new_password", { errorId: "reset-pass-error" })}
                  className="bazaro-field-input w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-[#C59B4B]/30 text-xs sm:text-sm text-[#1F1916] focus:outline-none focus:border-[#C59B4B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-3 p-0.5 text-[#6E5F50] hover:text-[#1F1916]"
                >
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
                {fieldErrors.new_password && (
                  <p
                    id="reset-pass-error"
                    className="bazaro-field-error"
                    data-visible="true"
                  >
                    {fieldErrors.new_password}
                  </p>
                )}
              </div>
            </div>

            <div className="bazaro-field-group">
              <label
                htmlFor="reset-confirm"
                className="block text-[11px] font-semibold text-[#1F1916] uppercase tracking-[0.16em] mb-1.5"
              >
                Confirm Password *
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-[#8E6A28] text-sm pointer-events-none" />
                <input
                  id="reset-confirm"
                  type={showPass ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  {...getFieldProps("confirm_password", {
                    errorId: "reset-confirm-error",
                  })}
                  className="bazaro-field-input w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#C59B4B]/30 text-xs sm:text-sm text-[#1F1916] focus:outline-none focus:border-[#C59B4B]"
                />
                {fieldErrors.confirm_password && (
                  <p
                    id="reset-confirm-error"
                    className="bazaro-field-error"
                    data-visible="true"
                  >
                    {fieldErrors.confirm_password}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bazaro-editorial-btn w-full py-3.5 rounded-full bg-[#1A1512] hover:bg-[#2F251D] text-[#F6E3B4] text-xs font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? "Updating Passphrase..." : "Confirm New Passphrase"}</span>
              {!loading && <FiArrowRight className="text-sm text-[#E5C77A]" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
