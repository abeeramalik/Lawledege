import Accordion from "../Components/ui/Accordion.jsx";
import Card from "../Components/ui/Card.jsx";
import Button from "../Components/ui/Button.jsx";
import Toast from "../Components/ui/Toast.jsx";
import "./DirectoryPage.css";
import { useState } from "react";

export default function DirectoryPage() {
  const [toast, setToast] = useState(null);

  const contacts = {
    "Police Helpline": [
      { name: "Emergency Police", phone: "15" },
      { name: "Traffic Police", phone: "1915" }
    ],
    "Utilities": [
      { name: "WAPDA Complaint", phone: "118" },
      { name: "Gas Emergency", phone: "1199" }
    ],
    "Legal Aid": [
      { name: "Lawyers Council", phone: "042-111-111-222" },
      { name: "Women Helpline", phone: "1043" }
    ]
  };

  function copyToClipboard(phone) {
    navigator.clipboard.writeText(phone);
    setToast({ type: "success", message: `Copied ${phone} to clipboard` });
  }

  function sendWhatsApp(phone) {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent("Hello, I need assistance.")}`;
    window.open(url, "_blank");
  }

  return (
    <div className="card">
      <h2>Directory</h2>
      {Object.keys(contacts).map(category => (
        <Accordion key={category} title={category}>
          {contacts[category].map(contact => (
            <Card key={contact.name} title={contact.name}>
              <p>Phone: {contact.phone}</p>
              <div className="actions">
                <Button onClick={() => copyToClipboard(contact.phone)}>Copy</Button>
                <Button onClick={() => sendWhatsApp(contact.phone)}>WhatsApp</Button>
              </div>
            </Card>
          ))}
        </Accordion>
      ))}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
