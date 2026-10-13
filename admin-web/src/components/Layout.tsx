import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  MessageSquare,
  ChevronLeft,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { getAdminPendingCount } from "../lib/api";

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch pending orders count for badge
  const { data: pendingData } = useQuery({
    queryKey: ["pending-count"],
    queryFn: getAdminPendingCount,
    refetchInterval: 30000
  });

  const pendingOrders = pendingData?.pending || 0;

  // Determine current page title for breadcrumb
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "Home";
    if (path.startsWith("/orders")) return "Orders";
    if (path.startsWith("/products")) return "Products";
    if (path.startsWith("/admins")) return "Customers";
    if (path.startsWith("/settings")) return "Settings";
    return "Home";
  };

  const navMenuItems = [
    {
      label: "Home",
      path: "/dashboard",
      icon: Home
    },
    {
      label: "Orders",
      path: "/orders",
      icon: ShoppingBag,
      badge: pendingOrders > 0 ? pendingOrders : null
    },
    {
      label: "Products",
      path: "/products",
      icon: Package
    },
    {
      label: "Customers",
      path: "/admins",
      icon: Users
    },
    {
      label: "Analytics",
      path: "/dashboard",
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717] flex antialiased">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ─── SIDEBAR (IMAGE 1: STOREFLOW DESIGN) ─────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#ebebe9] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto px-5 py-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-100">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1b564c] text-white flex items-center justify-center font-bold text-base shadow-sm">
                
              </div>
              <span className="font-bold text-gray-900 tracking-tight text-lg">
                iStore Hub
              </span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Group 1: MENU */}
          <div className="mt-6">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              MENU
            </div>
            <nav className="space-y-1">
              {navMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.label === "Home"
                    ? location.pathname === "/dashboard"
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#eaf5e9] text-[#24613b]"
                        : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#24613b]" : "text-gray-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Group 2: OTHERS */}
          <div className="mt-8">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              OTHERS
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  location.pathname.startsWith("/settings")
                    ? "bg-[#eaf5e9] text-[#24613b]"
                    : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                }`}
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Settings</span>
              </NavLink>

              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 transition"
              >
                <HelpCircle className="w-4 h-4 text-gray-400" />
                <span>Help</span>
              </button>

              <button
                type="button"
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </nav>
          </div>

          {/* Bottom Card: Become Pro (Matching Image 1) */}
          <div className="mt-auto pt-6">
            <div className="bg-[#121417] text-white p-4 rounded-2xl relative overflow-hidden shadow-md">
              <div
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-30 blur-xl pointer-events-none"
                style={{ background: "radial-gradient(circle, #4ade80 0%, #0d9488 100%)" }}
              />
              <div className="relative z-10">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Become Pro</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                  Unlock premium features, advance AI automation, and insights
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="mt-3 w-full py-1.5 px-3 bg-white hover:bg-gray-100 text-gray-900 text-xs font-bold rounded-xl transition shadow-xs"
                >
                  View our plans
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN APP AREA ─────────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* TOP BAR (IMAGE 1: STOREFLOW DESIGN) */}
        <header className="sticky top-0 z-30 bg-[#f7f7f5]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#ecece9]">
          
          {/* Left: Breadcrumbs / Back */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-gray-800 hover:text-gray-950 font-bold text-base transition"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
              <span>{getPageTitle()}</span>
            </Link>
          </div>

          {/* Center: Pill Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200/90 rounded-full pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1b564c]/20 focus:border-[#1b564c] shadow-xs transition"
              />
            </div>
          </div>

          {/* Right: Quick Actions & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Support Message Bubble */}
            <button
              type="button"
              title="Messages"
              className="w-9 h-9 rounded-full bg-[#1b564c] text-white flex items-center justify-center hover:bg-[#15463e] shadow-xs transition"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                type="button"
                title="Notifications"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 shadow-xs transition"
              >
                <Bell className="w-4 h-4" />
              </button>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                2
              </span>
            </div>

            {/* User Profile Pill / Menu */}
            <div className="flex items-center gap-3 pl-2 sm:border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "SM"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-gray-900 leading-tight">
                  {user?.name || "Sarah Michelle"}
                </div>
                <div className="text-[11px] text-gray-400 font-medium leading-tight">
                  {user?.role === "admin" ? "Store Manager" : "Administrator"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
