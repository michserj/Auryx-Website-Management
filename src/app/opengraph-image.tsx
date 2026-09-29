import { ImageResponse } from "next/og";

export const alt = "Auryx Software, The Silent Force Behind Smarter Software";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #081b30 0%, #0e2c4b 60%, #174a7e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#EEAD2B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700 }}>Auryx</div>
            <div style={{ fontSize: 20, letterSpacing: 6, color: "#b4cdea" }}>SOFTWARE</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>The Silent Force Behind Smarter Software.</div>
          <div style={{ fontSize: 28, color: "#d9e6f5" }}>
            Maritime School Systems · Process Automation · Custom Software · IT Consultation
          </div>
        </div>
      </div>
    ),
    size,
  );
}
