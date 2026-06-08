import React from "react";
import "./Button.css";

export default function Button({ children, onClick, type = "button", className = "", variant = "primary", disabled = false, ...props }) {
  const variantClass =
    variant === "outline"   ? "btn-outline" :
    variant === "secondary"? "btn-secondary" :
    variant === "reject"   ? "btn-reject" :
    variant === "approve"  ? "btn-approve" :
    "btn-primary";

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
