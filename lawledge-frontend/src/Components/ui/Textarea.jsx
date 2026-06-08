import React from "react";
import "./Textarea.css";

export default function Textarea({ placeholder, value, onChange }) {
  return (
    <textarea
      className="textarea"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}
