import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  CreditCard,
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
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { BrandLogo } from "./BrandLogo";
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

const NAV_ITEMS = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Orders", path: "/orders", icon: ShoppingBag },
  { label: "Installments", path: "/installments", icon: CreditCard },
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

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.matchMedia("(min-width: 1024px)").matches) {
          setSearchOpen(true);
          desktopInputRef.current?.focus();
        } else {
          setSearchOpen(true);
          mobileInputRef.current?.focus();
        }
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const submitSearch = () => {
    if (!searchEnabled) return;
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/products?q=${encodeURIComponent(debouncedQuery)}`);
  };

  const closeSearchPanel = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#171717] flex antialiased">
      {/* ─── SIDEBAR (fixed ≥lg, drawer <lg) ─────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ease-in-out lg:w-64 lg:translate-x-0 ${
          menuOpen ? "translate-x-0 visible" : "-translate-x-full invisible lg:visible"
        }`}
      >
        <div className="h-14 px-5 flex items-center justify-between border-b border-neutral-100 shrink-0">
          <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="min-w-0">
            <BrandLogo size={28} showWordmark wordmarkClassName="font-extrabold text-gray-900 tracking-tight text-base" />
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-700 rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Store
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.label === "Home"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.path);
              const badge = item.label === "Orders" && pendingOrders > 0 ? pendingOrders : null;

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {badge ? (
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${
                        isActive ? "bg-white text-neutral-900" : "bg-neutral-200 text-neutral-800"
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-neutral-100 shrink-0">
          <UserMenu
            user={user}
            align="left"
            onSignOut={handleSignOut}
            triggerClassName="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-100 transition min-w-0 text-left"
          />
        </div>
      </aside>

      {/* ─── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-xl border-b border-neutral-200 flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="lg:hidden flex items-center gap-2 min-w-0">
            <BrandLogo size={26} />
            <span className="text-sm font-extrabold text-gray-900 tracking-tight">Admin</span>
          </Link>

          {/* Desktop global search */}
          <div className="hidden lg:block flex-1 max-w-md ml-4" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={desktopInputRef}
                type="text"
                placeholder="Search devices and orders…"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitSearch();
                }}
                className="w-full bg-neutral-100 border border-transparent rounded-full pl-10 pr-12 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition"
              />
              <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-neutral-400 bg-white border border-neutral-200 rounded-md absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                ⌘K
              </kbd>

              {searchOpen && searchEnabled ? (
                <div className="absolute right-0 left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
                  <SearchResults
                    products={searchProducts?.data ?? []}
                    orders={searchOrders?.data ?? []}
                    productsLoaded={!!searchProducts}
                    ordersLoaded={!!searchOrders}
                    query={debouncedQuery}
                    onNavigate={() => setSearchOpen(false)}
                    onSeeAll={submitSearch}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex-1 lg:hidden" />

          {/* Right cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto lg:ml-0">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-neutral-100 hover:text-black transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-neutral-100 hover:text-black transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              {notifications.length > 0 ? (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-neutral-900 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              ) : null}

              {notificationsOpen ? (
                <div className="fixed left-3 right-3 top-16 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col max-h-[70vh] lg:absolute lg:left-auto lg:right-0 lg:top-12 lg:w-96 lg:max-h-[28rem]">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <span className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                      Store activity
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-semibold text-gray-500 hover:text-black p-1 -m-1"
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
                    <div className="divide-y divide-gray-100 overflow-y-auto">
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
                            <div className="text-xs font-bold text-gray-900 truncate">{item.title}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">{item.detail}</div>
                            <div className="text-[10px] text-gray-400 mt-1">{item.meta}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center shrink-0">
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

            <div className="hidden sm:block">
              <UserMenu
                user={user}
                align="right"
                onSignOut={handleSignOut}
                triggerClassName="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-neutral-100 transition"
              />
            </div>
          </div>
        </header>

        {/* Mobile / tablet search panel */}
        {searchOpen ? (
          <div className="lg:hidden sticky top-14 z-30 bg-white border-b border-neutral-200 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  autoFocus
                  placeholder="Search devices and orders…"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitSearch();
                  }}
                  className="w-full bg-neutral-100 border border-transparent rounded-full pl-10 pr-4 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition"
                />
              </div>
              <button
                type="button"
                onClick={closeSearchPanel}
                className="p-2.5 text-gray-500 hover:text-black rounded-lg"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {searchEnabled ? (
              <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                <SearchResults
                  products={searchProducts?.data ?? []}
                  orders={searchOrders?.data ?? []}
                  productsLoaded={!!searchProducts}
                  ordersLoaded={!!searchOrders}
                  query={debouncedQuery}
                  onNavigate={closeSearchPanel}
                  onSeeAll={submitSearch}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ─── USER MENU (avatar → profile / settings / sign out) ─────────────────── */

function UserMenu({
  user,
  align,
  onSignOut,
  triggerClassName
}: {
  user: { name?: string | null; email?: string | null; role?: string | null } | null | undefined;
  align: "left" | "right";
  onSignOut: () => void;
  triggerClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { label: "Profile", to: "/profile", icon: User },
    { label: "Settings", to: "/settings", icon: Settings }
  ];

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={triggerClassName}>
        <span className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
          {initials(user?.name)}
        </span>
        <span className="flex-1 min-w-0 text-left hidden sm:block">
          <span className="block text-xs font-bold text-gray-900 truncate">
            {user?.name || "Admin"}
          </span>
          <span className="block text-[10px] text-gray-400 truncate capitalize">
            {user?.role || "staff"}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 hidden sm:block transition-transform ${
            open ? "rotate-180" : ""
          } ${align === "right" ? "" : "ml-auto"}`}
        />
      </button>

      {open ? (
        <div
          className={`absolute mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 ${
            align === "right" ? "right-0" : "left-0 bottom-full mb-2 mt-0"
          }`}
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-900 truncate">{user?.name || "Administrator"}</div>
            <div className="text-[11px] text-gray-500 truncate">{user?.email || "No email on file"}</div>
          </div>
          <div className="py-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition ${
                    isActive ? "bg-neutral-100 text-black" : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-red-50 hover:text-red-600 transition border-t border-gray-100"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ─── SEARCH RESULTS (shared desktop dropdown / mobile panel) ────────────── */

function SearchResults({
  products,
  orders,
  productsLoaded,
  ordersLoaded,
  query,
  onNavigate,
  onSeeAll
}: {
  products: Array<{ id: string; name: string; category: string; stock: number }>;
  orders: Array<{ id: string; totalGHS: number; status: string; user?: { name?: string | null } | null }>;
  productsLoaded: boolean;
  ordersLoaded: boolean;
  query: string;
  onNavigate: () => void;
  onSeeAll: () => void;
}) {
  return (
    <>
      <SearchGroup title="Products">
        {products.map((product) => (
          <SearchRow
            key={product.id}
            to={`/products/${product.id}/edit`}
            onClick={onNavigate}
            primary={product.name}
            secondary={`${product.category} · ${product.stock} in stock`}
          />
        ))}
        {productsLoaded && products.length === 0 ? <SearchEmpty /> : null}
      </SearchGroup>

      <SearchGroup title="Orders">
        {orders.map((order) => (
          <SearchRow
            key={order.id}
            to={`/orders/${order.id}`}
            onClick={onNavigate}
            primary={`#${order.id.slice(0, 8).replace("-", "")}`}
            secondary={`${order.user?.name || "Guest"} · ${order.status}`}
          />
        ))}
        {ordersLoaded && orders.length === 0 ? <SearchEmpty /> : null}
      </SearchGroup>

      <button
        type="button"
        onClick={onSeeAll}
        className="w-full text-left px-4 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-50 border-t border-gray-100"
      >
        Show all product results for “{query}” →
      </button>
    </>
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
    <Link to={to} onClick={onClick} className="block px-4 py-2 hover:bg-neutral-50 transition">
      <div className="text-xs font-bold text-gray-900 truncate">{primary}</div>
      <div className="text-[11px] text-gray-500 truncate">{secondary}</div>
    </Link>
  );
}

function SearchEmpty() {
  return <div className="px-4 py-2.5 text-[11px] text-gray-400">No matches</div>;
}

export default Layout;
