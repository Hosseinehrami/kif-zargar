"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type Props = {
  onChange: (dataUrl: string | null) => void;
  height?: number;
};

export default function SignaturePad({ onChange, height = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // تنظیم اندازه‌ی canvas با devicePixelRatio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#c4a875"; // رنگ طلایی
    ctx.lineWidth = 2.2;
  }, []);

  // گرفتن مختصات نسبت به canvas
  const getPos = (
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width) / dpr,
      y: (clientY - rect.top) * (canvas.height / rect.height) / dpr,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    if (!pos) return;

    setIsDrawing(true);
    setHasContent(true);
    lastPos.current = pos;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1); // نقطه
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    if (!pos || !lastPos.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
  };

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // خروجی dataURL برای ذخیره
    try {
      const dataUrl = canvas.toDataURL("image/png");
      onChange(dataUrl);
    } catch {
      onChange(null);
    }
  }, [isDrawing, onChange]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onChange(null);
  };

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-[var(--gold)]/40 bg-[var(--bg)]/50 overflow-hidden">
        {/* خط راهنما */}
        {!hasContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <div className="text-2xl mb-1 opacity-40">✍️</div>
            <div className="text-[10.5px] text-[var(--muted)]">
              امضای خود را اینجا بکشید
            </div>
            <div className="text-[8.5px] text-[var(--muted)] mt-0.5 opacity-70">
              با انگشت یا ماوس
            </div>
          </div>
        )}

        {/* خط پایه */}
        <div className="absolute bottom-6 left-6 right-6 h-px bg-[var(--border)] pointer-events-none" />

        <canvas
          ref={canvasRef}
          style={{ width: "100%", height }}
          className="touch-none cursor-crosshair block"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          onTouchCancel={endDraw}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[9px] text-[var(--muted)]">
          {hasContent ? "✓ امضا ثبت شد" : "امضا الزامی است"}
        </span>
        <button
          type="button"
          onClick={clear}
          disabled={!hasContent}
          className="text-[10px] font-bold text-red-400 hover:text-red-300 disabled:opacity-30 transition"
        >
          پاک کردن
        </button>
      </div>
    </div>
  );
}