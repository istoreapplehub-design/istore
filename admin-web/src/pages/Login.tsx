import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, session, isAdmin, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(
    (location.state as any)?.error || null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (activeTab === "signin") {
      if (!email || !password || submitting) return;
      setSubmitting(true);
      try {
        await signIn(email.trim(), password);
        navigate("/dashboard", { replace: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid credentials";
        setError(msg);
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!name || !phone || !email || !password || submitting) return;
      setSubmitting(true);
      try {
        await signUp(email.trim(), password, name.trim(), phone.trim());
        setSuccessMsg("Account created successfully! Please sign in with your credentials.");
        setActiveTab("signin");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create account";
        setError(msg);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#ecefe9] flex items-center justify-center p-3 sm:p-6 lg:p-8">
      {/* Outer Card Container */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
        
        {/* ─── LEFT COLUMN: FORM SECTION ─────────────────────────────────── */}
        <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
          <div>
            {/* Brand Logo Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0f766e] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                iStore Hub
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Welcome to iStore Hub
              </h1>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Start your experience with iStore Hub by signing in or signing up.
              </p>
            </div>

            {/* Segmented Switcher Tab */}
            <div className="mt-7 p-1 bg-gray-100/90 rounded-2xl flex items-center gap-1 border border-gray-200/60">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signin");
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === "signin"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === "signup"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error or Success Feedback */}
            {error && (
              <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {activeTab === "signup" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Full Name <span className="text-[#0f766e]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Phone Number <span className="text-[#0f766e]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+233 24 123 4567"
                        className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 outline-none transition"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email Address <span className="text-[#0f766e]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ghanaapps.shop"
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Password <span className="text-[#0f766e]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-10 py-2.5 text-sm text-gray-900 focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 bg-[#115e59] hover:bg-[#0f766e] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="inline-block animate-pulse">Processing...</span>
                ) : (
                  <span>{activeTab === "signin" ? "Sign In" : "Create Account"}</span>
                )}
              </button>
            </form>

            {/* Social Divider */}
            <div className="mt-6">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Or continue with
                </span>
              </div>

              {/* Social Buttons */}
              <div className="mt-5 flex items-center justify-center gap-3">
                {/* Google */}
                <button
                  type="button"
                  title="Google"
                  className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.25 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  title="Apple"
                  className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-900 transition font-bold text-lg"
                >
                  
                </button>

                {/* Meta */}
                <button
                  type="button"
                  title="Facebook"
                  className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>

                {/* X */}
                <button
                  type="button"
                  title="X"
                  className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-900 transition font-bold"
                >
                  𝕏
                </button>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
            <span>Copyright : iStore Hub, All Rights Reserved</span>
            <div className="flex items-center gap-2">
              <span className="hover:text-gray-600 cursor-pointer">Terms & Condition</span>
              <span>|</span>
              <span className="hover:text-gray-600 cursor-pointer">Privacy & Policy</span>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: EMERALD SHOWCASE (IMAGE 2 INSPIRATION) ───────── */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#08332f] via-[#042623] to-[#021816] p-8 sm:p-12 lg:p-14 relative flex flex-col justify-between overflow-hidden text-white">
          {/* Subtle Grid Mesh Background Overlay */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #042623 1px)",
              backgroundSize: "28px 28px",
              backgroundPosition: "0 0, 14px 14px"
            }}
          />

          {/* Floating Glassmorphism Preview Cards */}
          <div className="relative z-10 w-full max-w-md mx-auto space-y-4 my-auto pt-4">
            
            {/* Floating Card 1: Financial Donut */}
            <div className="bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform -rotate-1 hover:rotate-0 transition duration-300">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
                <span>Financial Plan</span>
                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">This month ⌵</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="24" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="32"
                      cy="32"
                      r="24"
                      stroke="#0f766e"
                      strokeWidth="6"
                      strokeDasharray="150"
                      strokeDashoffset="45"
                      fill="transparent"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="24"
                      stroke="#f59e0b"
                      strokeWidth="6"
                      strokeDasharray="150"
                      strokeDashoffset="110"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-gray-700">76%</span>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-gray-900">₵2,005.45</div>
                  <div className="text-[10px] text-gray-400">Available Revenue</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e]" /> Sales
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Stock
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card 2: Capital Allocations / Apple Products */}
            <div className="bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform rotate-2 hover:rotate-0 transition duration-300 ml-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Capital Allocations</div>
                  <div className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span>₵17,366.00</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      ↑ 12%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400">Updated just now</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 text-xs truncate max-w-[150px]">
                    iPhone 15 Pro Max
                  </span>
                  <span className="font-bold text-gray-900">₵1,300</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 text-xs truncate max-w-[150px]">
                    MacBook Pro M3
                  </span>
                  <span className="font-bold text-gray-900">₵2,450</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full py-1.5 bg-[#0f766e] text-white rounded-lg text-center font-bold text-[11px] shadow-sm">
                  Live Operations Active
                </div>
              </div>
            </div>
          </div>

          {/* Lower Hero Text */}
          <div className="relative z-10 mt-8 pt-6">
            {/* Center Logo Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#2dd4bf] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-teal-900/50 mb-5">
              
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              A Unified Hub for Smarter Apple Retail Management
            </h2>

            <p className="mt-3 text-sm text-teal-100/80 leading-relaxed max-w-lg">
              iStore Hub empowers you with a unified operational command center—delivering deep
              insights and a 360° view of your entire store catalog and orders.
            </p>

            {/* Carousel Segment Indicators (Matching Image 2) */}
            <div className="mt-8 flex items-center gap-2">
              <div className="w-10 h-1.5 rounded-full bg-white transition-all duration-300" />
              <div className="w-6 h-1.5 rounded-full bg-white/30" />
              <div className="w-6 h-1.5 rounded-full bg-white/30" />
              <div className="w-6 h-1.5 rounded-full bg-white/30" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
