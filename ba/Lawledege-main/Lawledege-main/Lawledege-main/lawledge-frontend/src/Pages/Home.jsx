import Card from "../Components/ui/Card.jsx";
import Button from "../Components/ui/Button.jsx";
import Accordion from "../Components/ui/Accordion.jsx";
import "./Home.css";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <div className="home-hero">
        <h1>Lawledge</h1>

        <p className="intro">
          File complaints, track progress, and connect with authorities — all in one transparent, accessible place.
        </p>
      </div>

      <p className="section-label">Quick Access</p>

      <div className="cards">
        <Card title="File a Complaint">
          <p>Submit your complaint with evidence and get a tracking code instantly.</p>
          <Link to="/complaints"><Button>Go to Complaint Form</Button></Link>
        </Card>

        <Card title="Track Complaint">
          <p>Check the real-time status of your complaint with a visual progress bar.</p>
          <Link to="/track"><Button>Track Now</Button></Link>
        </Card>

        <Card title="Complaints Filed">
          <p>Browse approved complaints, download cards, and share them on social media.</p>
          <Link to="/approved-complaints"><Button>View Complaints</Button></Link>
        </Card>

        <Card title="Admin Dashboard">
          <p>Admins can review evidence, approve or reject complaints, and map to law sections.</p>
          <Link to="/admin"><Button>Open Dashboard</Button></Link>
        </Card>

        <Card title="Leaderboard">
          <p>See which departments are handling the most complaints.</p>
          <Link to="/leaderboard"><Button>View Leaderboard</Button></Link>
        </Card>
      </div>

      <Accordion title="About Lawledge">
        <p style={{ fontSize: "1.05rem", padding: "0.5rem 0" }}>
          Lawledge is a unified portal for complaint management. It ensures transparency,
          quick resolution, and direct communication with relevant authorities.
        </p>
      </Accordion>
    </div>
  );
}
