export interface OpenCheckoutOptions {
  authorizationUrl: string;
  reference: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
}

/**
 * Paystack Checkout Configuration Helper
 * Used by PaystackCheckoutModal to handle webview callbacks and redirection states
 */
export function isPaystackSuccessUrl(url: string, reference: string): boolean {
  return (
    url.includes("success") ||
    url.includes(`reference=${reference}`) ||
    url.includes("trxref=")
  );
}

export function isPaystackCancelUrl(url: string): boolean {
  return (
    url.includes("cancel") ||
    url.includes("close")
  );
}
