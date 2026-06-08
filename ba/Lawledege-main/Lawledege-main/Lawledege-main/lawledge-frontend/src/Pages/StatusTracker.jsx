import { useState } from "react";
import { supabase } from "../api/supabaseClient";
import Input from "../Components/ui/Input.jsx";
import Button from "../Components/ui/Button.jsx";
import "./StatusTracker.css";
import Progress from "../Components/ui/Progress.jsx";
import Alert from "../Components/ui/Alert.jsx";
import Toast from "../Components/ui/Toast.jsx";

export default function StatusTracker() {
  const [trackingCode, setTrackingCode] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [toast, setToast] = useState(null);

  async function handleSearch() {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("tracking_code", trackingCode)
      .single();

    if (error) {
      setToast({ type: "error", message: "Complaint not found" });
      setComplaint(null);
    } else {
      setComplaint(data);
      setToast({ type: "success", message: "Complaint found" });
    }
  }

  const stages = ["Pending", "Approved", "Questions", "PDF Generated", "Sent"];

  function getProgressValue(status) {
    const index = stages.indexOf(status);
    return index >= 0 ? (index / (stages.length - 1)) * 100 : 0;
  }

  return (
    <div className="card">
      <h2>Check Complaint Status</h2>
      <div className="search-bar">
        <Input
          placeholder="Enter Tracking Code"
          value={trackingCode}
          onChange={e => setTrackingCode(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {complaint && (
        <div className="complaint-details">
          <p><strong>Complaint:</strong> {complaint.complaint_text}</p>
          <p><strong>Status:</strong> {complaint.status}</p>
          <Progress value={getProgressValue(complaint.status)} />
          <Alert type="info" message={`Complaint is currently ${complaint.status}`} />
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
