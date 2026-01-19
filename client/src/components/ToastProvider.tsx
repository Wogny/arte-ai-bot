import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      theme="dark"
      expand={true}
      closeButton
      visibleToasts={5}
      style={{
        "--sonner-color-success": "#10b981",
        "--sonner-color-error": "#ef4444",
        "--sonner-color-warning": "#f59e0b",
        "--sonner-color-info": "#3b82f6",
        "--sonner-color-loading": "#06b6d4",
      } as React.CSSProperties}
    />
  );
}
