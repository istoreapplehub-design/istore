import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { getAdminPendingCount } from "../lib/api";

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch pending orders count for badge
  const { data: pendingData } = useQuery({
    queryKey: ["pending-count"],
    queryFn: getAdminPendingCount,
    refetchInterval: 30000
  });

  const pendingOrders = pendingData?.pending || 0;

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard
    },
    {
      label: "Products",
      path: "/products",
      icon: Package
    },
    {
      label: "Orders",
      path: "/orders",
      icon: ShoppingBag,
      badge: pendingOrders > 0 ? pendingOrders : null
    },
    {
      label: "Admins",
      path: "/admins",
      icon: Users
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              
            </div>
            <div>
              <span className="font-bold text-gray-900 tracking-tight text-base">iStore Hub</span>
              <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider">Admin</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
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

        {/* Bottom section (above Sign Out) */}
        <div className="px-4 py-2 border-t border-gray-100">
          <NavLink
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
              location.pathname.startsWith("/settings")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
            }`}
          >
            <Settings className={`w-5 h-5 ${location.pathname.startsWith("/settings") ? "text-blue-600" : "text-gray-400"}`} />
            <span>Settings</span>
          </NavLink>
        </div>

        {/* User & Sign Out Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email || "admin@istore.com.gh"}</p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar for Mobile/Tablet */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-gray-900">iStore Admin</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Authorized</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
