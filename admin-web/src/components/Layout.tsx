import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Apple,
  ChevronLeft,
  Headphones,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  TrendingUp,
  User,
  Users,
  Bell,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import {
  formatGHS,
  getAdminOrders,
  getAdminPendingCount,
  getAdminProductStats,
  getAdminProducts,
  timeAgo
} from "../lib/api";

const SETTLED = new Set(["paid", "shipped", "delivered"]);
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

type NotificationItem = {
  key: string;
  title: string;
  detail: string;
  meta: string;
  to: string;
  emphasise: boolean;
};

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const { data: pendingData } = useQuery({
    queryKey: ["pending-count"],
    queryFn: getAdminPendingCount,
    refetchInterval: 30000
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["feed-orders"],
    queryFn: () => getAdminOrders({ page: 1, limit: 6 }),
    refetchInterval: 30000
  });

  const { data: stockStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminProductStats,
    refetchInterval: 60000
  });

  const searchEnabled = debouncedQuery.length >= 2;

  const { data: searchProducts } = useQuery({
    queryKey: ["global-search-products", debouncedQuery],
    queryFn: () => getAdminProducts({ search: debouncedQuery, limit: 5 }),
    enabled: searchEnabled
  });

  const { data: searchOrders } = useQuery({
    queryKey: ["global-search-orders", debouncedQuery],
    queryFn: () => getAdminOrders({ search: debouncedQuery, limit: 5 }),
    enabled: searchEnabled
  });

  const pendingOrders = pendingData?.pending || 0;

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    for (const order of recentOrders?.data ?? []) {
      if (!SETTLED.has(order.status)) continue;
      if (Date.now() - new Date(order.createdAt).getTime() > RECENT_WINDOW_MS) continue;
      items.push({
        key: `order-${order.id}`,
        title: `Order #${order.id.slice(0, 8).replace("-", "")} · ${formatGHS(order.totalGHS)}`,
        detail: `${order.user?.name || "Guest"} · ${order.status}`,
        meta: timeAgo(order.createdAt),
        to: `/orders/${order.id}`,
        emphasise: true
      });
    }

    if (stockStats?.outOfStock?.length) {
      items.push({
        key: "stock-out",
        title: `${stockStats.outOfStock.length} product${stockStats.outOfStock.length === 1 ? "" : "s"} out of stock`,
        detail: "Restock or deactivate the listing",
        meta: "Inventory",
        to: "/products",
        emphasise: true
      });
    }

    if (stockStats?.lowStock?.length) {
      items.push({
        key: "stock-low",
        title: `${stockStats.lowStock.length} product${stockStats.lowStock.length === 1 ? "" : "s"} running low`,
        detail: "Fewer than 5 units left each",
        meta: "Inventory",
        to: "/products",
        emphasise: false
      });
    }

    return items;
  }, [recentOrders, stockStats]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "Home";
    if (path.startsWith("/analytics")) return "Analytics";
    if (path.startsWith("/orders")) return "Orders";
    if (path.startsWith("/products")) return "Products";
    if (path.startsWith("/admins")) return "Customers & Admins";
    if (path.startsWith("/support")) return "Customer Support";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/profile")) return "Profile";
    return "Home";
  };

  const submitSearch = () => {
    if (!searchEnabled) return;
    setSearchOpen(false);
    navigate(`/products?q=${encodeURIComponent(debouncedQuery)}`);
  };

  const navMenuItems = [
    { label: "Home", path: "/dashboard", icon: Home },
    { label: "Orders", path: "/orders", icon: ShoppingBag, badge: pendingOrders > 0 ? pendingOrders : null },
    { label: "Products", path: "/products", icon: Package },
    { label: "Customers", path: "/admins", icon: Users },
    { label: "Analytics", path: "/analytics", icon: TrendingUp },
    { label: "Support", path: "/support", icon: Headphones }
  ];

  const initials = (name?: string | null) => {
    if (!name) return "AD";
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const activeClass = (path: string) =>
    location.pathname.startsWith(path)
      ? "bg-neutral-900 text-white shadow-xs"
      : "text-neutral-600 hover:bg-neutral-100 hover:text-black";

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#171717] flex antialiased">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#ebebe9] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto px-5 py-6">
          <div className="flex items-center justify-between pb-6 border-b border-gray-100">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
                <Apple className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-gray-900 tracking-tight text-lg">I-Store</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Menu
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
                      isActive ? "bg-neutral-900 text-white shadow-xs" : activeClass(item.path)
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          isActive ? "bg-white text-neutral-900" : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="mt-8">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Others
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${activeClass("/profile")}`}
              >
                <User className="w-4 h-4 text-gray-400" />
                <span>Profile</span>
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${activeClass("/settings")}`}
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Settings</span>
              </NavLink>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:text-black hover:bg-neutral-100 transition"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
                <span>Log out</span>
              </button>
            </nav>
          </div>
        </div>

        <Link
          to="/profile"
          onClick={() => setMobileMenuOpen(false)}
          className="p-4 border-t border-gray-100 bg-gray-50/60 flex items-center gap-3 min-w-0 hover:bg-gray-100/70 transition"
        >
          <div className="w-8 h-8 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
            {initials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-900 truncate">{user?.name || "Admin"}</div>
            <div className="text-[10px] text-gray-400 truncate">{user?.email || "No email on file"}</div>
          </div>
        </Link>
      </aside>

      {/* ─── MAIN ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-4 border-b border-[#ecece9]">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-gray-800 hover:text-gray-950 font-bold text-base transition"
              title="Back to home"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
              <span>{getPageTitle()}</span>
            </Link>
          </div>

          {/* Global search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-2" ref={searchRef}>
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products and orders..."
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitSearch();
                }}
                className="w-full bg-white border border-gray-200/90 rounded-full pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black shadow-xs transition"
              />

              {searchOpen && searchEnabled ? (
                <div className="absolute right-0 left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200/90 overflow-hidden z-50 max-h-96 overflow-y-auto">
                  <SearchGroup title="Products">
                    {(searchProducts?.data ?? []).map((product) => (
                      <SearchRow
                        key={product.id}
                        to={`/products/${product.id}/edit`}
                        onClick={() => setSearchOpen(false)}
                        primary={product.name}
                        secondary={`${product.category} · ${product.stock} in stock`}
                      />
                    ))}
                    {searchProducts && searchProducts.data.length === 0 ? (
                      <SearchEmpty />
                    ) : null}
                  </SearchGroup>

                  <SearchGroup title="Orders">
                    {(searchOrders?.data ?? []).map((order) => (
                      <SearchRow
                        key={order.id}
                        to={`/orders/${order.id}`}
                        onClick={() => setSearchOpen(false)}
                        primary={`#${order.id.slice(0, 8).replace("-", "")} · ${formatGHS(order.totalGHS)}`}
                        secondary={`${order.user?.name || "Guest"} · ${order.status}`}
                      />
                    ))}
                    {searchOrders && searchOrders.data.length === 0 ? <SearchEmpty /> : null}
                  </SearchGroup>

                  <button
                    type="button"
                    onClick={submitSearch}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-50 border-t border-gray-100"
                  >
                    Show all product results for “{debouncedQuery}” →
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                title="Notifications"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 shadow-xs transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
              </button>
              {notifications.length > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-black text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#f5f5f7]">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              ) : null}

              {notificationsOpen ? (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200/90 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                      Store activity
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-semibold text-gray-500 hover:text-black"
                    >
                      Close
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="text-xs font-semibold text-gray-900">Nothing needs you</div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        No settled orders in the last 24 hours and stock levels are healthy.
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                      {notifications.map((item) => (
                        <Link
                          key={item.key}
                          to={item.to}
                          onClick={() => setNotificationsOpen(false)}
                          className="p-3.5 hover:bg-gray-50 transition flex items-start gap-3 block"
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              item.emphasise ? "bg-black" : "bg-neutral-300"
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-gray-900 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">{item.detail}</div>
                            <div className="text-[10px] text-gray-400 mt-1">{item.meta}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                    <Link
                      to="/orders"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-neutral-900 hover:underline"
                    >
                      View all orders →
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-3 pl-2 sm:border-l border-gray-200 hover:opacity-80 transition"
              title="Your profile"
            >
              <div className="w-9 h-9 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs">
                {initials(user?.name)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-gray-900 leading-tight">
                  {user?.name || "Administrator"}
                </div>
                <div className="text-[11px] text-gray-400 font-medium leading-tight capitalize">
                  {user?.role || "staff"}
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              title="Log out of Admin Portal"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-full transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Log out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="py-1">
      <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {title}
      </div>
      {children}
    </div>
  );
}

function SearchRow({
  to,
  primary,
  secondary,
  onClick
}: {
  to: string;
  primary: string;
  secondary: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2 hover:bg-neutral-50 transition"
    >
      <div className="text-xs font-bold text-gray-900 truncate">{primary}</div>
      <div className="text-[11px] text-gray-500 truncate">{secondary}</div>
    </Link>
  );
}

function SearchEmpty() {
  return <div className="px-4 py-2.5 text-[11px] text-gray-400">No matches</div>;
}

export default Layout;
