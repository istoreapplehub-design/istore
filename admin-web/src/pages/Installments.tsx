import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Cpu,
  Sparkles
} from "lucide-react";
import { getAdminInstallments, updateAdminInstallmentSerial, formatGHS, timeAgo } from "../lib/api";
import { useToast } from "../components/Toast";

const STATUS_TABS = [
  { id: "all", label: "All Plans" },
  { id: "active", label: "Active" },
  { id: "pending_downpayment", label: "Pending 60% Down" },
  { id: "completed", label: "Completed" },
  { id: "defaulted", label: "Defaulted" }
];

export function Installments() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  // Serial editing in modal
  const [modalSerial, setModalSerial] = useState("");
  const [modalImei, setModalImei] = useState("");
  const [isEditingSerial, setIsEditingSerial] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-installments", page, search, statusFilter],
    queryFn: () =>
      getAdminInstallments({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      })
  });

  const serialMutation = useMutation({
    mutationFn: () =>
      updateAdminInstallmentSerial(selectedPlan.id, {
        serialNumber: modalSerial.trim() || null,
        imei: modalImei.trim() || null
      }),
    onSuccess: (res) => {
      toast.success("Apple Serial & IMEI saved to installment plan");
      setSelectedPlan((prev: any) => ({
        ...prev,
        serialNumber: res.data.serialNumber,
        imei: res.data.imei
      }));
      setIsEditingSerial(false);
      queryClient.invalidateQueries({ queryKey: ["admin-installments"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update serial number");
    }
  });

  const openInspector = (plan: any) => {
    setSelectedPlan(plan);
    setModalSerial(plan.serialNumber || plan.order?.items?.[0]?.serialNumber || "");
    setModalImei(plan.imei || plan.order?.items?.[0]?.imei || "");
    setIsEditingSerial(!plan.serialNumber && !plan.order?.items?.[0]?.serialNumber);
  };

  const plans = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 15, totalPages: 1 };
  const stats = data?.stats || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <PageHeader
        title="Installment Plans"
        subtitle="Monitor 60% down payments, verify NIA Ghana Card identities, and track weekly/monthly repayments."
        badge={
          <>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
              NIA GHANA CARD VERIFIED
            </span>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
              60% DOWN PAYMENT
            </span>
          </>
        }
      />

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Total Applications</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">{meta.total}</p>
          <p className="text-xs text-gray-400 mt-1">Verified via NIA Live API</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Active Plans</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {plans.filter((p: any) => p.status === "active").length}
          </p>
          <p className="text-xs text-gray-400 mt-1">60% down payment received</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Weekly Repayments</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {plans.filter((p: any) => p.frequency === "weekly").length}
          </p>
          <p className="text-xs text-gray-400 mt-1">4-week disbursement schedule</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Monthly Repayments</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {plans.filter((p: any) => p.frequency === "monthly").length}
          </p>
          <p className="text-xs text-gray-400 mt-1">2-month scheduled installments</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone or Ghana Card..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition"
          />
        </div>
      </div>

      {/* Main Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading installment plans...</div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-900">No installment applications found</p>
            <p className="text-xs text-gray-500 mt-1">
              When customers verify their Ghana Card and choose 60% down, their applications will show here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#fafafc] border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Customer & Ghana Card</th>
                    <th className="px-5 py-3.5">Device & Order</th>
                    <th className="px-5 py-3.5">Total & 60% Down</th>
                    <th className="px-5 py-3.5">Schedule</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {plans.map((plan: any) => {
                    const paidMilestones = plan.milestones?.filter((m: any) => m.status === "paid").length || 0;
                    const totalMilestones = plan.milestones?.length || 1;

                    return (
                      <tr key={plan.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900">{plan.applicantName}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{plan.ghanaCardNumber}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{plan.applicantPhone}</div>
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Score: {plan.user?.creditScore || plan.creditScoreAtApproval || 650} ({plan.user?.creditTier || "Silver"})</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-gray-900 font-medium">
                            {plan.order?.items?.[0]?.name || "Apple Device Package"}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 font-mono">
                            Order #{plan.orderId.slice(0, 8).toUpperCase()}
                          </div>
                          {(plan.serialNumber || plan.order?.items?.[0]?.serialNumber) ? (
                            <div className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <Cpu className="w-3 h-3" />
                              <span>SN: {plan.serialNumber || plan.order?.items?.[0]?.serialNumber}</span>
                            </div>
                          ) : (
                            <span className="mt-1 inline-block text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              No SN Assigned
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-gray-900 font-bold">{formatGHS(plan.totalAmountGHS)}</div>
                          <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                            60% Down: {formatGHS(plan.downPaymentGHS)}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Balance: {formatGHS(plan.remainingGHS)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-50 text-blue-700">
                            {plan.frequency}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {paidMilestones} of {totalMilestones} milestones cleared
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                              plan.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : plan.status === "completed"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {plan.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => openInspector(plan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-gray-800 text-xs font-semibold transition"
                          >
                            <span>Inspect KYC</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {plans.map((plan: any) => (
                <div key={plan.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{plan.applicantName}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{plan.ghanaCardNumber}</div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        plan.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {plan.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Device:</span>
                      <span className="font-semibold text-gray-800">
                        {plan.order?.items?.[0]?.name || "Apple Device"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total / 60% Down:</span>
                      <span className="font-bold text-gray-900">
                        {formatGHS(plan.totalAmountGHS)} / {formatGHS(plan.downPaymentGHS)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Schedule:</span>
                      <span className="font-semibold text-blue-600 capitalize">
                        {plan.frequency} ({plan.totalInstallments} payments)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openInspector(plan)}
                    className="w-full py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold text-center"
                  >
                    View Schedule & KYC
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* KYC & Repayment Detail Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">Installment KYC & Schedule</h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Plan #{selectedPlan.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Applicant Verified Details */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Applicant Legal Name:</span>
                <span className="font-bold text-gray-900">{selectedPlan.applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Ghana Card PIN:</span>
                <span className="font-mono font-bold text-emerald-700">{selectedPlan.ghanaCardNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Phone Number:</span>
                <span className="font-semibold text-gray-800">{selectedPlan.applicantPhone}</span>
              </div>
              {selectedPlan.gpsAddress && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Digital GPS Address:</span>
                  <span className="font-mono text-gray-800">{selectedPlan.gpsAddress}</span>
                </div>
              )}
              {selectedPlan.occupation && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Occupation:</span>
                  <span className="text-gray-800">{selectedPlan.occupation}</span>
                </div>
              )}
              {selectedPlan.nextOfKinName && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500 font-medium">Next of Kin / Guarantor:</span>
                  <span className="font-semibold text-gray-800">
                    {selectedPlan.nextOfKinName} ({selectedPlan.nextOfKinPhone})
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-500 font-medium">Customer Trust Rating:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedPlan.user?.creditScore || selectedPlan.creditScoreAtApproval || 650} / 850 ({selectedPlan.user?.creditTier || "Silver"} Tier)
                </span>
              </div>
            </div>

            {/* Apple Hardware Collateral & Serial Number Section */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-900">Apple Hardware Collateral & Serial</span>
                </div>
                {selectedPlan.serialNumber && !isEditingSerial && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Warranty Active
                  </span>
                )}
              </div>

              {isEditingSerial ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Apple Serial Number
                    </label>
                    <input
                      type="text"
                      value={modalSerial}
                      onChange={(e) => setModalSerial(e.target.value)}
                      placeholder="e.g. F2LL80R0Q2"
                      className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Device IMEI
                    </label>
                    <input
                      type="text"
                      value={modalImei}
                      onChange={(e) => setModalImei(e.target.value)}
                      placeholder="e.g. 356789012345678"
                      className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    {selectedPlan.serialNumber && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalSerial(selectedPlan.serialNumber || "");
                          setModalImei(selectedPlan.imei || "");
                          setIsEditingSerial(false);
                        }}
                        className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={serialMutation.isPending}
                      onClick={() => serialMutation.mutate()}
                      className="px-3 py-1 text-xs font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition"
                    >
                      {serialMutation.isPending ? "Saving..." : "Save Hardware ID"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-1 font-mono">
                    <div>
                      <span className="text-[10px] text-gray-400 font-sans block">Serial Number:</span>
                      <span className="font-bold text-gray-900">{selectedPlan.serialNumber || "None Assigned"}</span>
                    </div>
                    {selectedPlan.imei && (
                      <div>
                        <span className="text-[10px] text-gray-400 font-sans block">IMEI:</span>
                        <span className="text-gray-700">{selectedPlan.imei}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingSerial(true)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Edit Hardware ID
                  </button>
                </div>
              )}
            </div>

            {/* Financials */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                <p className="text-[11px] text-blue-700 font-semibold">Total Price</p>
                <p className="text-sm font-extrabold text-blue-900 mt-1">{formatGHS(selectedPlan.totalAmountGHS)}</p>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                <p className="text-[11px] text-emerald-700 font-semibold">60% Down Paid</p>
                <p className="text-sm font-extrabold text-emerald-900 mt-1">{formatGHS(selectedPlan.downPaymentGHS)}</p>
              </div>
              <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                <p className="text-[11px] text-purple-700 font-semibold">Remaining 40%</p>
                <p className="text-sm font-extrabold text-purple-900 mt-1">{formatGHS(selectedPlan.remainingGHS)}</p>
              </div>
            </div>

            {/* Milestones Schedule */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Milestone Payments</p>
              <div className="space-y-2">
                {selectedPlan.milestones?.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          m.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {m.milestoneIndex}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Installment #{m.milestoneIndex}</p>
                        <p className="text-[11px] text-gray-400">
                          Due: {new Date(m.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-gray-900">{formatGHS(m.amountGHS)}</p>
                      <span
                        className={`text-[10px] font-extrabold uppercase ${
                          m.status === "paid" ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedPlan(null)}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
