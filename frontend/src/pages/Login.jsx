import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useDeferredValidation } from "../hooks/useDeferredValidation";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiArrowRight,
  FiShield,
  FiAward,
} from "react-icons/fi";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { fieldErrors, getFieldProps, validateFormOnSubmit, resetValidation } =
    useDeferredValidation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateFormOnSubmit(e.currentTarget)) return;

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res?.success) {
        navigate(from, { replace: true });
      } else {
        setError(res?.message || "Invalid email or password. Please check and try again.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
    resetValidation();
  };

  return (
    <div
      data-surface="light"
      className="w-full min-h-screen bg-[#FAF5EB] pt-32 pb-20 px-4 sm:px-8 flex items-center justify-center relative overflow-hidden"
    >
      {/* Subtle Ambient Gold Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[420px] rounded-full bg-[#C59B4B]/12 blur-[120px]"
      />

      <div className="w-full max-w-5xl rounded-[32px] overflow-hidden shadow-[0_32px_80px_-24px_rgba(13,10,8,0.35)] border border-[#C59B4B]/30 grid grid-cols-1 lg:grid-cols-12 relative z-10">
        {/* Left Royal Architectural Panel */}
        <div
          data-surface="dark"
          className="lg:col-span-5 bazaro-grain bg-[#0D0A08] text-[#FAF5EB] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Decorative Heritage Arch Outline */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-5 rounded-t-[160px] rounded-b-2xl border border-[#C59B4B]/20"
          />

          <div className="relative z-10 flex flex-col items-center text-center pt-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF5EB] p-2 border-2 border-[#C59B4B] shadow-lg mb-5">
              <img
                src="/bazaro-icon.png"
                alt="BAZARO Crest"
                className="w-full h-full object-contain"
              />
            </div>

            <span className="text-[10px] uppercase tracking-[0.28em] text-[#C59B4B] font-bold mb-2">
              Member Vault Access
            </span>
            <h1 className="font-serif-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-[#FAF5EB]">
              BAZARO
            </h1>
            <p className="text-[11px] uppercase tracking-[0.26em] text-[#C59B4B] font-semibold mt-1">
              Apnar Desher Bazaar
            </p>

            <p className="mt-6 text-xs sm:text-sm text-[#EFE7DA]/80 leading-relaxed max-w-xs">
              Enter your private patron portal to monitor shipments, manage saved addresses, and unlock curated member privileges.
            </p>
          </div>

          <div className="relative z-10 mt-10 pt-6 border-t border-[#C59B4B]/20 space-y-3 text-xs text-[#EFE7DA]/85">
            <div className="flex items-center gap-2.5">
              <FiAward className="text-[#E5C77A] shrink-0" />
              <span>Authenticated products with full warranty seal</span>
            </div>
            <div className="flex items-center gap-2.5">
              <FiShield className="text-[#E5C77A] shrink-0" />
              <span>JWT protected sessions & encrypted profile vault</span>
            </div>
          </div>
        </div>

        {/* Right Cream Atelier Login Form */}
        <div className="lg:col-span-7 bg-[#FDFBF7] p-8 sm:p-12 flex flex-col justify-center bazaro-surface-light">
          <div className="mb-7">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#9C7E54] font-extrabold block mb-1">
              Patron Sign In
            </span>
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#1F1916]">
              Welcome Back
            </h2>
            <p className="text-xs text-[#6E5C4F] mt-1">
              Sign in with your registered BAZARO email address and password.
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

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email Field */}
            <div className="bazaro-field-group">
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-[#1F1916] uppercase tracking-wider mb-1"
              >
                Email Address
              </label>
              <p id="login-email-hint" className="text-[11px] text-[#7A6656] mb-1.5">
                Use your patron email (e.g. user@bazaro.com)
              </p>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="patron@bazaro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  {...getFieldProps("email", {
                    hintId: "login-email-hint",
                    errorId: "login-email-error",
                  })}
                  className="bazaro-field-input w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#C59B4B]/35 text-xs sm:text-sm text-[#1F1916] placeholder-[#B0A191] focus:outline-none focus:border-[#C59B4B] focus:ring-2 focus:ring-[#C59B4B]/20"
                />
                {fieldErrors.email && (
                  <p id="login-email-error" className="bazaro-field-error" data-visible="true">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="bazaro-field-group">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-[#1F1916] uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-[#8E6A28] hover:text-[#6B4E1B] underline underline-offset-4 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <p id="login-password-hint" className="text-[11px] text-[#7A6656] mb-1.5">
                Minimum 6 characters required
              </p>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-[#9C7E54] text-sm pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  {...getFieldProps("password", {
                    hintId: "login-password-hint",
                    errorId: "login-password-error",
                  })}
                  className="bazaro-field-input w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-[#C59B4B]/35 text-xs sm:text-sm text-[#1F1916] placeholder-[#B0A191] focus:outline-none focus:border-[#C59B4B] focus:ring-2 focus:ring-[#C59B4B]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-3 p-0.5 text-[#7A6656] hover:text-[#1F1916] cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                </button>
                {fieldErrors.password && (
                  <p id="login-password-error" className="bazaro-field-error" data-visible="true">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bazaro-editorial-btn w-full py-3.5 rounded-full bg-[#1A1512] hover:bg-[#2F251D] text-[#F6E3B4] text-xs font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? "Authenticating..." : "Enter BAZARO Portal"}</span>
              {!loading && <FiArrowRight className="text-sm" />}
            </button>
          </form>

          {/* 1-Click Demo Credentials */}
          <div className="mt-7 pt-5 border-t border-[#C59B4B]/20">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A6656] mb-2.5 text-center">
              Quick Demo Credentials
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoFill("user@bazaro.com", "user123456")}
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF5EB] hover:bg-[#EFE7DA] border border-[#C59B4B]/30 text-left transition-colors cursor-pointer"
              >
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#9C7E54]">
                  Customer Demo
                </span>
                <span className="text-xs font-bold text-[#1F1916] font-mono">
                  user@bazaro.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill("admin@bazaro.com", "admin123456")}
                className="px-3.5 py-2.5 rounded-xl bg-[#0D0A08] hover:bg-[#1A1410] border border-[#C59B4B]/45 text-left transition-colors cursor-pointer"
              >
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#E5C77A]">
                  Admin Vault Demo
                </span>
                <span className="text-xs font-bold text-[#FAF5EB] font-mono">
                  admin@bazaro.com
                </span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#6E5C4F]">
            New to BAZARO?{" "}
            <Link
              to="/register"
              className="font-bold text-[#9C7E54] hover:text-[#1F1916] underline decoration-[#C59B4B]/60 underline-offset-4 transition-colors"
            >
              Create Patron Membership
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
