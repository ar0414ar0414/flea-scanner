"use client";

import { useRef, useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import Link from "next/link";

const BarcodeScanner = lazy(() => import("./BarcodeScanner"));

export default function ScannerHome() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showBarcode, setShowBarcode] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1024 });
      const url = URL.createObjectURL(compressed);
      setPreview(url);

      const form = new FormData();
      form.append("image", compressed);

      const res = await fetch("/api/analyze", { method: "POST", body: form });
      if (!res.ok) throw new Error("AI識別失敗");
      const aiResult = await res.json();

      sessionStorage.setItem("aiResult", JSON.stringify(aiResult));
      sessionStorage.setItem("imageUrl", url);

      router.push("/result");
    } catch (e) {
      console.error(e);
      alert("識別に失敗しました。もう一度試してください。");
      setLoading(false);
      setPreview(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 pb-12">
      {showBarcode && (
        <Suspense fallback={null}>
          <BarcodeScanner onClose={() => setShowBarcode(false)} />
        </Suspense>
      )}
      {/* ヘッダー */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🔍</div>
        <h1 className="text-2xl font-bold text-slate-800">フリマスキャナー</h1>
        <p className="text-slate-500 text-sm mt-1">撮影するだけで相場と利益がわかる</p>
      </div>

      {/* 撮影エリア */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        className={`w-full max-w-sm aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
          ${loading
            ? "border-orange-300 bg-orange-50"
            : preview
              ? "border-orange-400 bg-orange-50"
              : "border-slate-300 bg-white hover:border-orange-400 hover:bg-orange-50"
          }`}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-orange-600 font-medium text-sm">AI解析中...</p>
          </div>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="w-full h-full object-cover rounded-3xl" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="font-medium">タップして撮影</p>
            <p className="text-xs">またはギャラリーから選択</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* サブアクション */}
      {!loading && !preview && (
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute("capture");
                inputRef.current.click();
                setTimeout(() => inputRef.current?.setAttribute("capture", "environment"), 500);
              }
            }}
            className="text-slate-500 text-sm underline underline-offset-2"
          >
            ギャラリーから選ぶ
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => setShowBarcode(true)}
            className="text-slate-500 text-sm underline underline-offset-2"
          >
            バーコードスキャン
          </button>
        </div>
      )}

      {/* 使い方 */}
      <div className="mt-12 w-full max-w-sm space-y-3">
        {[
          { icon: "📸", text: "商品を撮影する" },
          { icon: "🤖", text: "AIがブランド・状態を識別" },
          { icon: "💴", text: "相場と利益を自動計算" },
        ].map(({ icon, text }, i) => (
          <div key={i} className="flex items-center gap-3 text-slate-600 text-sm">
            <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-base flex-shrink-0">
              {icon}
            </span>
            {text}
          </div>
        ))}
      </div>

      <Link href="/history" className="mt-8 text-sm text-slate-400 hover:text-orange-500 transition-colors">
        スキャン履歴を見る →
      </Link>
    </main>
  );
}
