import React, { useState } from "react";
import "./Tabs.css";

export default function Tabs({ tabs = [] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="tabs">
      <div className="tab-list">
        {tabs.map((tab, i) => (
          <button
            key={i}
            className={`tab-btn${active === i ? " active" : ""}`}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-panel">{tabs[active]?.content}</div>
    </div>
  );
}
