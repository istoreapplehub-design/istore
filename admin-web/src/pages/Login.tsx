import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Package,
  TrendingUp,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session, isAdmin, loading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(
    (location.state as any)?.error || null
  );
  const [submitting, setSubmitting] = useState(false);

  // Carousel slide index on right side (0, 1, 2, 3)
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-cycle through slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && session && isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
  };

  return (
    <div className="min-h-screen bg-[#f3f3f1] flex items-center justify-center p-3 sm:p-6 lg:p-8">
      {/* Outer Card Container */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-gray-200/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* ─── LEFT COLUMN: ADMIN SIGN IN ─────────────────────────────────── */}
        <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
          <div>
            {/* Brand Logo Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg shadow-sm">
                
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                iStore Hub
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Operations Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Welcome to iStore Hub
              </h1>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Sign in to manage store catalog, orders, and fulfillment.
              </p>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-neutral-100 border border-neutral-300 text-xs font-semibold text-neutral-900 flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Email Address <span className="text-neutral-900">*</span>
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
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Password <span className="text-neutral-900">*</span>
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
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-10 py-3 text-sm text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
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
                className="w-full mt-2 py-3.5 px-4 bg-black hover:bg-neutral-800 text-white font-bold text-sm rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="inline-block animate-pulse">Signing in...</span>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>

          {/* Footer Copyright */}
          <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
            <span>Copyright © iStore Hub. All Rights Reserved.</span>
            <div className="flex items-center gap-2">
              <span className="hover:text-gray-600 cursor-pointer">Terms & Condition</span>
              <span>|</span>
              <span className="hover:text-gray-600 cursor-pointer">Privacy & Policy</span>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: 4 INTERACTIVE SLIDES (MONOCHROME LUXURY) ─────── */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#121212] via-[#0d0d0d] to-[#050505] p-8 sm:p-12 lg:p-14 relative flex flex-col justify-between overflow-hidden text-white">
          {/* Subtle Grid Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #121212 1px)",
              backgroundSize: "28px 28px",
              backgroundPosition: "0 0, 14px 14px"
            }}
          />

          {/* Active Slide Dynamic Cards */}
          <div className="relative z-10 w-full max-w-md mx-auto space-y-4 my-auto pt-2">
            
            {/* SLIDE 0: FINANCIAL PLAN & CAPITAL ALLOCATIONS */}
            {currentSlide === 0 && (
              <div className="space-y-4 animate-fade-in">
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
                          stroke="#171717"
                          strokeWidth="6"
                          strokeDasharray="150"
                          strokeDashoffset="45"
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
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" /> Sales
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Stock
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform rotate-1 hover:rotate-0 transition duration-300 ml-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Capital Allocations</div>
                      <div className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <span>₵17,366.00</span>
                        <span className="text-[10px] font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded">
                          ↑ 12%
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">Updated just now</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="font-semibold text-gray-700 text-xs">iPhone 15 Pro Max</span>
                      <span className="font-bold text-gray-900">₵1,300</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="font-semibold text-gray-700 text-xs">MacBook Pro M3</span>
                      <span className="font-bold text-gray-900">₵2,450</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 1: LIVE ORDER FULFILLMENT & LOGISTICS */}
            {currentSlide === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform -rotate-1 hover:rotate-0 transition duration-300">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                      <Truck className="w-4 h-4" />
                      <span>Fulfillment & Dispatch</span>
                    </div>
                    <span className="text-[10px] font-bold bg-neutral-100 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="text-lg font-black text-gray-900">₵8,420.00 in Transit</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">18 packages dispatched across Accra & Kumasi</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="w-[84%] h-full bg-neutral-900 rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-gray-800">84%</span>
                  </div>
                </div>

                <div className="bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform rotate-1 hover:rotate-0 transition duration-300 ml-4">
                  <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">Recent Dispatches</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <div>
                        <div className="font-bold text-gray-900">#ORD-79B3B</div>
                        <div className="text-[10px] text-gray-400">Speedaf Courier • Kumasi</div>
                      </div>
                      <span className="text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-full">
                        Shipped
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">#ORD-1247A</div>
                        <div className="text-[10px] text-gray-400">Direct Rider • East Legon</div>
                      </div>
                      <span className="text-[10px] font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full">
                        Delivered
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 2: HARDWARE CATALOG & INVENTORY HEALTH */}
            {currentSlide === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform -rotate-1 hover:rotate-0 transition duration-300">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                      <Package className="w-4 h-4" />
                      <span>Hardware Catalog Matrix</span>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-900">94 Models</span>
                  </div>
                  <div className="text-lg font-black text-gray-900 mt-1">₵142,500.00 Value</div>
                  <p className="text-[11px] text-gray-500">All Apple iPhones, MacBooks, iPads & Watches synced</p>
                </div>

                <div className="bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform rotate-1 hover:rotate-0 transition duration-300 ml-4">
                  <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">Smart Reorder Alerts</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <span className="font-semibold text-gray-800">iPhone 15 Pro Max 256GB</span>
                      <span className="text-[11px] font-bold text-neutral-900">8 left</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">Apple Watch Ultra 2</span>
                      <span className="text-[11px] font-bold text-neutral-900">4 left</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: OMNICHANNEL PAYMENTS & SUPPORT HUB */}
            {currentSlide === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform -rotate-1 hover:rotate-0 transition duration-300">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-neutral-900">Payment Channels Settled</span>
                    <span className="text-[10px] font-bold text-neutral-900">Instant</span>
                  </div>
                  <div className="text-lg font-black text-gray-900 mt-1">MTN MoMo & Cards</div>
                  <p className="text-[11px] text-gray-500">Live webhook synchronization with automated verification</p>
                </div>

                <div className="bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform rotate-1 hover:rotate-0 transition duration-300 ml-4">
                  <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">Customer Care & Reviews</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-extrabold text-gray-900">4.9 ★ Rating</div>
                      <div className="text-[10px] text-gray-400">100% Genuine Apple Verified</div>
                    </div>
                    <div className="px-2.5 py-1 bg-neutral-900 text-white font-bold text-[11px] rounded-lg">
                      Top Rated
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Lower Hero Text */}
          <div className="relative z-10 mt-8 pt-4">
            <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl shadow-lg mb-4">
              
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {currentSlide === 0 && "A Unified Hub for Smarter Apple Retail Management"}
              {currentSlide === 1 && "End-to-End Fulfillment & Real-Time Logistics"}
              {currentSlide === 2 && "Intelligent Inventory & Stock Protection"}
              {currentSlide === 3 && "Omnichannel Payments & Customer Care"}
            </h2>

            <p className="mt-2.5 text-sm text-neutral-300 leading-relaxed max-w-lg">
              {currentSlide === 0 &&
                "iStore Hub empowers you with a unified operational command center—delivering deep insights and a 360° view of your entire store catalog and orders."}
              {currentSlide === 1 &&
                "Effortlessly coordinate couriers, track shipment timelines, and deliver Apple hardware right to your customers' doorsteps."}
              {currentSlide === 2 &&
                "Track live stock levels, configure specs and colorways, and prevent inventory depletion with automated replenishment alerts."}
              {currentSlide === 3 &&
                "Seamless mobile money checkout, instant webhook payment reconciliations, and responsive customer care support."}
            </p>

            {/* 4 Interactive Clickable Carousel Pills (Fixed & Clickable!) */}
            <div className="mt-6 flex items-center gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx ? "w-10 bg-white" : "w-6 bg-white/30 hover:bg-white/60"
                  }`}
                  title={`View Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
