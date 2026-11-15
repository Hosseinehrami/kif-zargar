"use client";

import { generateQRPattern } from "@/lib/physical";
import { format, toFa } from "@/lib/format";

export type PhysicalReceiptData = {
  trackingCode: string;
  pickupCode: string;
  serialNumber?: string;
  dateTime: string;
  assetLabel: string;
  amount: number;
  unit: string;
  deliveryMethod: "branch" | "agency" | "courier";
  locationName?: string;
  locationAddress?: string;
  locationPhone?: string;
  courierAddress?: string;
  totalAssetDeducted: number;
  totalCashFee: number;
  receiptHash: string;
  verificationCode: string;
  note: string;
  registeredOwnership: boolean;
};

type Props = {
  data: PhysicalReceiptData;
  buyerName: string;
  buyerNationalId?: string;
};

export default function PhysicalReceipt({ data, buyerName, buyerNationalId }: Props) {
  const isGram = data.unit === "گرم";

  return (
    <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-[var(--panel)] overflow-hidden relative">
      {/* واترمارک */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.025]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-serif italic font-black whitespace-nowrap -rotate-[25deg] text-[var(--gold)]" style={{ fontSize: 48, letterSpacing: "0.15em" }}>
            KIFE ZARGAR
          </div>
        </div>
      </div>

      {/* هدر با QR */}
      <div className="relative bg-gradient-to-l from-[var(--gold)]/20 to-[var(--gold)]/5 border-b-2 border-[var(--gold)]/40 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-black text-[var(--gold)]">رسید رسمی برداشت فیزیکی</div>
            <div className="text-[8px] text-[var(--muted)] mt-0.5">کیف زرگر · KIFE ZARGAR</div>
            <div className="mt-2 space-y-0.5 text-[9px]">
              <div className="flex items-center gap-1">
                <span className="text-[var(--muted)]">شماره:</span>
                <span className="font-mono font-bold text-[var(--text)]" dir="ltr">{data.trackingCode}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[var(--muted)]">تاریخ:</span>
                <span className="font-mono text-[var(--text)]">{data.dateTime}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-center">
            <div className="bg-white p-1 rounded inline-block">
              <svg width="56" height="56" viewBox="0 0 21 21" shapeRendering="crispEdges">
                {generateQRPattern(data.receiptHash).map((row, y) =>
                  row.map((filled, x) =>
                    filled ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" /> : null
                  )
                )}
              </svg>
            </div>
            <div className="text-[7px] text-[var(--muted)] mt-1">اسکن برای استعلام</div>
          </div>
        </div>
      </div>

      {/* دریافت‌کننده */}
      <div className="relative p-3 border-b border-[var(--border)] bg-[var(--panel-2)]/20">
        <div className="text-[7.5px] font-bold text-[var(--gold)] uppercase tracking-wider mb-1">دریافت‌کننده</div>
        <div className="text-[11px] font-bold">{buyerName || "کاربر کیف زرگر"}</div>
        <div className="text-[9px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">{buyerNationalId || "—"}</div>
      </div>

      {/* مقدار اصلی */}
      <div className="relative p-4 text-center border-b border-[var(--border)] bg-[var(--gold)]/5">
        <div className="text-[9px] text-[var(--muted)] mb-1">{data.assetLabel}</div>
        <div className="text-3xl font-black text-[var(--gold)] font-mono">
          {toFa(data.amount.toFixed(isGram ? 4 : 0))}
          <span className="text-sm font-normal text-[var(--muted)] mr-1 font-sans">{data.unit}</span>
        </div>
      </div>

      {/* جزئیات */}
      <div className="relative p-3 space-y-1.5 text-[10px] border-b border-[var(--border)]">
        {data.locationName && (
          <div className="flex justify-between items-start">
            <span className="text-[var(--muted)]">مکان</span>
            <div className="text-left">
              <div className="font-bold">{data.locationName}</div>
              <div className="text-[9px] text-[var(--muted)] mt-0.5">{data.locationAddress}</div>
              {data.locationPhone && <div className="text-[9px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">{data.locationPhone}</div>}
            </div>
          </div>
        )}

        {data.courierAddress && (
          <div className="flex justify-between items-start">
            <span className="text-[var(--muted)]">آدرس</span>
            <div className="text-left text-[9px] leading-relaxed max-w-[65%]">{data.courierAddress}</div>
          </div>
        )}

        {data.serialNumber && (
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">شماره سریال</span>
            <span className="font-mono font-bold text-sky-400 text-[9.5px]" dir="ltr">{data.serialNumber}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-[var(--muted)]">ثبت مالکیت</span>
          <span className={data.registeredOwnership ? "text-[var(--green)] font-bold" : "text-[var(--muted)]"}>
            {data.registeredOwnership ? "✓ ثبت شده" : "— ثبت نشده"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-[var(--muted)]">کسر از موجودی</span>
          <span className="font-bold text-[var(--gold)] font-mono">
            {toFa(data.totalAssetDeducted.toFixed(isGram ? 3 : 0))} {data.unit}
          </span>
        </div>

        {data.totalCashFee > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">هزینه نقدی</span>
            <span className="text-amber-400 font-mono">{format(data.totalCashFee)} تومان</span>
          </div>
        )}

        <div className="pt-1.5 border-t border-[var(--border)]">
          <div className="text-[var(--muted)] mb-0.5">توضیحات:</div>
          <div className="bg-[var(--panel-2)] rounded p-1.5 text-[9.5px] leading-relaxed">{data.note}</div>
        </div>
      </div>

      {/* استعلام */}
      <div className="relative p-3 bg-[var(--panel-2)] border-t-2 border-[var(--gold)]/30">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs">🔍</span>
          <span className="text-[10px] font-bold text-[var(--gold)]">قابل استعلام</span>
        </div>
        <div className="space-y-1.5">
          <div>
            <div className="text-[8.5px] text-[var(--muted)] mb-0.5">کد استعلام</div>
            <div className="font-mono text-[11px] font-black text-[var(--gold)] tracking-wider bg-[var(--bg)] border border-[var(--gold)]/30 rounded px-2 py-1 text-center" dir="ltr">
              {data.verificationCode}
            </div>
          </div>
          <div>
            <div className="text-[8.5px] text-[var(--muted)] mb-0.5">لینک استعلام</div>
            <div className="text-[9px] font-mono text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 truncate" dir="ltr">
              kifzargar.com/verify/{data.trackingCode}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-1">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[var(--green)]" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[7.5px] font-bold text-[var(--green)]">امضای دیجیتال</span>
          </div>
          <span className="text-[8px] text-[var(--muted)] font-mono" dir="ltr">
            {data.receiptHash.slice(0, 16)}…
          </span>
        </div>
      </div>

      {/* مهر */}
      <div className="relative border-t-2 border-dashed border-[var(--gold)]/30 bg-gradient-to-b from-transparent to-[var(--gold)]/5 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 text-[8px] text-[var(--muted)] leading-relaxed">
            ⚠️ هرگونه تغییر در این رسید، با اسکن QR یا استعلام کد قابل تشخیص است.
          </div>
          <div className="shrink-0 w-20 h-14 rounded border border-dashed border-[var(--gold)]/30 flex flex-col items-center justify-center bg-[var(--bg)]/30">
            <div className="text-[7px] font-black text-[var(--gold)]/50 leading-tight">KIFE ZARGAR</div>
            <div className="text-[6px] text-[var(--gold)]/40 mt-0.5">مهر رسمی</div>
          </div>
        </div>
      </div>
    </div>
  );
}