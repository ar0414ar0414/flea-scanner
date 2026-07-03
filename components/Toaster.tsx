"use client";

import { useEffect, useState } from "react";
import type { ToastType } from "@/lib/toast";

type Toast = { id: number; message: string; type: ToastType };

const TYPE_STYLE: Record<ToastType, string> = {
  error: "bg-red-500",
  success: "bg-green-500",
  info: "bg-slate-700",
};

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    };
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);

    window.addEventListener("app-toast", onToast);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("app-toast", onToast);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return (
    <>
      {offline && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-slate-800 text-white text-center text-xs py-1.5">
          📡 オフラインです — 相場取得・AI解析は利用できません
        </div>
      )}
      <div className="fixed bottom-20 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${TYPE_STYLE[t.type]} text-white text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-sm w-full text-center animate-[fadeIn_0.2s_ease-out]`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
