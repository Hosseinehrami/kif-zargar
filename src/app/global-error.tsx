"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body style={{ margin: 0, background: "#17191c", color: "#eeece7" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "Tahoma, Arial, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "420px" }}>
            {/* آیکون */}
            <div
              style={{
                width: "80px",
                height: "80px",
                margin: "0 auto 20px",
                borderRadius: "50%",
                background: "rgba(220, 89, 89, 0.15)",
                border: "2px solid rgba(220, 89, 89, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc5959"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>

            {/* متن */}
            <h1
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              خطای بحرانی
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: "#92969c",
                lineHeight: 1.8,
                marginBottom: "24px",
              }}
            >
              متأسفانه یک خطای غیرمنتظره رخ داد. لطفاً صفحه را دوباره بارگذاری
              کنید.
            </p>

            {/* دکمه */}
            <button
              onClick={reset}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "12px",
                background: "#c4a875",
                color: "#17191c",
                border: "none",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              تلاش مجدد
            </button>

            {/* برند */}
            <div
              style={{
                marginTop: "32px",
                fontSize: "14px",
                fontWeight: "900",
                color: "#c4a875",
                fontStyle: "italic",
                letterSpacing: "0.15em",
              }}
            >
              KIFE ZARGAR
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#92969c",
                marginTop: "4px",
              }}
            >
              کیف زرگر · مدیریت هوشمند دارایی طلا
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}