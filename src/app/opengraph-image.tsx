import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Tomame - Event Voting & Award Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a0f2e 0%, #2d1b4e 50%, #1a0f2e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(234, 179, 8, 0.1) 0%, transparent 50%)",
          }}
        />

        {/* Logo/Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px rgba(234, 179, 8, 0.3)",
            }}
          >
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a0f2e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #ffffff 0%, #e9d5ff 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Tomame
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: "36px",
            color: "#e9d5ff",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
            zIndex: 1,
          }}
        >
          Event Voting & Award Platform
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: "24px",
            color: "#a855f7",
            textAlign: "center",
            maxWidth: "700px",
            marginTop: "20px",
            zIndex: 1,
          }}
        >
          Create events, manage nominations, engage your audience
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
