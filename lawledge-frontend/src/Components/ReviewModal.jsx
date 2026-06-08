
import React from "react";
import Button from "./ui/Button.jsx";

// Standard Supabase URL Construction (replace with your actual project URL)
const PROJECT_URL = "https://ytyydnetlsrldnnkvfxa.supabase.co"; 


export default function ReviewModal({ complaint, onClose, onApprove, onPurge, onMarkResolved }) {

  if (!complaint) return null;

  // Construct the correct public URL for the image
  const evidenceUrl = `${PROJECT_URL}/storage/v1/object/public/evidence/${complaint.evidence_url}`;

  return (
    <div className="modal-overlay">
      <div className="review-modal">
        <div className="modal-header">
          <h2>Review Complaint: {complaint.tracking_code}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="meta-info">
            <p><strong>Complainant:</strong> {complaint.complainant_name}</p>
            <p><strong>Phone:</strong> {complaint.complainant_phone}</p>
            <p><strong>Category:</strong> {complaint.category}</p>
          </div>
          
          <div className="complaint-text">
            <strong>Description:</strong>
            <p>{complaint.complaint_text}</p>
          </div>

          <div className="evidence-preview">
            <strong>Evidence:</strong>
            {/* If the image fails to load, Supabase RLS is the likely cause */}
            <img 
              src={evidenceUrl} 
              alt="Evidence File" 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "https://via.placeholder.com/400x300?text=Image+Load+Failed";
              }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <Button onClick={onClose} variant="outline">Close</Button>
          {/* Button to approve the complaint */}
          <Button onClick={() => onApprove(complaint.id)} variant="primary">
            Approve & Forward
          </Button>
          {/* Button to permanently delete row + file */}
          <Button
            variant="reject"
            onClick={() => onPurge(complaint.id, complaint.evidence_url)}
          >
            Reject & Delete Permanently
          </Button>
        </div>
      </div>
    </div>
  );
}
