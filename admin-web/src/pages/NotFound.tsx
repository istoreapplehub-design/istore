import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        The dashboard view you requested could not be found or may have been relocated.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 bg-black hover:bg-neutral-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}

export default NotFound;
