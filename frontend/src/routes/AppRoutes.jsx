import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";

const Shop = lazy(() => import("../pages/Shop"));
const ProductDetail = lazy(() => import("../pages/ProductDetail"));
const Cart = lazy(() => import("../pages/Cart"));
const UserDashboard = lazy(() => import("../pages/UserDashboard"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const TrackOrder = lazy(() => import("../pages/TrackOrder"));

const RouteAtelierFallback = () => (
  <div
    data-surface="light"
    className="w-full min-h-[75vh] bg-[#FAF5EB] pt-36 pb-20 px-4 sm:px-8 flex flex-col items-center justify-center"
  >
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex flex-col items-center gap-2">
        <span className="font-serif-editorial text-2xl font-semibold tracking-[0.22em] text-[#1F1916]">
          BAZARO
        </span>
        <span className="text-[10px] uppercase tracking-[0.26em] text-[#8E6A28]">
          Preparing Atelier Chamber
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 rounded-[24px] bazaro-shimmer" />
        <div className="h-64 rounded-[24px] bazaro-shimmer" />
      </div>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteAtelierFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="orders" element={<Navigate to="/dashboard" replace />} />
          <Route path="track-order" element={<TrackOrder />} />
          <Route path="admin-dashboard" element={<AdminDashboard />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="password/reset/confirm/:uid/:token" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
