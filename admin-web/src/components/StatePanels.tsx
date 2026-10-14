import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ApiError({
  message,
  onRetry
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-3">
      <AlertTriangle className="w-6 h-6 text-gray-400" />
      <div className="text-sm font-semibold text-gray-900">Couldn't load this from the store</div>
      <div className="text-xs text-gray-500 max-w-xs">{message || "The API request failed."}</div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-900 border border-neutral-200 rounded-full hover:bg-neutral-100 transition"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex items-center justify-center text-center py-10">
      <div className="text-xs text-gray-400 font-medium max-w-xs">{children}</div>
    </div>
  );
}

export default Empty;
