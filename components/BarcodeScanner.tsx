"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface Props {
  onClose: () => void;
}

export default function BarcodeScanner({ onClose }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"scanning" | "found" | "analyzing">("scanning");
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    let stopped = false;

    reader.decodeFromVideoDevice(undefined, videoRef.current!, async (result, _err) => {
      if (!result || stopped) return;
      stopped = true;
      setStatus("found");

      const code = result.getText();
      setStatus("analyzing");

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: code }),
        });
        if (!res.ok) throw new Error();
        const aiResult = await res.json();
        sessionStorage.setItem("aiResult", JSON.stringify(aiResult));
        sessionStorage.removeItem("imageUrl");
        router.push("/result");
      } catch {
        alert("商品情報の取得に失敗しました");
        stopped = false;
        setStatus("scanning");
      }
    });

    return () => {
      stopped = true;
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <span className="text-white font-medium">バーコードをスキャン</span>
        <button onClick={onClose} className="text-white text-2xl leading-none">✕</button>
      </div>

      <div className="relative flex-1">
        <video ref={videoRef} className="w-full h-full object-cover" />
        {/* scanning frame */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-72 h-24 border-2 border-orange-400 rounded-xl relative">
            <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-orange-400 rounded-tl" />
            <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-orange-400 rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-orange-400 rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-orange-400 rounded-br" />
          </div>
        </div>
      </div>

      <div className="bg-black/80 px-4 py-4 text-center">
        {status === "scanning" && (
          <p className="text-slate-300 text-sm">バーコードを枠内に合わせてください</p>
        )}
        {status === "found" && (
          <p className="text-orange-400 text-sm font-medium">バーコードを検出しました</p>
        )}
        {status === "analyzing" && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-orange-400 text-sm">AI解析中...</p>
          </div>
        )}
      </div>
    </div>
  );
}
