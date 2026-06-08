export default function ComplaintMapping() {
  return (
    <div className="card">
      <h2>Complaint Mapping</h2>
      <select>
        <option>Select Authority</option>
        <option>Police</option>
        <option>Labor Department</option>
      </select>
      <select>
        <option>Select Law Section</option>
        <option>Section 420</option>
        <option>Workplace Harassment Act</option>
      </select>
      <button>Submit Mapping</button>
    </div>
  );
}
