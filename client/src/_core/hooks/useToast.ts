import { toast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const showToast = (
    message: string,
    type: ToastType = "info",
    options?: ToastOptions
  ) => {
    const { duration = 4000, description, action } = options || {};

    switch (type) {
      case "success":
        toast.success(message, {
          description,
          duration,
          action,
        });
        break;
      case "error":
        toast.error(message, {
          description,
          duration,
          action,
        });
        break;
      case "warning":
        toast.warning(message, {
          description,
          duration,
          action,
        });
        break;
      case "loading":
        toast.loading(message, {
          description,
          duration: 0, // Loading toasts don't auto-dismiss
        });
        break;
      case "info":
      default:
        toast(message, {
          description,
          duration,
          action,
        });
        break;
    }
  };

  return {
    success: (message: string, options?: ToastOptions) =>
      showToast(message, "success", options),
    error: (message: string, options?: ToastOptions) =>
      showToast(message, "error", options),
    warning: (message: string, options?: ToastOptions) =>
      showToast(message, "warning", options),
    info: (message: string, options?: ToastOptions) =>
      showToast(message, "info", options),
    loading: (message: string, options?: ToastOptions) =>
      showToast(message, "loading", options),
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string;
        error: string;
      },
      options?: ToastOptions
    ) => {
      return toast.promise(promise, messages, {
        duration: options?.duration,
      });
    },
  };
}
