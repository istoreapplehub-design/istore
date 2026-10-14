import React from "react";
import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmStyle?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  requireMatchText?: string;
  inputPlaceholder?: string;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  confirmStyle = "primary",
  onConfirm,
  onCancel,
  loading = false,
  requireMatchText,
  inputPlaceholder = "Type here to confirm..."
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setTypedValue("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = loading || (requireMatchText ? typedValue.trim() !== requireMatchText : false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 transform transition-all">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              confirmStyle === "danger"
                ? "bg-rose-50 text-rose-600"
                : "bg-neutral-100 text-neutral-900"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{message}</p>
            {requireMatchText && (
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Type <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1 py-0.5 rounded">{requireMatchText}</span> to proceed:
                </label>
                <input
                  type="text"
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-medium text-white rounded-full transition disabled:opacity-50 ${
              confirmStyle === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-black hover:bg-neutral-800"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
