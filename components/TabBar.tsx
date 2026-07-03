"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "スキャン", icon: "📷" },
  { href: "/history", label: "履歴", icon: "📋" },
  { href: "/dashboard", label: "収支", icon: "📊" },
];

export default function TabBar() {
  const pathname = usePathname();
  if (pathname === "/result") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex">
        {TABS.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                active ? "text-orange-500 font-bold" : "text-slate-400"
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
