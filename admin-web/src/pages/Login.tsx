import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Apple,
  Search,
  Package,
  Boxes,
  Truck,
  ShieldCheck,
  LayoutDashboard,
  CreditCard,
  Headphones,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const SLIDES = [
  {
    headline: "Your catalog, orders and revenue in one clean console",
    sub: "Sign in to work from live store data — every figure on these screens is read straight from the I-Store database.",
    cards: [
      {
        icon: LayoutDashboard,
        title: "Operations Dashboard",
        badge: "Live",
        body: "Revenue, settled orders, average order value and stock alerts, all computed server-side from the orders and products tables."
      },
      {
        icon: Search,
        title: "Store-wide search",
        badge: "Instant",
        body: "Look up any product by name, model or description and any order by ID, customer name or phone from the top bar."
      }
    ]
  },
  {
    headline: "Fulfilment you can actually track",
    sub: "Move orders through the lifecycle the API enforces: pending, paid, shipped, delivered — with courier and tracking details on each one.",
    cards: [
      {
        icon: Truck,
        title: "Order lifecycle",
        badge: "Enforced",
        body: "Status changes are validated by the backend, so an order can never jump straight from pending to delivered."
      },
      {
        icon: Package,
        title: "Dispatch records",
        badge: "Per order",
        body: "Add courier and tracking number on a shipment, then follow the full timeline from checkout to delivery."
      }
    ]
  },
  {
    headline: "Inventory that tells you the truth",
    sub: "Product specs, colourways, storage options and photography are yours to manage, with low-stock signals derived from real quantities.",
    cards: [
      {
        icon: Boxes,
        title: "Catalog control",
        badge: "Full CRUD",
        body: "Create, edit, deactivate and restore listings, upload product images, and set pricing against compare-at pricing."
      },
      {
        icon: AlertTriangle,
        title: "Stock signals",
        badge: "Auto",
        body: "Out-of-stock and low-stock lists come from the products table the moment you load the page."
      }
    ]
  },
  {
    headline: "Paystack settlements and real customer care",
    sub: "Reconcile mobile money, card and bank-transfer orders, then reach the buyer behind any order through the contact details on file.",
    cards: [
      {
        icon: CreditCard,
        title: "Settlement channels",
        badge: "Paystack",
        body: "Analytics split settled revenue by the payment channel each order actually recorded."
      },
      {
        icon: Headphones,
        title: "Customer care",
        badge: "WhatsApp / Email",
        body: "Open a WhatsApp or email draft for any order straight from the customer's phone number and address on file."
      }
    ]
  }
];

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
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-3 sm:p-6 lg:p-8">
      
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-gray-200/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* ─── LEFT COLUMN: ADMIN SIGN IN ─────────────────────────────────── */}
        <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
          <div>
            {/* Brand Logo Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
                <Apple className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">I-Store</span>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Operations Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Welcome to I-Store
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
                    placeholder="you@istore.com"
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
            <span>Copyright © I-Store. All Rights Reserved.</span>
<span>Apple hardware retail, Accra</span>
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

          {/* Capability slides — the portal reports only what the database returns */}
          <div className="relative z-10 w-full max-w-md mx-auto my-auto pt-2">
            <div className="space-y-4 animate-fade-in">
              {SLIDES[currentSlide].cards.map((card, idx) => (
                <div
                  key={card.title}
                  className={`bg-white/95 text-gray-900 rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-white/20 transform transition duration-300 hover:rotate-0 ${
                    idx % 2 === 0 ? "-rotate-1" : "rotate-1 ml-4"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                      <card.icon className="w-4 h-4" />
                      <span>{card.title}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-neutral-100 px-2 py-0.5 rounded-full">
                      {card.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lower hero text */}
          <div className="relative z-10 mt-8 pt-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {SLIDES[currentSlide].headline}
            </h2>

            <p className="mt-2.5 text-sm text-neutral-300 leading-relaxed max-w-lg">
              {SLIDES[currentSlide].sub}
            </p>

            {/* Slide pills */}
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
