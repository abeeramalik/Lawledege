import React from "react";
import "./Input.css";

export default function Input({ type = "text", placeholder, value, onChange }) {
  return (
    <input
      type={type}
      className="input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}
