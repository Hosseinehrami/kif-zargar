"use client";

import { useEffect, useState } from "react";

// ============ تنظیم زمان‌ها (میلی‌ثانیه) ============
// اگر می‌خواهی طولانی‌تر یا کوتاه‌تر شود، فقط این ۳ عدد را عوض کن
const BREAKOUT_AT = 2500;   // لحظه شکستن سقف
const FADE_START  = 3300;   // شروع محو شدن
const UNMOUNT_AT  = 4000;   // حذف کامل از DOM
// ====================================================

// کندل‌های قرمز (نزولی) — از بالا می‌ریزند
const RED_CANDLES = [
  { x: 15,  openY: 35, closeY: 45, highY: 30, lowY: 50, delay: 400 },
  { x: 35,  openY: 42, closeY: 54, highY: 37, lowY: 60, delay: 520 },
  { x: 55,  openY: 52, closeY: 62, highY: 47, lowY: 68, delay: 640 },
  { x: 75,  openY: 60, closeY: 72, highY: 55, lowY: 78, delay: 760 },
];

// کندل‌های سبز (صعودی) — از پایین شوت می‌کنند
const GREEN_CANDLES = [
  { x: 95,  openY: 70, closeY: 58, highY: 52, lowY: 75, delay: 1100 },
  { x: 115, openY: 58, closeY: 44, highY: 38, lowY: 63, delay: 1280 },
  { x: 135, openY: 44, closeY: 28, highY: 22, lowY: 50, delay: 1460 },
  { x: 155, openY: 28, closeY: 12, highY: 6,  lowY: 34, delay: 1640 },
];

// ذرات پس‌زمینه
const PARTICLES = [
  { left: 8,  top: 15, size: 2,   delay: 0,   duration: 4   },
  { left: 22, top: 60, size: 1,   delay: 0.5, duration: 5   },
  { left: 35, top: 25, size: 2.5, delay: 1.2, duration: 4.5 },
  { left: 48, top: 75, size: 1.5, delay: 0.8, duration: 5.5 },
  { left: 62, top: 35, size: 2,   delay: 0.3, duration: 4   },
  { left: 75, top: 65, size: 1,   delay: 1.5, duration: 6   },
  { left: 88, top: 20, size: 2.5, delay: 0.7, duration: 4.8 },
  { left: 15, top: 85, size: 1.5, delay: 1.3, duration: 5.2 },
  { left: 92, top: 50, size: 2,   delay: 1.1, duration: 4.2 },
  { left: 55, top: 12, size: 1,   delay: 0.2, duration: 5.8 },
];

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"in" | "breakout" | "out">("in");

  useEffect(() => {
    let shouldShow = false;
    try {
      if (!sessionStorage.getItem("kif-splash-shown")) {
        shouldShow = true;
      }
    } catch {
      shouldShow = true;
    }

    if (!shouldShow) return;

    setVisible(true);

    const t1 = setTimeout(() => setPhase("breakout"), BREAKOUT_AT);
    const t2 = setTimeout(() => setPhase("out"), FADE_START);
    const t3 = setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem("kif-splash-shown", "1"); } catch {}
    }, UNMOUNT_AT);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!visible) return null;

  const isBreakout = phase === "breakout" || phase === "out";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#08080a] overflow-hidden transition-opacity duration-500 ${
        phase === "out" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* هاله طلایی */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-[#c4a875] opacity-[0.08] blur-[110px]" />
      </div>

      {/* ذرات */}
      <div className="absolute inset-0 pointer-events-none">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#c4a875]"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              opacity: 0.35,
              animation: `floatParticle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* محتوا */}
      <div className="relative flex flex-col items-center px-4">
        {/* لوگو */}
        <div style={{ animation: "scaleIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
          <div className="relative w-20 h-20 rounded-3xl border-2 border-[#c4a875]/40 bg-gradient-to-br from-[#c4a875]/25 to-[#c4a875]/5 flex items-center justify-center text-3xl font-black text-[#c4a875] shadow-2xl shadow-[#c4a875]/25 overflow-hidden">
            ک
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              style={{ animation: "shimmer 2.5s ease-in-out infinite", animationDelay: "0.6s" }}
            />
          </div>
        </div>

        {/* برند */}
        <div
          className="mt-5 text-xl font-black text-[#c4a875] font-serif italic tracking-[0.2em]"
          style={{ animation: "slideUp 0.6s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          KIFE ZARGAR
        </div>
        <div
          className="text-[10px] text-gray-500 mt-1 tracking-[0.3em]"
          style={{ animation: "slideUp 0.6s 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          پلتفرم هوشمند طلا
        </div>

        {/* نمودار */}
        <div className="mt-8" style={{ animation: "fadeIn 0.5s 0.4s both" }}>
          <svg viewBox="0 0 180 90" className="w-[200px] h-[100px] overflow-visible">
            {/* خط سقف */}
            <line
              x1="5" y1="15" x2="175" y2="15"
              stroke={isBreakout ? "#10b981" : "#3a3a3a"}
              strokeWidth="1"
              strokeDasharray="4 3"
              style={{
                animation: "drawCeiling 0.6s 0.3s ease-out both",
                transition: "stroke 0.3s ease",
              }}
            />

            {/* کندل‌های قرمز */}
            {RED_CANDLES.map((c, i) => (
              <g
                key={`r${i}`}
                style={{
                  animation: `fallIn 0.45s ${c.delay}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                  willChange: "transform, opacity",
                }}
              >
                <line x1={c.x} x2={c.x} y1={c.highY} y2={c.lowY} stroke="#dc5959" strokeWidth="1" />
                <rect
                  x={c.x - 4}
                  y={Math.min(c.openY, c.closeY)}
                  width="8"
                  height={Math.abs(c.closeY - c.openY)}
                  fill="#dc5959"
                  rx="1"
                />
              </g>
            ))}

            {/* کندل‌های سبز */}
            {GREEN_CANDLES.map((c, i) => (
              <g
                key={`g${i}`}
                style={{
                  animation: `riseIn 0.5s ${c.delay}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                  willChange: "transform, opacity",
                }}
              >
                <line x1={c.x} x2={c.x} y1={c.highY} y2={c.lowY} stroke="#239b72" strokeWidth="1" />
                <rect
                  x={c.x - 4}
                  y={Math.min(c.openY, c.closeY)}
                  width="8"
                  height={Math.abs(c.closeY - c.openY)}
                  fill="#239b72"
                  rx="1"
                />
              </g>
            ))}

            {/* جرقه شکست */}
            {isBreakout && (
              <g style={{ transformOrigin: "155px 15px" }}>
                <circle cx="155" cy="15" r="5" fill="#10b981" style={{ animation: "burst 1s ease-out both" }} />
                <circle
                  cx="155" cy="15" r="5" fill="none" stroke="#10b981" strokeWidth="1.5"
                  style={{ animation: "ring 1.2s ease-out both" }}
                />
              </g>
            )}
          </svg>
        </div>

        {/* درصد */}
        <div className="h-6 mt-1 flex items-center justify-center">
          {isBreakout && (
            <div
              className="text-sm font-black text-emerald-400 flex items-center gap-1"
              style={{ animation: "fadeUp 0.5s ease-out both" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              +۱۲.۴٪
            </div>
          )}
        </div>

        {/* نوار پیشرفت */}
        <div
          className="mt-4 w-44 h-[2px] rounded-full bg-white/[0.06] overflow-hidden"
          style={{ animation: "fadeIn 0.5s 0.5s both" }}
        >
          <div
            className={`h-full rounded-full transition-colors duration-500 ${
              isBreakout
                ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                : "bg-gradient-to-r from-[#c4a875] via-[#e0c896] to-[#c4a875] shadow-[0_0_8px_rgba(196,168,117,0.6)]"
            }`}
            style={{
              animation: `progressFill ${FADE_START}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            }}
          />
        </div>

        {/* متن */}
        <div
          className="mt-3 text-[10px] text-gray-500 flex items-center gap-1.5"
          style={{ animation: "fadeIn 0.5s 0.6s both" }}
        >
          {isBreakout ? (
            <span className="text-emerald-400">✓ آماده</span>
          ) : (
            <>
              در حال آماده‌سازی
              <span className="inline-flex gap-1">
                <span className="w-1 h-1 rounded-full bg-[#c4a875]" style={{ animation: "dotPulse 1s infinite" }} />
                <span className="w-1 h-1 rounded-full bg-[#c4a875]" style={{ animation: "dotPulse 1s 0.15s infinite" }} />
                <span className="w-1 h-1 rounded-full bg-[#c4a875]" style={{ animation: "dotPulse 1s 0.3s infinite" }} />
              </span>
            </>
          )}
        </div>
      </div>

      {/* انیمیشن‌ها */}
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.35; }
          50% { transform: translateY(-20px) translateX(6px); opacity: 0.65; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.3); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          0% { transform: translateY(14px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeUp {
          0% { transform: translateY(6px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes drawCeiling {
          0% { stroke-dashoffset: 200; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes fallIn {
          0% { transform: translateY(-90px); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes riseIn {
          0% { transform: translateY(90px); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes burst {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(6); opacity: 0; }
        }
        @keyframes progressFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes dotPulse {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}