"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type ModalType = "set" | "change" | "remove" | null;

export default function SettingsPage() {
  const router = useRouter();
  const { user, hasPin, setPin, changePin, removePin } = useAuth();
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <div className="px-2.5 sm:px-4 pt-3 pb-8" dir="rtl">
      <div className="mb-4">
        <h1 className="font-bold text-lg sm:text-xl mb-1">تنظیمات</h1>
        <p className="text-[11px] text-[var(--muted)]">مدیریت حساب و امنیت</p>
      </div>

      {/* بخش امنیت */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--panel-2)]/50">
          <h2 className="font-bold text-sm flex items-center gap-2">
            🔒 امنیت
          </h2>
        </div>

        <button
          onClick={() => setModal(hasPin ? "change" : "set")}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--panel-2)] transition text-right"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center text-lg shrink-0">
            🔐
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold">کد امن</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">
              {hasPin ? "فعال — برای تغییر کلیک کنید" : "غیرفعال — برای فعال‌سازی کلیک کنید"}
            </div>
          </div>
          {hasPin ? (
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg">فعال</span>
          ) : (
            <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-1 rounded-lg">غیرفعال</span>
          )}
        </button>

        {hasPin && (
          <button
            onClick={() => setModal("remove")}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/5 border-t border-[var(--border)] transition text-right"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-lg shrink-0">
              🗑️
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-red-400">غیرفعال کردن کد امن</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">حذف کد امن فعلی</div>
            </div>
          </button>
        )}
      </section>

      {/* اطلاعات حساب */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--panel-2)]/50">
          <h2 className="font-bold text-sm flex items-center gap-2">
            👤 اطلاعات حساب
          </h2>
        </div>
        <div className="px-4 py-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">نام</span>
            <span className="font-bold">{user?.firstName} {user?.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">موبایل</span>
            <span className="font-mono font-bold" dir="ltr">{user?.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">کد ملی</span>
            <span className="font-mono font-bold" dir="ltr">{user?.nationalId}</span>
          </div>
        </div>
      </section>

      <div className="text-center text-[10px] text-[var(--muted)] opacity-60 mt-6">
        نسخه ۰.۱ · کیف زرگر
      </div>

      {/* Modals */}
      {modal === "set" && <SetPinModal onClose={() => setModal(null)} onSave={setPin} />}
      {modal === "change" && <ChangePinModal onClose={() => setModal(null)} onSave={changePin} />}
      {modal === "remove" && <RemovePinModal onClose={() => setModal(null)} onRemove={removePin} />}
    </div>
  );
}

// ===================== Set PIN =====================
function SetPinModal({ onClose, onSave }: { onClose: () => void; onSave: (pin: string) => Promise<void> }) {
  const [stage, setStage] = useState<"enter" | "confirm">("enter");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function pushDigit(val: string, target: "pin" | "confirm") {
    if (target === "pin" && pin.length < 4) setPin(p => p + val);
    if (target === "confirm" && confirm.length < 4) setConfirm(p => p + val);
    setError("");
  }

  function backspace(target: "pin" | "confirm") {
    if (target === "pin") setPin(p => p.slice(0, -1));
    else setConfirm(p => p.slice(0, -1));
    setError("");
  }

  async function next() {
    if (pin.length !== 4) { setError("کد باید ۴ رقم باشد"); return; }
    setStage("confirm");
  }

  async function save() {
    if (confirm !== pin) { setError("کد تایید با کد اول یکسان نیست"); setConfirm(""); return; }
    setSaving(true);
    try {
      await onSave(pin);
      onClose();
    } catch (e: any) {
      setError(e.message || "خطا در ذخیره");
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="تنظیم کد امن">
      <div className="text-center mb-4">
        <div className="text-[11px] text-[var(--muted)]">
          {stage === "enter" ? "کد امن ۴ رقمی جدید را وارد کنید" : "کد را دوباره وارد کنید"}
        </div>
      </div>

      <Dots value={stage === "enter" ? pin : confirm} />

      {error && <p className="text-[11px] text-red-400 text-center mt-2 mb-2">{error}</p>}

      <Keypad
        onDigit={d => pushDigit(d, stage === "enter" ? "pin" : "confirm")}
        onBackspace={() => backspace(stage === "enter" ? "pin" : "confirm")}
      />

      <button
        onClick={stage === "enter" ? next : save}
        disabled={saving || (stage === "enter" ? pin.length !== 4 : confirm.length !== 4)}
        className="w-full mt-4 h-11 rounded-xl bg-[var(--gold)] text-black font-bold text-sm disabled:opacity-40"
      >
        {saving ? "در حال ذخیره..." : stage === "enter" ? "ادامه" : "ذخیره کد امن"}
      </button>
    </ModalShell>
  );
}

// ===================== Change PIN =====================
function ChangePinModal({ onClose, onSave }: { onClose: () => void; onSave: (o: string, n: string) => Promise<{ success: boolean; error?: string }> }) {
  const [stage, setStage] = useState<"old" | "new" | "confirm">("old");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const currentValue = stage === "old" ? oldPin : stage === "new" ? newPin : confirm;
  const setter = stage === "old" ? setOldPin : stage === "new" ? setNewPin : setConfirm;

  function pushDigit(d: string) {
    if (currentValue.length < 4) setter(currentValue + d);
    setError("");
  }

  function backspace() {
    setter(currentValue.slice(0, -1));
    setError("");
  }

  async function next() {
    if (currentValue.length !== 4) { setError("کد باید ۴ رقم باشد"); return; }
    if (stage === "old") setStage("new");
    else if (stage === "new") {
      if (newPin === oldPin) { setError("کد جدید با قبلی یکسان است"); return; }
      setStage("confirm");
    } else {
      if (confirm !== newPin) { setError("کد تایید مطابقت ندارد"); setConfirm(""); return; }
      setSaving(true);
      const res = await onSave(oldPin, newPin);
      if (res.success) onClose();
      else { setError(res.error || "خطا"); setSaving(false); }
    }
  }

  return (
    <ModalShell onClose={onClose} title="تغییر کد امن">
      <div className="text-center mb-4">
        <div className="text-[11px] text-[var(--muted)]">
          {stage === "old" ? "کد امن فعلی را وارد کنید" : stage === "new" ? "کد جدید را وارد کنید" : "کد جدید را دوباره وارد کنید"}
        </div>
      </div>

      <Dots value={currentValue} />

      {error && <p className="text-[11px] text-red-400 text-center mt-2 mb-2">{error}</p>}

      <Keypad onDigit={pushDigit} onBackspace={backspace} />

      <button
        onClick={next}
        disabled={saving || currentValue.length !== 4}
        className="w-full mt-4 h-11 rounded-xl bg-[var(--gold)] text-black font-bold text-sm disabled:opacity-40"
      >
        {saving ? "..." : stage === "confirm" ? "تغییر کد امن" : "ادامه"}
      </button>
    </ModalShell>
  );
}

// ===================== Remove PIN =====================
function RemovePinModal({ onClose, onRemove }: { onClose: () => void; onRemove: (pin: string) => Promise<{ success: boolean; error?: string }> }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(false);

  async function confirm() {
    if (pin.length !== 4) { setError("کد باید ۴ رقم باشد"); return; }
    setRemoving(true);
    const res = await onRemove(pin);
    if (res.success) onClose();
    else { setError(res.error || "خطا"); setPin(""); setRemoving(false); }
  }

  return (
    <ModalShell onClose={onClose} title="غیرفعال کردن کد امن">
      <div className="text-center mb-4">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center text-xl">⚠️</div>
        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
          بعد از غیرفعال کردن، هر کسی که گوشی شما را باز کند به حساب دسترسی خواهد داشت.
        </p>
      </div>

      <div className="text-center text-[11px] text-[var(--muted)] mb-2">کد امن فعلی را وارد کنید</div>
      <Dots value={pin} />

      {error && <p className="text-[11px] text-red-400 text-center mt-2 mb-2">{error}</p>}

      <Keypad onDigit={d => { if (pin.length < 4) { setPin(pin + d); setError(""); } }} onBackspace={() => { setPin(pin.slice(0, -1)); setError(""); }} />

      <button
        onClick={confirm}
        disabled={removing || pin.length !== 4}
        className="w-full mt-4 h-11 rounded-xl bg-red-500 text-white font-bold text-sm disabled:opacity-40"
      >
        {removing ? "..." : "غیرفعال کن"}
      </button>
    </ModalShell>
  );
}

// ===================== Shared =====================
function ModalShell({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm">{title}</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Dots({ value }: { value: string }) {
  return (
    <div className="flex justify-center gap-2.5 mb-3" dir="ltr">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
            i < value.length
              ? "border-[var(--gold)] bg-[var(--gold)]/10"
              : "border-[var(--border)] bg-[var(--bg)]"
          }`}
        >
          {i < value.length && <span className="w-2.5 h-2.5 rounded-full bg-[var(--gold)]" />}
        </div>
      ))}
    </div>
  );
}

function Keypad({ onDigit, onBackspace }: { onDigit: (d: string) => void; onBackspace: () => void }) {
  return (
    <div dir="ltr" className="grid grid-cols-3 gap-2 mt-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button
          key={n}
          onClick={() => onDigit(String(n))}
          className="aspect-square rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--gold)]/50 hover:bg-[var(--panel-2)] text-lg font-bold text-[var(--text)] transition active:scale-95"
        >
          {n}
        </button>
      ))}
      <div /> {/* فضای خالی سمت چپ */}
      <button
        onClick={() => onDigit("0")}
        className="aspect-square rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--gold)]/50 hover:bg-[var(--panel-2)] text-lg font-bold text-[var(--text)] transition active:scale-95"
      >
        0
      </button>
      <button
        onClick={onBackspace}
        className="aspect-square rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center transition active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
          <line x1="18" y1="9" x2="12" y2="15" />
          <line x1="12" y1="9" x2="18" y2="15" />
        </svg>
      </button>
    </div>
  );
}