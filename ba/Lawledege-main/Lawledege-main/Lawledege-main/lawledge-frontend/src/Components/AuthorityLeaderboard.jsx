import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import "./Leaderboard.css";
import Toast from "./ui/Toast.jsx";

const DEPT_ICONS = {
  "Environment and noise": "🌿",
  "Transport and traffic": "🚗",
  "Road and Infrastructure": "🛣️",
  "Sanitation and Waste": "🗑️",
  "Harassment/Abuse": "🛡️",
  "Electricity/Power": "⚡",
  "Water and Sewage": "💧",
  default: "🏛️"
};

export default function Leaderboard() {
  const [departments, setDepartments] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data, error } = await supabase.from("complaints").select("category");
      if (error) { setToast({ type: "error", message: "Failed to load leaderboard" }); return; }
      const counts = {};
      data.forEach(c => { if (c.category) counts[c.category] = (counts[c.category] || 0) + 1; });
      const sorted = Object.entries(counts)
        .map(([name, complaint_count]) => ({ name, complaint_count }))
        .sort((a, b) => a.complaint_count - b.complaint_count);
      setDepartments(sorted);
    }
    fetchLeaderboard();
  }, []);

  function getRankBadge(index) {
    // Single style: avoid yellow/gold tones. Keep a clean dark palette.
    if (index === 0) return <span className="rank-badge other">1</span>;
    if (index === 1) return <span className="rank-badge other">2</span>;
    if (index === 2) return <span className="rank-badge other">3</span>;
    return <span className="rank-badge other">#{index + 1}</span>;
  }

  return (
    <div className="leaderboard-page">
      <h1 className="leaderboard-title">🏆 Department Leaderboard</h1>
      <p className="leaderboard-sub">Ranked by number of complaints — fewer is better performance.</p>

      <div className="leaderboard-banner">
        <span className="trophy-icon">🏆</span>
        <h2>Accountability Rankings</h2>
        <p>Departments with fewer complaints rank higher — driving action and accountability.</p>
      </div>

      <div className="leaderboard-table-card">
        <table>
          <thead>
            <tr>
              <th style={{width:'80px'}}>Rank</th>
              <th>Department</th>
              <th style={{width:'180px'}}>Complaints Filed</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept, index) => (
              <tr key={dept.name} className="lb-row">
                <td>{getRankBadge(index)}</td>
                <td>
                  <div className="dept-cell">
                    <span className="dept-icon">{DEPT_ICONS[dept.name] || DEPT_ICONS.default}</span>
                    <span className="dept-name">{dept.name}</span>
                  </div>
                </td>
                <td>
                  <span className="complaint-count">
                    📋 {dept.complaint_count}
                  </span>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr><td colSpan="3" style={{textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:'1.1rem', fontFamily:'Arial'}}>No data available yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
