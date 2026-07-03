"use client";

import { useRef, useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { toast } from "@/lib/toast";
import { Camera, Sparkles, JapaneseYen, Images, Barcode, Loader2, Check, ScanSearch } from "lucide-react";

const BarcodeScanner = lazy(() => import("./BarcodeScanner"));

type Step = "compress" | "analyze";

const STEPS: { key: Step; Icon: typeof Camera; label: string }[] = [
  { key: "compress", Icon: Camera, label: "画像を圧縮中" },
  { key: "analyze", Icon: Sparkles, label: "AIがブランド・状態を識別中" },
];

export default function ScannerHome() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showBarcode, setShowBarcode] = useState(false);
  const loading = step !== null;

  const handleFile = async (file: File) => {
    if (!navigator.onLine) {
      toast("オフラインのためAI解析できません", "error");
      return;
    }
    setStep("compress");
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1024 });
      const url = URL.createObjectURL(compressed);
      setPreview(url);
      setStep("analyze");

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
      toast("識別に失敗しました。もう一度試してください。", "error");
      setStep(null);
      setPreview(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 pb-24 bg-gradient-to-b from-orange-50/70 via-[#f6f7f9] to-[#f6f7f9]">
      {showBarcode && (
        <Suspense fallback={null}>
          <BarcodeScanner onClose={() => setShowBarcode(false)} />
        </Suspense>
      )}

      {/* ヘッダー */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[22px] bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 mb-4">
          <ScanSearch size={32} className="text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-[26px] font-black tracking-tight text-slate-900">フリマスキャナー</h1>
        <p className="text-slate-500 text-sm mt-1.5">撮影するだけで相場と利益がわかる</p>
      </div>

      {/* 撮影エリア */}
      <div className={`w-full max-w-sm p-[3px] rounded-[32px] transition-all ${
        loading
          ? "bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500"
          : "bg-gradient-to-br from-orange-300/60 via-slate-200 to-orange-300/60"
      }`}>
        <div
          onClick={() => !loading && inputRef.current?.click()}
          className={`w-full aspect-square rounded-[29px] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
            loading ? "bg-white" : "bg-white hover:bg-orange-50/50 active:scale-[0.99]"
          }`}
        >
          {loading ? (
            <div className="relative w-full h-full">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="w-full h-full object-cover opacity-25" />
              )}
              <div className="absolute inset-0 flex flex-col items-start justify-center gap-5 px-10">
                {STEPS.map(({ key, Icon, label }) => {
                  const currentIdx = STEPS.findIndex((s) => s.key === step);
                  const idx = STEPS.findIndex((s) => s.key === key);
                  const done = idx < currentIdx;
                  const active = key === step;
                  return (
                    <div key={key} className={`flex items-center gap-3.5 transition-opacity ${done || active ? "opacity-100" : "opacity-30"}`}>
                      <span className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        done ? "bg-green-500" : active ? "bg-gradient-to-br from-orange-400 to-orange-600" : "bg-slate-100"
                      }`}>
                        {done
                          ? <Check size={20} className="text-white" strokeWidth={3} />
                          : <Icon size={20} className={active ? "text-white" : "text-slate-400"} />}
                      </span>
                      <span className={`text-sm font-bold ${active ? "text-slate-800" : "text-slate-400"}`}>
                        {label}
                      </span>
                      {active && <Loader2 size={16} className="text-orange-500 animate-spin" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-400">
              <span className="w-20 h-20 rounded-[26px] bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl shadow-orange-500/30 flex items-center justify-center">
                <Camera size={38} className="text-white" strokeWidth={2} />
              </span>
              <div className="text-center">
                <p className="font-bold text-slate-700">タップして撮影</p>
                <p className="text-xs mt-1 text-slate-400">値札も一緒に写すと仕入値も自動入力</p>
              </div>
            </div>
          )}
        </div>
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
      {!loading && (
        <div className="mt-5 flex items-center gap-3 w-full max-w-sm">
          <button
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute("capture");
                inputRef.current.click();
                setTimeout(() => inputRef.current?.setAttribute("capture", "environment"), 500);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm font-bold text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm"
          >
            <Images size={17} />
            ギャラリー
          </button>
          <button
            onClick={() => setShowBarcode(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm font-bold text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm"
          >
            <Barcode size={17} />
            バーコード
          </button>
        </div>
      )}

      {/* 使い方 */}
      {!loading && (
        <div className="mt-10 w-full max-w-sm">
          <div className="bg-white/70 backdrop-blur rounded-3xl border border-slate-200/60 p-5 space-y-4">
            {[
              { Icon: Camera, text: "商品を撮影する" },
              { Icon: Sparkles, text: "AIがブランド・状態を識別" },
              { Icon: JapaneseYen, text: "相場と利益を自動計算" },
            ].map(({ Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3.5 text-slate-600 text-sm font-medium">
                <span className="w-9 h-9 bg-orange-100/80 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={17} />
                </span>
                {text}
                <span className="ml-auto text-xs font-bold text-slate-300">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
