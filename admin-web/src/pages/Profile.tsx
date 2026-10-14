import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { KeyRound, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/Toast";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0 flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <span className="text-xs font-bold text-gray-900 text-right break-all max-w-[60%]">
        {value || "—"}
      </span>
    </div>
  );
}

export function Profile() {
  const { user, session, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      toast.success("Password updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the password.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const initials = (() => {
    if (!user?.name) return "AD";
    const parts = user.name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : user.name.slice(0, 2).toUpperCase();
  })();

  const formatDate = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
          new Date(value)
        )
      : "—";

  const sessionExpiry = session?.expires_at
    ? new Date(session.expires_at * 1000).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "—";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your account details and admin portal security.
        </p>
      </div>

      {/* Identity */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-900 text-white font-bold text-lg flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold text-gray-900 truncate">
              {user?.name || "Unnamed account"}
            </div>
            <div className="text-sm text-gray-500 truncate">{user?.email || "No email on file"}</div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-bold uppercase tracking-wide text-neutral-800">
              <ShieldCheck className="w-3 h-3" />
              {user?.role || "staff"}
            </div>
          </div>
        </div>
      </section>

      {/* Account details */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <UserIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Account details</h2>
        </div>
        <div className="px-6 py-2">
          <Field label="Full name" value={user?.name} />
          <Field label="Email" value={user?.email} />
          <Field label="Phone" value={user?.phone} />
          <Field label="Role" value={<span className="capitalize">{user?.role}</span>} />
          <Field
            label="Status"
            value={
              user?.isActive === undefined ? (
                "—"
              ) : (
                <span className={user.isActive ? "text-neutral-900" : "text-gray-400"}>
                  {user.isActive ? "Active" : "Disabled"}
                </span>
              )
            }
          />
          <Field label="Account ID" value={<code className="font-mono">{user?.id}</code>} />
        </div>
        <div className="px-6 py-3 bg-gray-50/70 border-t border-gray-100 text-[11px] text-gray-500">
          Contact details are managed by the store owner against each Supabase auth user. Editing
          them here is not supported by the backend yet.
        </div>
      </section>

      {/* Security */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <KeyRound className="w-5 h-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Password</h2>
        </div>
        <form onSubmit={changePassword} className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Change the password you use to sign in to this admin portal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">New password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition"
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !password || !confirm}
              className="px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-xl hover:bg-black transition disabled:opacity-50"
            >
              {saving ? "Updating…" : "Update password"}
            </button>
            <span className="text-[11px] text-gray-400">Minimum 8 characters.</span>
          </div>
        </form>
      </section>

      {/* Session */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Current session</h2>
        </div>
        <div className="px-6 py-2">
          <Field label="Signed in as" value={user?.email || session?.user?.email} />
          <Field label="Session expires" value={sessionExpiry} />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/settings"
          className="px-4 py-2 text-sm font-semibold text-neutral-900 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition"
        >
          Store settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-xl hover:bg-black transition"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );
}

export default Profile;
