import React, { useState } from "react";
import "./Dropdown.css";

export default function Dropdown({ label, options = [], onSelect }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  function handleSelect(option) {
    setSelected(option);
    setOpen(false);
    if (onSelect) onSelect(option);
  }

  return (
    <div className="dropdown">
      <button className="dropdown-toggle" onClick={() => setOpen(!open)}>
        {selected ? selected : label}
        <span className="caret">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="dropdown-menu">
          {options.map((opt, idx) => (
            <li key={idx} onClick={() => handleSelect(opt)}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
