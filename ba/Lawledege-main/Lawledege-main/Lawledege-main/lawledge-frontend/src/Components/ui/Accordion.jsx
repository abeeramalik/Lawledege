import React, { useState } from "react";
import "./Accordion.css";

export default function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`accordion${open ? " open" : ""}`}>
      <button className="accordion-trigger" onClick={() => setOpen(!open)}>
        {title}
        <span className="accordion-icon">▼</span>
      </button>
      <div className="accordion-content">{children}</div>
    </div>
  );
}
