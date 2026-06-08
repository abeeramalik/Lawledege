import "./Header.css";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <div className="logo">Lawledge Portal</div>
      <nav className="header-nav">
        <Link to="/">Home</Link>
        <Link to="/complaints">File Complaint</Link>
        <Link to="/track">Track</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/directory">Directory</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/status">Status</Link>
      </nav>
    </header>
  );
}
