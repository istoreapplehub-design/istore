import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Star,
  Edit2,
  Trash2,
  RotateCcw,
  Package,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  getAdminProducts,
  deactivateAdminProduct,
  restoreAdminProduct,
  formatGHS
} from "../lib/api";
import { Product } from "../types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export function Products() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? ""
  );
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["admin-products", page, search, category, statusFilter],
    queryFn: () =>
      getAdminProducts({
        page,
        limit,
        search: search.trim() || undefined,
        category: category !== "all" ? category : undefined,
        isActive:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
            ? false
            : undefined
      })
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("Product hidden from store.");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to deactivate product");
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success("Product restored to store.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to restore product");
    }
  });

  const products = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 15, total: 0, totalPages: 1, hasNext: false };

  const startCount = (meta.page - 1) * meta.limit + 1;
  const endCount = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <PageHeader
        title="Products"
        subtitle="Manage your hardware inventory, pricing, stock levels, and store visibility."
        actions={
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 bg-black hover:bg-neutral-800 text-white font-semibold rounded-full px-5 py-2.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </Link>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by title, model, or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition"
          />
        </div>

        {/* Category Select */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 focus:bg-white focus:border-black outline-none transition"
          >
            <option value="all">All Categories</option>
            <option value="iPhone">iPhone</option>
            <option value="iPad">iPad</option>
            <option value="Mac">Mac</option>
            <option value="Watch">Apple Watch</option>
            <option value="AirPods">AirPods</option>
            <option value="TV & Home">TV & Home</option>
            <option value="Accessories">Accessories</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 focus:bg-white focus:border-black outline-none transition"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Products Container: Mobile Vertical Cards + Desktop Horizontal Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* ─── MOBILE VIEW: VERTICAL STACKED CARDS (md:hidden) ─── */}
        <div className="lg:hidden divide-y divide-gray-100">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-gray-400 text-xs">
              Loading products catalog...
            </div>
          ) : products.length > 0 ? (
            products.map((item) => {
              const heroImg = item.images?.[0] || item.colors?.[0]?.images?.[0];
              const isOut = item.stock === 0;
              const isLow = item.stock > 0 && item.stock < 5;

              return (
                <div key={item.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50/70 transition">
                  {/* Top: Image, Category, Status */}
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white p-1 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
                      {heroImg ? (
                        <img src={heroImg} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-semibold">
                          {item.category}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {item.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>

                      <Link
                        to={`/products/${item.id}/edit`}
                        className="font-bold text-gray-900 text-sm hover:underline block truncate mt-1"
                      >
                        {item.name}
                      </Link>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-mono">
                        <span>{item.model}</span>
                        <span>·</span>
                        <span className="capitalize">{item.condition}</span>
                        {item.featured ? (
                          <>
                            <span>·</span>
                            <span className="text-amber-500 font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500" /> Featured
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Price, Stock, Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div>
                      <span className="font-extrabold text-gray-900 text-base">
                        {formatGHS(item.priceGHS)}
                      </span>
                      <span
                        className={`ml-2 text-xs font-semibold ${
                          isOut
                            ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md"
                            : isLow
                            ? "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"
                            : "text-gray-500"
                        }`}
                      >
                        {item.stock} in stock
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/products/${item.id}/edit`}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </Link>

                      {item.isActive ? (
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hide Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => restoreMutation.mutate(item.id)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Restore to Store"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-16 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-base font-semibold text-gray-700">No products found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try clearing search filters or add a new product to your inventory.
              </p>
            </div>
          )}
        </div>

        {/* ─── DESKTOP VIEW: HORIZONTAL TABLE (hidden md:block) ─── */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5 w-16">Item</th>
                <th className="px-6 py-3.5">Product Title</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Condition</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Stock</th>
                <th className="px-6 py-3.5 text-center">Featured</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-xs">
                    Loading products catalog...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((item) => {
                  const heroImg = item.images?.[0] || item.colors?.[0]?.images?.[0];
                  const isOut = item.stock === 0;
                  const isLow = item.stock > 0 && item.stock < 5;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-3.5">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
                          {heroImg ? (
                            <img src={heroImg} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <Link
                          to={`/products/${item.id}/edit`}
                          className="font-semibold text-gray-900 hover:text-black hover:underline transition block truncate max-w-xs"
                        >
                          {item.name}
                        </Link>
                        <span className="text-xs text-gray-400 font-mono">{item.model}</span>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                          {item.category}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-xs text-gray-500 font-medium">
                        {item.condition}
                      </td>

                      <td className="px-6 py-3.5 font-bold text-gray-900">
                        {formatGHS(item.priceGHS)}
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`font-semibold text-xs ${
                            isOut
                              ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md"
                              : isLow
                              ? "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"
                              : "text-gray-700"
                          }`}
                        >
                          {item.stock} in stock
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-center">
                        {item.featured ? (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {item.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${item.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {item.isActive ? (
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hide Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => restoreMutation.mutate(item.id)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Restore to Store"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-base font-semibold text-gray-700">No products found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try clearing search filters or add a new product to your inventory.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.total > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Showing {startCount}–{endCount} of {meta.total} products
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || isPlaceholderData}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold px-2 text-gray-700">
                Page {meta.page} of {meta.totalPages}
              </span>

              <button
                disabled={!meta.hasNext || isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Deactivate Dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hide Product"
        message={`Are you sure you want to hide "${deleteTarget?.name}" from customer storefront?`}
        confirmText="Hide from Store"
        confirmStyle="danger"
        loading={deactivateMutation.isPending}
        onConfirm={() => deleteTarget && deactivateMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Products;
