import React from "react";
import "./WhatsAppButton.css";
// Change the import name here to match the file
import { handleOfficialSubmissionFlow } from "../../lib/whatsappSender";

export default function WhatsAppButton({ complaint }) {
  return (
    <button
      className="wa-btn"

      onClick={() => {
        // Guard check: Ensure button only works if a complaint exists
        if (complaint) {
          handleOfficialSubmissionFlow(complaint);
        } else {
          alert("No complaint data found to share.");
        }
      }}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className="whatsapp-icon"
      >
        <path
          fill="#ffffff"
          d="M12.04 2C6.49 2 2 6.47 2 12.01c0 1.88.52 3.64 1.42 5.15L2 22l4.99-1.4c1.48.84 3.2 1.32 5.05 1.32 5.55 0 10.04-4.49 10.04-10.05C22.08 6.47 17.59 2 12.04 2Zm5.78 13.43c-.2.6-1.17 1.16-1.62 1.22-.41.06-.93.09-1.5-.07-.35-.1-.8-.25-1.36-.53-2.52-1.2-4.16-3.86-4.26-4.03-.1-.17-1.01-1.32-1.01-2.52 0-1.2.62-1.78.84-2.02.23-.23.5-.31.66-.31h.36c.12 0 .29-.04.44.33.18.42.59 1.4.64 1.5.06.1.1.24.02.41-.08.17-.12.28-.24.42-.12.14-.26.31-.36.42-.12.12-.24.25-.11.47.13.22.57.95 1.23 1.53.85.75 1.57.99 1.81 1.1.22.1.36.08.49-.07.16-.18.6-.7.76-.94.16-.23.31-.2.52-.12.21.08 1.33.62 1.56.74.23.12.38.18.44.28.06.1.06.6-.14 1.2Z"
        />
      </svg>
      Generate PDF & Send
    </button>
  );
}