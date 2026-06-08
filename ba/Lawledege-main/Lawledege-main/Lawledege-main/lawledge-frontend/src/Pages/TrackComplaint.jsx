import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import emailjs from '@emailjs/browser';
import "./TrackComplaint.css";
import Toast from "../Components/ui/Toast.jsx";

export default function TrackComplaint() {
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) { setTrackingCode(code); handleSearch(code); }
  }, [searchParams]);

  async function handleSearch(codeValue) {
    const code = codeValue ?? trackingCode;
    if (!code.trim()) { setToast({ type: "error", message: "Please enter a tracking code" }); return; }
    const { data, error } = await supabase.from("complaints").select("*").eq("tracking_code", code);
    if (error) { setToast({ type: "error", message: "Error searching complaints" }); setComplaint(null); }
    else if (data && data.length > 0) { setComplaint(data[0]); setToast({ type: "success", message: "Complaint found!" }); }
    else { setToast({ type: "error", message: "Complaint not found. Check your tracking code." }); setComplaint(null); }
  }

  const stages = ["Pending", "Approved", "Sent", "Resolved"];
  function getProgressValue(status) {
    const index = stages.indexOf(status);
    return index >= 0 ? (index / (stages.length - 1)) * 100 : 0;
  }
  function getStageClass(stage, currentStatus) {
    const currentIdx = stages.indexOf(currentStatus);
    const stageIdx = stages.indexOf(stage);
    if (stageIdx < currentIdx) return "done";
    if (stageIdx === currentIdx) return "active";
    return "";
  }

  async function handleMarkResolved() {
    if (!complaint || !complaint.id) return;
    try {
      const { error } = await supabase.from("complaints").update({ status: "resolved" }).eq("id", complaint.id);
      if (error) throw error;
      setComplaint({ ...complaint, status: "resolved" });
      setToast({ type: "success", message: "Status updated to Resolved." });
    } catch (error) {
      setToast({ type: "error", message: "Failed to update status." });
    }
  }

  return (
    <div className="track-page-wrapper">
      <h1 className="track-page-heading">🔍 Track Your Complaint</h1>
      <p className="track-page-sub">Enter your reference code to see the current status of your complaint.</p>

      {/* Big centered search box */}
      <div className="track-search-zone">
        <input
          type="text"
          placeholder="Enter Reference Code (e.g. CMP-XXXXXXXX)"
          value={trackingCode}
          onChange={e => setTrackingCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch(trackingCode)}
        />
        <button className="track-search-btn" onClick={() => handleSearch(trackingCode)}>Search</button>
      </div>

      {/* Result */}
      {complaint && (
        <div className="track-result-card">
          <div className="track-result-header">
            <h3>Complaint Details</h3>
            <span className="tracking-code-badge">{complaint.tracking_code}</span>
          </div>
          <div className="track-result-body">
            <div className="track-detail-grid">
              <div className="track-detail-item">
                <label>Complainant</label>
                <p>{complaint.complainant_name || "Anonymous"}</p>
              </div>
              <div className="track-detail-item">
                <label>Category</label>
                <p>{complaint.category || "—"}</p>
              </div>
              <div className="track-detail-item">
                <label>Location</label>
                <p>{complaint.location || "—"}</p>
              </div>
              <div className="track-detail-item">
                <label>Severity</label>
                <p>{complaint.severity || "Medium"}</p>
              </div>
              <div className="track-detail-item" style={{gridColumn:'1/-1'}}>
                <label>Description</label>
                <p style={{fontSize:'1rem', fontWeight:600, color:'#4b5563'}}>{complaint.complaint_text}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="track-progress-wrap">
              <div className="track-progress-label">
                <span>Progress</span>
                <strong>{complaint.status || "Pending"}</strong>
              </div>
              <div className="track-progress-bar">
                <div className="track-progress-fill" style={{ width: `${getProgressValue(complaint.status)}%` }} />
              </div>
              <div className="track-stages">
                {stages.map(stage => (
                  <span key={stage} className={`stage-pill ${getStageClass(stage, complaint.status)}`}>{stage}</span>
                ))}
              </div>
            </div>

            {complaint.status === "approved" && (
              <div>
                <button className="btn-resolve" onClick={handleMarkResolved}>✓ Mark as Resolved</button>
                <small style={{ display:'block', marginTop:'0.5rem', color:'#9ca3af', fontFamily:'Arial' }}>
                  Click when the department has resolved your complaint.
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
