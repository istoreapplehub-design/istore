import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { listAdmins, listAllUsers, upgradeUserRole } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { AdminUser } from "../types";

export function Admins() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Dialog & Modal state
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [adminToDemote, setAdminToDemote] = useState<AdminUser | null>(null);
  const [userToPromote, setUserToPromote] = useState<AdminUser | null>(null);

  // Search state for promote modal
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query: Admins list
  const {
    data: admins = [],
    isLoading: loadingAdmins,
    error: adminsError,
    refetch: refetchAdmins
  } = useQuery({
    queryKey: ["admins-list"],
    queryFn: listAdmins
  });

  // Query: Search customers for promotion
  const {
    data: customersData,
    isLoading: loadingCustomers
  } = useQuery({
    queryKey: ["customers-search", debouncedSearch],
    queryFn: () =>
      listAllUsers({
        role: "customer",
        search: debouncedSearch,
        limit: 10
      }),
    enabled: promoteModalOpen
  });

  // Demote Mutation
  const demoteMutation = useMutation({
    mutationFn: (userId: string) => upgradeUserRole(userId, "customer"),
    onSuccess: () => {
      toast.success("Admin demoted to customer successfully");
      queryClient.invalidateQueries({ queryKey: ["admins-list"] });
      setAdminToDemote(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to demote admin");
    }
  });

  // Promote Mutation
  const promoteMutation = useMutation({
    mutationFn: (userId: string) => upgradeUserRole(userId, "admin"),
    onSuccess: (res) => {
      toast.success(`${res.user.name || "User"} promoted to admin`);
      queryClient.invalidateQueries({ queryKey: ["admins-list"] });
      queryClient.invalidateQueries({ queryKey: ["customers-search"] });
      setUserToPromote(null);
      setPromoteModalOpen(false);
      setSearchQuery("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to promote user");
    }
  });

  const isOnlyOneAdmin = admins.length === 1 && admins[0]?.id === currentUser?.id;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Users</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-neutral-100 text-neutral-900 rounded-full border border-neutral-200">
              {admins.length} {admins.length === 1 ? "Admin" : "Admins"}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage admin users with access to store operations and inventory.
          </p>
        </div>

        <button
          onClick={() => {
            setSearchQuery("");
            setPromoteModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-semibold text-sm rounded-full shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Promote User</span>
        </button>
      </div>

      {/* Helper Banner when only 1 admin */}
      {isOnlyOneAdmin && !loadingAdmins && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 text-neutral-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">Only you are an admin</h4>
            <p className="text-sm text-neutral-600 mt-0.5">
              Promote another user to help manage the store and avoid being locked out.
            </p>
          </div>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loadingAdmins ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-black mb-3" />
            <p className="text-sm font-medium text-gray-500">Loading admin users...</p>
          </div>
        ) : adminsError ? (
          <div className="py-16 text-center text-neutral-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-800" />
            <p className="font-semibold text-sm">Failed to load admin users</p>
            <button
              onClick={() => refetchAdmins()}
              className="mt-3 px-4 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 rounded-lg hover:bg-neutral-200"
            >
              Retry
            </button>
          </div>
        ) : admins.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No admin users found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Promote a registered user to grant administrative permissions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Phone</th>
                  <th className="py-3.5 px-6">Added</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-normal">
                {admins.map((adm) => {
                  const isSelf = adm.id === currentUser?.id;
                  const addedDate = adm.createdAt
                    ? new Date(adm.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "—";

                  return (
                    <tr key={adm.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-black text-white font-semibold text-xs flex items-center justify-center shrink-0">
                            {adm.name ? adm.name.slice(0, 2).toUpperCase() : "AD"}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <span>{adm.name || "Unnamed"}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 capitalize">{adm.role}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-gray-700 font-medium">
                        {adm.email || "—"}
                      </td>

                      <td className="py-4 px-6 text-gray-600 font-mono text-xs">
                        {adm.phone || "—"}
                      </td>

                      <td className="py-4 px-6 text-gray-500 text-xs">
                        {addedDate}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          disabled={isSelf || demoteMutation.isPending}
                          title={isSelf ? "You cannot demote yourself" : "Demote to customer"}
                          onClick={() => setAdminToDemote(adm)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            isSelf
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                          }`}
                        >
                          Demote
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demote Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(adminToDemote)}
        title="Demote Admin User"
        message={`Are you sure you want to demote ${adminToDemote?.name || "this user"} to customer? They will lose access to the admin dashboard.`}
        confirmText="Demote to Customer"
        confirmStyle="danger"
        loading={demoteMutation.isPending}
        onCancel={() => setAdminToDemote(null)}
        onConfirm={() => {
          if (adminToDemote) {
            demoteMutation.mutate(adminToDemote.id);
          }
        }}
      />

      {/* Promote User Modal */}
      {promoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Promote User to Admin</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Search customers by name, email, or phone number to grant admin rights.
                </p>
              </div>
              <button
                onClick={() => setPromoteModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search registered customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                  autoFocus
                />
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingCustomers ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-black mb-2" />
                  <p className="text-xs">Searching users...</p>
                </div>
              ) : !customersData?.data || customersData.data.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-gray-600">No matching customers found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try searching with a different name, email, or phone.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customersData.data.map((usr) => (
                    <div
                      key={usr.id}
                      className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {usr.name || "Unnamed"}
                        </div>
                        <div className="text-xs text-gray-500 truncate flex items-center gap-2 mt-0.5">
                          <span>{usr.email || "No email"}</span>
                          <span>•</span>
                          <span className="font-mono">{usr.phone}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setUserToPromote(usr)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg shrink-0 transition"
                      >
                        Promote
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPromoteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-black bg-white border border-gray-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(userToPromote)}
        title="Confirm Admin Promotion"
        message={`Are you sure you want to promote ${userToPromote?.name || "this user"} (${userToPromote?.email || userToPromote?.phone}) to admin? They will gain full administrative privileges.`}
        confirmText="Promote to Admin"
        confirmStyle="primary"
        loading={promoteMutation.isPending}
        onCancel={() => setUserToPromote(null)}
        onConfirm={() => {
          if (userToPromote) {
            promoteMutation.mutate(userToPromote.id);
          }
        }}
      />
    </div>
  );
}

export default Admins;
