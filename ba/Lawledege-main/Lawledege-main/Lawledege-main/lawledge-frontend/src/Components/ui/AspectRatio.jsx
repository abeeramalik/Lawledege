import React from "react";
import "./AspectRatio.css";

export default function AspectRatio({ ratio = "16:9", children }) {
  // ratio is like "16:9" or "4:3"
  const [w, h] = ratio.split(":").map(Number);
  const paddingTop = (h / w) * 100 + "%";

  return (
    <div className="aspect-ratio" style={{ paddingTop }}>
      <div className="aspect-ratio-content">{children}</div>
    </div>
  );
}
