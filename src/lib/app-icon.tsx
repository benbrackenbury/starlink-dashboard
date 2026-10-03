import { ImageResponse } from "next/og";

export const ICON_BG = "#141414";
export const ICON_FG = "#f6f6f6";

export function appIconResponse(size: number) {
  const dot = Math.round(size * 0.28);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ICON_BG,
        }}
      >
        <div
          style={{
            width: dot,
            height: dot,
            borderRadius: 9999,
            background: ICON_FG,
          }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
