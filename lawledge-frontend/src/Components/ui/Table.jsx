import React from "react";
import "./Table.css";

// Changed 'data' to 'rows' to match your Dashboard usage, 
// or you can keep 'data' as long as the parent matches.
export default function Table({ headers = [], rows = [] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, i) => (
            <tr key={i}>
              {/* Ensure we handle both objects and arrays if necessary */}
              {Array.isArray(row) ? (
                row.map((cell, j) => <td key={j}>{cell}</td>)
              ) : (
                row.data.map((cell, j) => <td key={j}>{cell}</td>)
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px' }}>
              No complaints found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}