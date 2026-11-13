import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useDeferredValidation } from "../hooks/useDeferredValidation";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiMapPin,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { fieldErrors, getFieldProps, validateFormOnSubmit } = useDeferredValidation();

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateFormOnSubmit(e.currentTarget)) return;

    setLoading(true);
    try {
      const res = await register(formData);
      if (res?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(res?.autoLoggedIn ? "/dashboard" : "/login");
        }, 1200);
      } else {
        setError(res?.message || "Could not complete registration. Check your input fields.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Registration error. Please review your details.");
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
        className="pointer-events-none absolute -top-24 right-1/4 w-[640px] h-[420px] rounded-full bg-[#C59B4B]/12 blur-[120px]"
      />

      <div className="w-full max-w-5xl rounded-[32px] overflow-hidden shadow-[0_32px_80px_-24px_rgba(13,10,8,0.35)] border border-[#C59B4B]/30 grid grid-cols-1 lg:grid-cols-12 relative z-10">
        {/* Left Obsidian Heritage Pillar */}
        <div
          data-surface="dark"
          className="lg:col-span-4 bazaro-grain bg-[#0D0A08] text-[#FAF5EB] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 rounded-t-[140px] rounded-b-2xl border border-[#C59B4B]/20"
          />

          <div className="relative z-10 text-center pt-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#FAF5EB] p-1.5 border-2 border-[#C59B4B] shadow-lg mb-4">
              <img
                src="/bazaro-icon.png"
                alt="BAZARO Crest"
                className="w-full h-full object-contain"
              />
            </div>

            <span className="text-[10px] uppercase tracking-[0.26em] text-[#C59B4B] font-bold mb-1.5">
              Royal Membership
            </span>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-semibold tracking-wide text-[#FAF5EB]">
              Join BAZARO
            </h1>
            <p className="mt-4 text-xs text-[#EFE7DA]/80 leading-relaxed max-w-xs">
              Create your patron profile for effortless one-click checkout, real-time parcel tracking, and exclusive voucher access.
            </p>
          </div>

          <div className="relative z-10 mt-8 pt-5 border-t border-[#C59B4B]/20 text-[11px] text-[#C59B4B] space-y-2">
            <p className="font-semibold text-[#FAF5EB]">Welcome Gift Code:</p>
            <span className="inline-block px-3 py-1 rounded-full bg-[#C59B4B]/20 border border-[#C59B4B]/40 text-[#E5C77A] font-mono font-bold tracking-wider">
              BAZARO20 (20% OFF)
            </span>
          </div>
        </div>

        {/* Right Ivory Registration Form */}
        <div className="lg:col-span-8 bg-[#FDFBF7] p-8 sm:p-10 bazaro-surface-light">
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#9C7E54] font-extrabold block mb-1">
              Create Account
            </span>
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#1F1916]">
              Patron Registration
            </h2>
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

          {success && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5"
            >
              <FiCheckCircle className="text-base shrink-0" />
              <span>Membership created! Redirecting to your portal...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bazaro-field-group">
                <label
                  htmlFor="reg-first"
                  className="block text-xs font-bold text-[#1F1916] uppercase tracking-wider mb-1"
                >
                  First Name *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                  <input
                    id="reg-first"
                    type="text"
                    required
                    autoComplete="given-name"
                    placeholder="Tanbir"
                    value={formData.first_name}
                    onChange={handleChange("first_name")}
                    {...getFieldProps("first_name", { errorId: "reg-first-error" })}
                    className="bazaro-field-input w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C59B4B]/35 text-xs sm:text-sm text-[#1F1916] focus:outline-none focus:border-[#C59B4B]"
                  />
                  {fieldErrors.first_name && (
                    <p id="reg-first-error" className="bazaro-field-error" data-visible="true">
                      {fieldErrors.first_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="bazaro-field-group">
                <label
                  htmlFor="reg-last"
                  className="block text-xs font-bold text-[#1F1916] uppercase tracking-wider mb-1"
                >
                  Last Name *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                  <input
                    id="reg-last"
                    type="text"
                    required
                    autoComplete="family-name"
                    placeholder="Hasan"
                    value={formData.last_name}
                    onChange={handleChange("last_name")}
                    {...getFieldProps("last_name", { errorId: "reg-last-error" })}
                    className="bazaro-field-input w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C59B4B]/35 text-xs sm:text-sm text-[#1F1916] focus:outline-none focus:border-[#C59B4B]"
                  />
                  {fieldErrors.last_name && (
                    <p id="reg-last-error" className="bazaro-field-error" data-visible="true">
                      {fieldErrors.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bazaro-field-group">
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-bold text-[#1F1916] uppercase tracking-wider mb-1"
                >
                  Email Address *
                </label>
                <p id="reg-email-hint" className="text-[11px] text-[#7A6656] mb-1">
                  Format: name@domain.com
                </p>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange("email")}
                    {...getFieldProps("email", {
                      hintId: "reg-email-hint",
                      errorId: "reg-email-error",
                    })}
                    className="bazaro-field-input w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C59B4B]/35 text-xs sm:text-sm text-[#1F1916] focus:outline-none focus:border-[#C59B4B]"
                  />
                  {fieldErrors.email && (
                    <p id="reg-email-error" className="bazaro-field-error" data-visible="true">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="bazaro-field-group">
                <label
                  htmlFor="reg-phone"
                  className="block text-xs font-bold text-[#1F1916] uppercase tracking-wider mb-1"
                >
                  Phone Number
                </label>
                <p id="reg-phone-hint" className="text-[11px] text-[#7A6656] mb-1">
                  Optional SMS delivery updates (e.g. +880 17XXXXXXXX)
                </p>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+880 17XXXXXXXX"
                    value={formData.phone_number}
                    onChange={handleChange("phone_number")}
                    {...getFieldProps("phone_number", {
                      hintId: "reg-phone-hint",
                      errorId: "reg-phone-error",
                    })}
                    className="bazaro-field-input w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C59B4B]/35 text-xs sm:text-sm text-[#1F1916] focus:outline-none focus:border-[#C59B4B]"
                  />
                  {fieldErrors.phone_number && (
                    <p id="reg-phone-error" className="bazaro-field-error" data-visible="true">
                      {fieldErrors.phone_number}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bazaro-field-group">
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold text-[#1F1916] uppercase tracking-wider mb-1"
              >
                Password *
              </label>
              <p id="reg-pass-hint" className="text-[11px] text-[#7A6656] mb-1">
                Use at least 8 characters with letters and numbers
              </p>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange("password")}
                  {...getFieldProps("password", {
                    hintId: "reg-pass-hint",
                    errorId: "reg-pass-error",
                  })}
                  className="bazaro-field-input w-full pl-10 pr-11 py-2.5 rounded-xl bg-white border border-[#C59B4B]/35 text-xs sm:text-sm text-[#1F1916] focus:outline-none focus:border-[#C59B4B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-2.5 p-0.5 text-[#7A6656] hover:text-[#1F1916] cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                </button>
                {fieldErrors.password && (
                  <p id="reg-pass-error" className="bazaro-field-error" data-visible="true">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="bazaro-field-group">
              <label
                htmlFor="reg-address"
                className="block text-xs font-bold text-[#1F1916] uppercase tracking-wider mb-1"
              >
                Default Delivery Address
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                <input
                  id="reg-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="House 42, Road 11, Banani, Dhaka"
                  value={formData.address}
                  onChange={handleChange("address")}
                  {...getFieldProps("address", { errorId: "reg-address-error" })}
                  className="bazaro-field-input w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C59B4B]/35 text-xs sm:text-sm text-[#1F1916] focus:outline-none focus:border-[#C59B4B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bazaro-editorial-btn w-full py-3.5 rounded-full bg-[#1A1512] hover:bg-[#2F251D] text-[#F6E3B4] text-xs font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? "Creating Account..." : "Complete Registration"}</span>
              {!loading && <FiArrowRight className="text-sm" />}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#6E5C4F]">
            Already a BAZARO Patron?{" "}
            <Link
              to="/login"
              className="font-bold text-[#9C7E54] hover:text-[#1F1916] underline decoration-[#C59B4B]/60 underline-offset-4 transition-colors"
            >
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
