import React from "react";
import "./Progress.css";

export default function Progress({ value }) {
  return (
    <div className="progress">
      <div className="progress-bar" style={{ width: `${value}%` }}></div>
    </div>
  );
}
