import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Search,
  Bell,
  Headphones,
  ChevronLeft,
  Menu,
  X,
  CheckCircle2,
  Clock,
  ExternalLink
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (path.startsWith("/analytics")) return "Analytics";
    if (path.startsWith("/orders")) return "Orders";
    if (path.startsWith("/products")) return "Products";
    if (path.startsWith("/admins")) return "Customers & Admins";
    if (path.startsWith("/support")) return "Customer Support";
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
      path: "/analytics",
      icon: TrendingUp
    },
    {
      label: "Support",
      path: "/support",
      icon: Headphones
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

      {/* ─── SIDEBAR: SLEEK BLACK & WHITE LUXURY ──────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#ebebe9] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto px-5 py-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-100">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-base shadow-sm">
                
              </div>
              <span className="font-extrabold text-gray-900 tracking-tight text-lg">
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

          {/* Group: MENU */}
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
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          isActive
                            ? "bg-white text-neutral-900"
                            : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Group: OTHERS */}
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
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <Settings className={`w-4 h-4 ${location.pathname.startsWith("/settings") ? "text-white" : "text-gray-400"}`} />
                <span>Settings</span>
              </NavLink>

              <button
                type="button"
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:text-black hover:bg-neutral-100 transition"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
                <span>Log out</span>
              </button>
            </nav>
          </div>
        </div>

        {/* User Mini Bar At Bottom */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate">
                {user?.name || "Admin"}
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                {user?.email || "admin@istore.com"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* TOP BAR */}
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
                className="w-full bg-white border border-gray-200/90 rounded-full pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-xs transition"
              />
            </div>
          </div>

          {/* Right: Notification Bell & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Clickable Notification Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Notifications"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 shadow-xs transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
              </button>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                3
              </span>

              {/* Notification Popover Modal */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200/90 overflow-hidden z-50 animate-fade-in">
                  <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                      Live Store Notifications
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-semibold text-gray-500 hover:text-black"
                    >
                      Close
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    <div className="p-3.5 hover:bg-gray-50 transition flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-black mt-1.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          New Order #ORD-79B3B
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Paid ₵2,340.00 via MTN MoMo for iPhone 15 Pro Max
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">2 mins ago</div>
                      </div>
                    </div>

                    <div className="p-3.5 hover:bg-gray-50 transition flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          Low Stock Alert: Apple Watch Ultra 2
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Only 4 units left in inventory
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">15 mins ago</div>
                      </div>
                    </div>

                    <div className="p-3.5 hover:bg-gray-50 transition flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-black mt-1.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          Customer Support Ticket #SUP-104
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Kwame Mensah asked about delivery times to Kumasi
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">1 hour ago</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate("/orders");
                      }}
                      className="text-xs font-bold text-neutral-900 hover:underline"
                    >
                      View all orders & alerts →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-3 pl-2 sm:border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-gray-900 leading-tight">
                  {user?.name || "Administrator"}
                </div>
                <div className="text-[11px] text-gray-400 font-medium leading-tight">
                  Store Operations
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
