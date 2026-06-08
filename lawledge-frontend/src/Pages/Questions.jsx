import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";
import Dropdown from "../Components/ui/Dropdown.jsx";
import "./Questions.css";
import Button from "../Components/ui/Button.jsx";
import Toast from "../Components/ui/Toast.jsx";
import { saveComplaintPDF } from "../lib/pdfGenerator";   // ✅ use saveComplaintPDF
import WhatsAppButton from "../Components/ui/WhatsAppButton.jsx"; // ✅ add WhatsAppButton
import { useSearchParams } from "react-router-dom";

export default function Questions() {
  const [searchParams] = useSearchParams();
  const complaintId = searchParams.get("complaintId");
  const [complaint, setComplaint] = useState(null);
  const [answers, setAnswers] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (complaintId) {
      supabase.from("complaints").select("*").eq("id", complaintId).single()
        .then(({ data, error }) => {
          if (error) setToast({ type: "error", message: "Complaint not found" });
          else setComplaint(data);
        });
    }
  }, [complaintId]);

  async function handleSubmit() {
    if (!complaintId) return;

    const { error } = await supabase.from("complaints").update({
      authority: answers.authority,
      law_section: answers.law_section,
      status: "Questions"
    }).eq("id", complaintId);

    if (error) {
      setToast({ type: "error", message: "Failed to save answers" });
    } else {
      setToast({ type: "success", message: "Answers saved. PDF ready." });

      // Generate and save PDF
      await saveComplaintPDF({
        ...complaint,
        authority: answers.authority,
        law_section: answers.law_section,
        status: "PDF Generated"
      }, answers.authority, answers.law_section);
    }
  }

  return (
    <div className="card">
      <h2>Complaint Mapping Questions</h2>
      <p>Please answer the following questions to map your complaint to the appropriate authority and law section.</p>
      {complaint && (
        <div className="question-info">
          <p><strong>Complaint:</strong> {complaint.complaint_text}</p>
        </div>
      )}

      <Dropdown
        label="Which authority should handle this complaint?"
        options={["Police", "Utilities Department", "Court"]}
        onSelect={val => setAnswers({ ...answers, authority: val })}
      />

      <Dropdown
        label="Which law section applies?"
        options={["Section 144", "Section 302", "Section 498A"]}
        onSelect={val => setAnswers({ ...answers, law_section: val })}
      />

      <div className="actions">
        <Button onClick={handleSubmit}>Submit Answers</Button>

        {/*  Show WhatsApp icon button once complaint exists */}
        {complaint && <WhatsAppButton complaint={complaint} />}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
