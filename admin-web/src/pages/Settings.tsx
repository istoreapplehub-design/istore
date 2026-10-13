import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Database,
  Globe,
  Server,
  Users,
  Download,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Package,
  ShoppingBag,
  DollarSign
} from "lucide-react";
import {
  API_BASE,
  getAdminProductStats,
  getRevenueStats,
  listAllUsers,
  wipeDemoOrders,
  resetAllData,
  formatGHS
} from "../lib/api";
import { useToast } from "../components/Toast";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { supabase } from "../lib/supabase";

export function Settings() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [confirmWipeDemoOpen, setConfirmWipeDemoOpen] = useState(false);
  const [confirmResetAllOpen, setConfirmResetAllOpen] = useState(false);
  const [exportingProducts, setExportingProducts] = useState(false);
  const [exportingOrders, setExportingOrders] = useState(false);

  // 1. Health check to test database/backend connection
  const { data: healthData, isLoading: loadingHealth } = useQuery({
    queryKey: ["api-health"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) throw new Error("Health check failed");
      return res.json();
    },
    refetchInterval: 60000
  });

  // 2. Fetch System Information Stats
  const { data: productStats, isLoading: loadingProducts } = useQuery({
    queryKey: ["product-stats"],
    queryFn: getAdminProductStats
  });

  const { data: revenueStats, isLoading: loadingRevenue } = useQuery({
    queryKey: ["revenue-stats-all"],
    queryFn: () => getRevenueStats("all")
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["users-count"],
    queryFn: () => listAllUsers({ limit: 1 })
  });

  // Mutations
  const wipeDemoMutation = useMutation({
    mutationFn: wipeDemoOrders,
    onSuccess: (res) => {
      toast.success(res.message || `Deleted ${res.deletedCount} demo orders`);
      queryClient.invalidateQueries();
      setConfirmWipeDemoOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete demo orders");
    }
  });

  const resetAllMutation = useMutation({
    mutationFn: resetAllData,
    onSuccess: (res) => {
      toast.success(
        res.message ||
          `Reset complete: ${res.ordersDeleted} orders, ${res.reviewsDeleted} reviews deleted`
      );
      queryClient.invalidateQueries();
      setConfirmResetAllOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reset transaction data");
    }
  });

  // Export handlers
  const handleExportProducts = async () => {
    try {
      setExportingProducts(true);
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/admin/products/export`, { headers });
      if (!res.ok) throw new Error("Failed to export products");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Products CSV downloaded successfully");
    } catch {
      toast.error("Failed to download products CSV");
    } finally {
      setExportingProducts(false);
    }
  };

  const handleExportOrders = async () => {
    try {
      setExportingOrders(true);
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/admin/orders/export`, { headers });
      if (!res.ok) throw new Error("Failed to export orders");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Orders CSV downloaded successfully");
    } catch {
      toast.error("Failed to download orders CSV");
    } finally {
      setExportingOrders(false);
    }
  };

  const isConnected = !loadingHealth && healthData?.status === "ok";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Store configurations, data exports, and administrative maintenance tools.
        </p>
      </div>

      {/* 1. Section: Store Information */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Store className="w-5 h-5 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">Store Information</h2>
          </div>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
            Read-only
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Store Name
            </label>
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              <span>iStore Apple Hub</span>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Official Store</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Environment
            </label>
            <div className="font-semibold text-gray-900 capitalize flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{import.meta.env.MODE || "development"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              API URL
            </label>
            <div className="font-mono text-xs text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 truncate">
              {API_BASE}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Database
            </label>
            <div className="flex items-center gap-2 font-medium text-gray-800">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Supabase</span>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                  <XCircle className="w-3.5 h-3.5" /> Disconnected
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Section: Admin Users Quick Link */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Admin Users</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Promote new administrators or manage existing permissions.
            </p>
          </div>
        </div>

        <Link
          to="/admins"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition shrink-0"
        >
          <span>Manage Admins</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* 3. Section: Data Export */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <Download className="w-5 h-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Data Export</h2>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-6">
            Export raw CSV datasets for spreadsheet analytics, financial auditing, or backup records.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Products Catalog</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Full inventory details including pricing, models, and stock levels.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportProducts}
                disabled={exportingProducts}
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition disabled:opacity-50"
              >
                {exportingProducts ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export All Products (CSV)</span>
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Orders & Deliveries</h3>
                <p className="text-xs text-gray-500 mt-1">
                  All customer transactions, delivery addresses, and payment logs.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportOrders}
                disabled={exportingOrders}
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition disabled:opacity-50"
              >
                {exportingOrders ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export All Orders (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: Danger Zone */}
      <section className="bg-white rounded-2xl border-2 border-rose-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-rose-50/50 border-b border-rose-100 flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold text-rose-900">Danger Zone</h2>
        </div>

        <div className="p-6 divide-y divide-gray-100 space-y-6">
          {/* Row 1: Delete Demo Orders */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="max-w-lg">
              <h3 className="text-sm font-semibold text-gray-900">Delete Demo Orders</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Removes all orders created by the seed script (reference starting with{" "}
                <code className="text-rose-600 font-mono bg-rose-50 px-1 py-0.5 rounded">
                  gha_demo_
                </code>
                ). Real customer orders are not affected.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setConfirmWipeDemoOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 hover:border-rose-400 rounded-xl transition shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Demo Orders</span>
            </button>
          </div>

          {/* Row 2: Reset All Transaction Data */}
          <div className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="max-w-lg">
              <h3 className="text-sm font-semibold text-gray-900">Reset All Transaction Data</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Deletes <strong className="text-rose-600">ALL</strong> orders, order items, and
                customer reviews. Products and user accounts are kept. Use before launch to start
                fresh.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setConfirmResetAllOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Transaction Data</span>
            </button>
          </div>

          {/* Row 3: System Information (Live Read-Only Counts) */}
          <div className="pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              System Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[11px] font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>Total Products</span>
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {loadingProducts ? "..." : (productStats?.totalProducts ?? 0)}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[11px] font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Total Orders</span>
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {loadingRevenue ? "..." : (revenueStats?.orderCount ?? 0)}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[11px] font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Total Users</span>
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {loadingUsers ? "..." : (usersData?.meta?.total ?? 0)}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[11px] font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Total Revenue</span>
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {loadingRevenue ? "..." : formatGHS(revenueStats?.revenueGHS ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Dialog: Delete Demo Orders */}
      <ConfirmDialog
        isOpen={confirmWipeDemoOpen}
        title="Delete Demo Orders"
        message="This will permanently delete all demo orders and associated order items created by the seed script. Real customer orders will remain intact. Continue?"
        confirmText="Delete Demo Orders"
        confirmStyle="danger"
        loading={wipeDemoMutation.isPending}
        onCancel={() => setConfirmWipeDemoOpen(false)}
        onConfirm={() => wipeDemoMutation.mutate()}
      />

      {/* Confirmation Dialog: Reset All Transaction Data (Requires typing "DELETE") */}
      <ConfirmDialog
        isOpen={confirmResetAllOpen}
        title="Nuclear Reset: All Transaction Data"
        message="WARNING: This action is irreversible. All orders, order items, and reviews will be permanently wiped. Your product catalog and user accounts will remain untouched."
        confirmText="Reset All Data"
        confirmStyle="danger"
        requireMatchText="DELETE"
        inputPlaceholder="Type DELETE to confirm..."
        loading={resetAllMutation.isPending}
        onCancel={() => setConfirmResetAllOpen(false)}
        onConfirm={() => resetAllMutation.mutate()}
      />
    </div>
  );
}

export default Settings;
