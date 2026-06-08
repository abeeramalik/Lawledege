import { useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "../api/supabaseClient";
import { saveComplaintPDF } from "../lib/pdfGenerator";
import "./FileComplaint.css";
import { handleOfficialSubmissionFlow } from "../lib/whatsappSender";
import {
  MULTAN_ZONES,
  ISSUE_MAPPING,
  SEVERITY_LEVELS,
  generateTrackingCode,
} from "../lib/complaintData";

import { validateEmail, validateFullName, validateTextLength } from "../lib/validators";


function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`custom-select${required ? " custom-select--required" : ""}`}
    >
      <button
        type="button"
        className={`custom-select__trigger${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <span
          className={`custom-select__value${selected ? "" : " is-placeholder"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <span className="custom-select__chev" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="custom-select__menu" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                type="button"
                key={opt.value}
                className={`custom-select__option${isSelected ? " is-selected" : ""}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {required && (
        <input
          type="hidden"
          name="__required_custom_select"
          value={value || ""}
          readOnly
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function FileComplaint() {
  const [form, setForm] = useState({
    userName: "",
    email: "",
    category: "",
    location: "",
    severity: "Medium",
    text: "",
  });
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState(null);

  const [loading, setLoading] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const categoryRef = useRef(null);
  const locationRef = useRef(null);
  const textRef = useRef(null);
  const fileRef = useRef(null);

  function validateForm() {
    const nextErrors = {};

    // Full Name (optional but validated if provided)
    if (form.userName.trim()) {
      const name = form.userName.trim();
      const nameErr = validateFullName(name, { required: false });
      if (nameErr) nextErrors.userName = nameErr;
    }

    // Email (optional; validate only when provided using standard regex)
    if (form.email.trim()) {
      const email = form.email.trim();
      const emailErr = validateEmail(email);
      if (emailErr) nextErrors.email = emailErr;
    }

    // Category
    if (!form.category) nextErrors.category = 'Issue category is required.';
    else if (!Object.prototype.hasOwnProperty.call(ISSUE_MAPPING, form.category))
      nextErrors.category = 'Invalid issue category.';

    // Location
    if (!form.location) nextErrors.location = 'Location is required.';
    else if (!MULTAN_ZONES.includes(form.location)) nextErrors.location = 'Invalid location.';

    // Severity
    if (!form.severity) nextErrors.severity = 'Severity is required.';
    else if (!SEVERITY_LEVELS.includes(form.severity)) nextErrors.severity = 'Invalid severity level.';

    // Description: required and cannot be pure numeric
    const descErr = validateTextLength(form.text, {
      required: true,
      min: 15,
      max: 2000,
      label: 'Description',
    });
    if (descErr) nextErrors.text = descErr;
    else {
      const normalized = String(form.text || '').replace(/\s+/g, '').trim();
      if (/^\d+$/.test(normalized)) nextErrors.text = 'Description cannot be only numbers.';
    }

    // Evidence
    if (!file) nextErrors.evidence = 'Evidence is required.';

    return nextErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      // Scroll/focus the first invalid field instead of alerting
      const firstErrorKey = Object.keys(nextErrors)[0];
      const refMap = {
        userName: nameRef,
        email: emailRef,
        category: categoryRef,
        location: locationRef,
        text: textRef,
        evidence: fileRef,
      };
      const targetRef = refMap[firstErrorKey];
      if (targetRef && targetRef.current) {
        try {
          targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) {}
        if (typeof targetRef.current.focus === 'function') {
          try { targetRef.current.focus(); } catch (e) {}
        } else {
          // attempt to focus inner control (e.g. custom select)
          const btn = targetRef.current.querySelector && targetRef.current.querySelector('button');
          if (btn && typeof btn.focus === 'function') btn.focus();
        }
      }
      return;
    }
    setErrors({});
    setLoading(true);


    const code = generateTrackingCode();
    const mapping =
      ISSUE_MAPPING[form.category] || ({ auth: "Admin", law: "General" });
    const finalName = form.userName.trim() || "Anonymous";

    try {
      const fileExt = file.name.split(".").pop();
      // Sanitize text minimally on client; backend must perform authoritative sanitization.
      const safeText = String(form.text || '').replace(/[<>]/g, '').trim();
      const fileName = `${code}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const complaintPayload = {
        tracking_code: code,
        complainant_name: finalName,
        complainant_email: form.email ? form.email.trim().toLowerCase() : null,
        category: form.category,
        location: form.location,
        severity: form.severity,
        complaint_text: safeText,
        evidence_url: uploadData.path,
        ppc_mapping: mapping.law,
        assigned_authority: mapping.auth,
      };

      const { error: dbError } = await supabase
        .from("complaints")
        .insert([complaintPayload]);
      if (dbError) throw dbError;

      setLastSubmission(complaintPayload);
      setTrackingCode(code);
      setSubmitted(true);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted)
    return (
      <div className="file-complaint-page">
        <div className="file-complaint-bg" />
        <div className="form-container form-container-success">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h2 className="success-heading">Complaint Registered!</h2>
            <p className="tracking-text">
              Tracking ID: <strong>{trackingCode}</strong>
            </p>
            <div className="info-box">
              <p>
                Your official complaint has been formatted. Use the buttons below
                to download your report and notify the concerned department.
              </p>
            </div>
            <div className="action-row">
              <button
                className="btn-download btn-action"
                onClick={async () =>
                  await saveComplaintPDF(
                    lastSubmission,
                    lastSubmission.assigned_authority,
                    lastSubmission.ppc_mapping
                  )
                }
              >
                Download PDF
              </button>
              <button
                className="btn-wa btn-action"
                onClick={() => handleOfficialSubmissionFlow(lastSubmission)}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                  style={{ width: 20, height: 20 }}
                >
                  <path
                    fill="white"
                    d="M12.04 2C6.49 2 2 6.47 2 12.01c0 1.88.52 3.64 1.42 5.15L2 22l4.99-1.4c1.48.84 3.2 1.32 5.05 1.32 5.55 0 10.04-4.49 10.04-10.05C22.08 6.47 17.59 2 12.04 2Zm5.78 13.43c-.2.6-1.17 1.16-1.62 1.22-.41.06-.93.09-1.5-.07-.35-.1-.8-.25-1.36-.53-2.52-1.2-4.16-3.86-4.26-4.03-.1-.17-1.01-1.32-1.01-2.52 0-1.2.62-1.78.84-2.02.23-.23.5-.31.66-.31h.36c.12 0 .29-.04.44.33.18.42.59 1.4.64 1.5.06.1.1.24.02.41-.08.17-.12.28-.24.42-.12.14-.26.31-.36.42-.12.12-.24.25-.11.47.13.22.57.95 1.23 1.53.85.75 1.57.99 1.81 1.1.22.1.36.08.49-.07.16-.18.6-.7.76-.94.16-.23.31-.2.52-.12.21.08 1.33.62 1.56.74.23.12.38.18.44.28.06.1.06.6-.14 1.2Z"
                  />
                </svg>
                WhatsApp
              </button>
            </div>
            <button
              className="btn-reset"
              onClick={() => window.location.reload()}
            >
              File Another Complaint
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="file-complaint-page">
      <div className="file-complaint-bg" />
      <div className="form-container">
        <h1 className="complaint-page-heading">Register a Complaint</h1>
        <p className="complaint-page-sub">
          Your voice matters — file your complaint and hold authorities
          accountable.
        </p>

        <form onSubmit={handleSubmit} className="complaint-form">
          {/* Section 1: Your Information */}
          <div>
            <div className="form-section-heading">
              <span
                className="section-icon purple"
                style={{ color: "white" }}
                aria-hidden="true"
              />
              Your Information
            </div>
            <div className="form-row">
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  ref={nameRef}
                  maxLength={60}
                  placeholder="Enter your name (optional)"
                  onChange={(e) =>
                    setForm({ ...form, userName: e.target.value })
                  }
                  className={errors.userName ? 'input-error' : ''}
                />
                <small
                  style={{
                    color: "#6b7280",
                    fontSize: "0.85rem",
                    marginTop: "0.3rem",
                    display: "block",
                  }}
                >
                  Anonymous if not provided
                </small>
                {errors.userName && <p className="error-message">{errors.userName}</p>}
              </div>
              <div>
                <label>Email Address</label>
                <input
                  type="email"
                  ref={emailRef}
                  placeholder="Email (Optional)"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <p className="error-message">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Incident Details */}
          <div>
            <div className="form-section-heading">
              <span
                className="section-icon pink"
                style={{ color: "white" }}
                aria-hidden="true"
              />
              Incident Details
            </div>
            <div className="form-row">
              <div>
                <label>Location</label>
                <div ref={locationRef}>
                <CustomSelect
                  required
                  placeholder="Where did it happen?"
                  options={MULTAN_ZONES.map((z) => ({ value: z, label: z }))}
                  value={form.location}
                  onChange={(v) => setForm({ ...form, location: v })}
                />
                </div>
                {errors.location && <p className="error-message">{errors.location}</p>}
              </div>
              <div>
                <label>Issue Category</label>
                <div ref={categoryRef}>
                <CustomSelect
                  required
                  placeholder="What is the issue?"
                  options={Object.keys(ISSUE_MAPPING).map((cat) => ({
                    value: cat,
                    label: cat,
                  }))}
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v })}
                />
                </div>
                {errors.category && <p className="error-message">{errors.category}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Severity + Description */}
          <div>
            <div className="form-section-heading">
              <span
                className="section-icon teal"
                style={{ color: "white" }}
                aria-hidden="true"
              />
              Complaint Details
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label>Severity Level</label>
              <CustomSelect
                options={SEVERITY_LEVELS.map((s) => ({
                  value: s,
                  label: `${s} Severity`,
                }))}
                value={form.severity}
                onChange={(v) => setForm({ ...form, severity: v })}
              />
              {errors.severity && <p className="error-message">{errors.severity}</p>}
            </div>
            <div>
              <label>Detailed Description</label>
              <textarea
                placeholder="Describe the incident in detail. Be specific about dates, times, and people involved..."
                required
                ref={textRef}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                className={errors.text ? 'input-error' : ''}
              />
              {errors.text && <p className="error-message">{errors.text}</p>}
            </div>
          </div>

          {/* Section 4: Evidence */}
          <div>
            <div className="form-section-heading">
              <span
                className="section-icon orange"
                style={{ color: "white" }}
                aria-hidden="true"
              />
              Upload Evidence
            </div>
            <div className="evidence-box">
              <label>📸 Attach Evidence (Required)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                required
                ref={fileRef}
                onChange={(e) => setFile(e.target.files[0])}
                className="file-input"
              />
              {errors.evidence && <p className="error-message">{errors.evidence}</p>}
              <small>
                Supported formats: Images (JPG, PNG) and PDF documents
              </small>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-submit-complaint"
          >
            {loading ? "Processing..." : "Submit Complaint"}
          </button>
        </form>
      </div>
    </div>
  );
}

