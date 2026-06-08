// src/Components/ui/AlertDialog.jsx
import React from "react";
import "./AlertDialog.css";

function AlertDialog({ title, message, onClose }) {
  return (
    <div className="alert-overlay">
      <div className="alert-box">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

export default AlertDialog;
