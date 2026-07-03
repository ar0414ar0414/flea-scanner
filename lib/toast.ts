export type ToastType = "error" | "success" | "info";

export function toast(message: string, type: ToastType = "info") {
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { message, type } }));
}
