"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine, History, PieChart } from "lucide-react";

const TABS = [
  { href: "/", label: "スキャン", Icon: ScanLine },
  { href: "/history", label: "履歴", Icon: History },
  { href: "/dashboard", label: "収支", Icon: PieChart },
];

export default function TabBar() {
  const pathname = usePathname();
  if (pathname === "/result") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/85 backdrop-blur-xl border-t border-slate-200/70 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex px-4 py-1.5">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-1"
            >
              <span
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-all ${
                  active ? "bg-orange-100" : ""
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? "text-orange-600" : "text-slate-400"}
                />
              </span>
              <span className={`text-[10px] ${active ? "text-orange-600 font-bold" : "text-slate-400 font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
