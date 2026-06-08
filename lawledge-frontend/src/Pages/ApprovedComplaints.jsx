import { useEffect, useRef, useState } from "react";
import { supabase } from "../api/supabaseClient";
import html2canvas from "html2canvas";
import { DEPARTMENT_DIRECTORY } from "../lib/whatsappSender";
import "./ApprovedComplaints.css";

const BOOKMARK_KEY = "approved-complaint-bookmarks";

// Standard icon components
const ShareIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const BookmarkIcon = ({ filled }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const CopyLinkIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

export default function ApprovedComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || []; } catch { return []; }
  });
  const [notice, setNotice] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);
  const cardRefs = useRef({});

  useEffect(() => { fetchApprovedComplaints(); }, []);
  useEffect(() => { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks)); }, [bookmarks]);

  /* Normalizes phone numbers for WhatsApp: converts 0 -> 92 and strips symbols */
  const formatWhatsAppNumber = (phone) => {
    if (!phone) return "";
    let cleaned = phone.toString().replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "92" + cleaned.substring(1);
    }
    return cleaned;
  };

  // Ensures all card images are loaded before capturing a screenshot
  function waitForImages(root) {
    return Promise.all(Array.from(root.querySelectorAll("img")).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(r => { img.onload = img.onerror = r; });
    }));
  }

  // Load complaints that reached final stages
  async function fetchApprovedComplaints() {
    setLoading(true);
    const { data, error } = await supabase.from("complaints").select("*")
      .in("status", ["approved", "resolved"]).order("created_at", { ascending: false });
    if (error) { setNotice({ type: "error", message: "Unable to load approved complaints." }); setComplaints([]); }
    else { setComplaints(data || []); setNotice(null); }
    setLoading(false);
  }
  // Local bookmark management
  function toggleBookmark(id) {
    setBookmarks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    setNotice({ type: "success", message: "Bookmark updated." });
  }

  const toggleReadMore = (id) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Convert the complaint card UI into a downloadable image

  async function captureCardImage(id) {
    const card = cardRefs.current[id];
    if (!card) return;
    try {
      await waitForImages(card);
      const canvas = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `complaint-${id}.png`;
      link.click();
      setNotice({ type: "success", message: "Card image downloaded." });
    } catch { setNotice({ type: "error", message: "Unable to download the card image." }); }
  }

  function getComplaintUrl(complaint) {
    return `${window?.location?.origin || ""}/track?code=${encodeURIComponent(complaint.tracking_code)}`;
  }

  async function shareCard(complaint) {
    const card = cardRefs.current[complaint.id];
    if (!card) return;
    
    /* Lookup department phone from directory with trimmed key check */
    const deptInfo = DEPARTMENT_DIRECTORY[(complaint.assigned_authority || "").trim()];
    const phone = formatWhatsAppNumber(deptInfo?.phone);

    try {
      await waitForImages(card);
      const canvas = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("Blob failed");
      const file = new File([blob], `complaint-${complaint.id}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Complaint ${complaint.tracking_code}`, text: `${complaint.tracking_code} - ${complaint.complainant_name}` });
        setNotice({ type: "success", message: "Shared!" }); return;
      }
    } catch {}
    const msg = `Complaint: ${complaint.tracking_code}\n${complaint.complainant_name}\nStatus: Approved\n${getComplaintUrl(complaint)}`;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, "_blank");
  }

  function copyLink(complaint) {
    navigator.clipboard.writeText(getComplaintUrl(complaint))
      .then(() => setNotice({ type: "success", message: "Link copied to clipboard!" }))
      .catch(() => setNotice({ type: "error", message: "Unable to copy link." }));
  }

  // Visual preview for attached evidence
  function renderEvidencePreview(complaint) {
    if (!complaint.evidence_url) return <div className="evidence-placeholder">No evidence available</div>;
    const publicUrl = supabase.storage.from("evidence").getPublicUrl(complaint.evidence_url).data.publicUrl;
    const ext = complaint.evidence_url.split('.').pop().toLowerCase();
    if (ext === "pdf") return <div className="pdf-preview">📄 PDF Evidence</div>;
    return <img className="evidence-preview" src={publicUrl} alt="Evidence" loading="eager" crossOrigin="anonymous"
      onError={e => e.currentTarget.style.display = "none"} />;
  }

  return (
    <div className="approved-complaints-page">
      <div className="approved-complaints-header">
        <div>
          <h1>Complaints Filed</h1>
          <p>Browse the latest approved complaints and download, bookmark, or share each complaint card.</p>
        </div>
        <button onClick={fetchApprovedComplaints} disabled={loading}
          style={{ background:'#5e35b1', color:'white', border:'none', borderRadius:'1rem', padding:'0.75rem 1.5rem', fontWeight:800, fontSize:'1rem', cursor:'pointer', opacity: loading ? 0.7 : 1 }}>
          ↻ Refresh
        </button>
      </div>

      {notice && <div className={`page-notice ${notice.type}`}>{notice.message}</div>}

      {loading ? (
        <div className="loading-state">Loading approved complaints…</div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">No approved complaints are available yet.</div>
      ) : (
        <div className="complaint-grid">
          {complaints.map(complaint => (
            <article key={complaint.id}
              className={`complaint-card ${bookmarks.includes(complaint.id) ? "bookmarked" : ""}`}
              ref={el => { if (el) cardRefs.current[complaint.id] = el; }}>

              {/* Card Top */}
              <div className="card-top">
                <div>
                  <span className={`complaint-chip ${complaint.status === "resolved" ? "resolved" : "approved"}`}>
                    {complaint.status === "resolved" ? "✓ Resolved" : "✓ Approved"}
                  </span>
                  <p style={{ marginTop: '0.4rem', marginBottom: '0', fontSize: '1.1rem' }}><strong>Authority:</strong> <span className="authority-highlight">{complaint.assigned_authority || "Unassigned"}</span></p>
                  <h2>{complaint.complainant_name}</h2>
                  <p className="complaint-owner">{complaint.category || "Complaint"}</p>
                </div>
              </div>

              {/* 4 Standard Icons: Share, Download, Bookmark, Copy Link (top-right) */}
              <div className="complaint-actions">
                <button className="icon-action-btn share" onClick={() => shareCard(complaint)} title="Share">
                  <ShareIcon />
                </button>
                <button className="icon-action-btn download" onClick={() => captureCardImage(complaint.id)} title="Download">
                  <DownloadIcon />
                </button>
                <button className={`icon-action-btn bookmark-btn ${bookmarks.includes(complaint.id) ? "active" : ""}`}
                  onClick={() => toggleBookmark(complaint.id)} title="Bookmark">
                  <BookmarkIcon filled={bookmarks.includes(complaint.id)} />
                </button>
                <button className="icon-action-btn copy" onClick={() => copyLink(complaint)} title="Copy link">
                  <CopyLinkIcon />
                </button>
              </div>

              {/* Details (Description above Evidence) */}
              <div className="complaint-details">
                <p><strong>Status:</strong> <span className={`status-badge ${complaint.status?.toLowerCase()}`}>{complaint.status || "Pending"}</span></p>
                <p><strong>Location:</strong> {complaint.location || "Unknown"}</p>
                <p><strong>Severity:</strong> {complaint.severity || "Medium"}</p>
                <p className={`complaint-text ${expandedIds.includes(complaint.id) ? "expanded" : ""}`}>
                  {complaint.complaint_text}
                </p>
                {complaint.complaint_text?.length > 150 && (
                  <button className="read-more-btn" onClick={() => toggleReadMore(complaint.id)}>
                    {expandedIds.includes(complaint.id) ? "Read Less" : "Read More"}
                  </button>
                )}
                <p><strong>Law Mapping:</strong> {complaint.ppc_mapping || complaint.law_section || "Not mapped"}</p>
              </div>

              {/* Evidence Preview (moved below) */}
              {renderEvidencePreview(complaint)}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
