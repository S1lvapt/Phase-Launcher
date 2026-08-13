import { Toaster } from "react-hot-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../hooks/useTheme";

export function CustomToaster() {
  const colors = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: 0,
        },
        success: {
          duration: 3000,
        },
        error: {
          duration: 5000,
        },
      }}
      containerStyle={{
        top: 60,
        right: 20,
      }}
    >
      {(t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";
        const isLoading = t.type === "loading";

        const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

        return (
          <div
            className={`
              flex items-start gap-3 p-4 pr-3 rounded-xl border backdrop-blur-sm
              transition-all duration-300 min-w-[320px] max-w-md z-500000
              ${
                t.visible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }
              ${
                isSuccess
                  ? `${colors.current.background.secondary}/90 border-emerald-500/30`
                  : isError
                    ? `${colors.current.background.secondary}/90 border-red-500/30`
                    : `${colors.current.background.secondary}/90 border-zinc-700/50`
              }
            `}
            style={{
              boxShadow: isSuccess
                ? "0 0 20px rgba(16, 185, 129, 0.1)"
                : isError
                  ? "0 0 20px rgba(239, 68, 68, 0.1)"
                  : "0 4px 20px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="shrink-0 mt-0.5">
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <Icon
                  size={20}
                  className={
                    isSuccess
                      ? "text-emerald-400"
                      : isError
                        ? "text-red-400"
                        : "text-white"
                  }
                  strokeWidth={2}
                />
              )}
            </div>

            <div className="flex-1 text-sm text-white font-light leading-relaxed">
              {typeof t.message === "function" ? t.message(t) : t.message}
            </div>

            {!isLoading && (
              <button
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 p-1 rounded-md transition-colors duration-150 hover:bg-white/10"
                aria-label="Close"
              >
                <X size={16} className="text-zinc-400 hover:text-white" />
              </button>
            )}
          </div>
        );
      }}
    </Toaster>
  );
}

export const showToast = {
  success: (message: string) => {
    toast.success(message);
  },
  error: (message: string) => {
    toast.error(message);
  },
  loading: (message: string) => {
    return toast.loading(message);
  },
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};
