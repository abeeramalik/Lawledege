import React from "react";
import "./RadioGroup.css";

export default function RadioGroup({ name, options = [], value, onChange }) {
  return (
    <div className="radio-group">
      {options.map((opt, idx) => (
        <label key={idx} className="radio-option">
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={(e) => onChange(e.target.value)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}
