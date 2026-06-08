import React, { useEffect } from "react";
import "./Toast.css";

export default function Toast({ message, type = "info", duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelector(".toast")?.remove();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return <div className={`toast ${type}`}>{message}</div>;
}
