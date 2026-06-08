import { getComplaintPDFBlob } from "./pdfGenerator";
import emailjs from '@emailjs/browser';

export const OFFICIAL_WHATSAPP_NUMBER_INTERNATIONAL = "923058667713";
export const OFFICIAL_WHATSAPP_NUMBER_LOCAL = "03058667713";

export const DEPARTMENT_DIRECTORY = [
  { name: "WASA Multan", phone: "923058667713", email: "wasa.multan@gov.pk" },
  { name: "MEPCO", phone: "923058667713", email: "mepco@gov.pk" },
  { name: "CPO / Women Police Station", phone: "923058667713", email: "cpo.multan@punjabpolice.gov.pk" },
  { name: "SNGPL", phone: "923058667713", email: "sngpl@gov.pk" },
  { name: "MDA / Metropolitan Corp", phone: "923058667713", email: "mda.multan@gov.pk" },
  { name: "Multan Waste Management Co", phone: "923058667713", email: "mwmc.multan@gov.pk" },
  { name: "EPA Punjab", phone: "923058667713", email: "epa.punjab@gov.pk" },
  { name: "District Administration", phone: "923058667713", email: "dcc.multan@gov.pk" },
  { name: "Civil Courts Multan", phone: "923058667713", email: "civilcourts.multan@gov.pk" },
  { name: "Health Dept / PMC", phone: "923058667713", email: "phc.punjab@gov.pk" },
  { name: "Directorate of Education", phone: "923058667713", email: "doe.multan@gov.pk" },
  { name: "PTA / FIA Cyber Crime", phone: "923058667713", email: "pta.fia@gov.pk" },
  { name: "City Traffic Police Multan", phone: "923058667713", email: "traffic.multan@punjabpolice.gov.pk" },
  { name: "Punjab Food Authority", phone: "923058667713", email: "pfa.punjab@gov.pk" },
  { name: "Anti-Corruption Establishment", phone: "923058667713", email: "ace.punjab@gov.pk" },
  { name: "Child Protection Bureau", phone: "923058667713", email: "cpwb.multan@gov.pk" },
  { name: "FIA Cyber Crime Wing", phone: "923058667713", email: "fia.cyber@gov.pk" },
  { name: "Livestock Dept", phone: "923058667713", email: "lddd.punjab@gov.pk" },
];

export async function sendComplaintPDFEmail(complaint, authority, lawSection) {
  const deptInfo = DEPARTMENT_DIRECTORY.find(d => d.name === authority);
  if (!deptInfo || !deptInfo.email) {
    alert(`No email found for: ${authority}`);
    return false;
  }

  try {
    const pdfBlob = await getComplaintPDFBlob(complaint, authority, lawSection);
    const pdfFile = new File([pdfBlob], `Complaint_${complaint.tracking_code}.pdf`, { type: 'application/pdf' });

    const serviceId = 'your_emailjs_service_id';
    const templateId = 'your_emailjs_template_id';
    const userId = 'your_emailjs_user_id';

    const templateParams = {
      to_email: deptInfo.email,
      from_name: 'Lawledge Portal',
      to_name: authority,
      subject: `Official Complaint Submission - Tracking ID: ${complaint.tracking_code}`,
      message: `Respected ${authority},\n\nPlease find attached the official complaint report for Tracking ID: ${complaint.tracking_code}.\n\nComplainant: ${complaint.complainant_name}\nCategory: ${complaint.category}\nLaw Section: ${lawSection}\n\nKindly review and take appropriate action.\n\nRegards,\nLawledge Portal Team`,
      attachment: pdfFile
    };

    await emailjs.send(serviceId, templateId, templateParams, userId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    alert('Failed to send email. Please check the console for details.');
    return false;
  }
}

function formatWhatsAppNumber(phone) {
  if (!phone) return "";
  let cleaned = phone.toString().replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "92" + cleaned.substring(1);
  }
  return cleaned;
}

export function openWhatsApp(phone, message) {
  const encodedText = encodeURIComponent(message);
  const url = `whatsapp://send?phone=${phone}&text=${encodedText}`;
  window.location.href = url;
}

export function handleOfficialSubmissionFlow(complaint) {
  if (!complaint || !complaint.tracking_code) {
    alert("Submission data missing.");
    return;
  }

  const normalize = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const target = normalize(complaint.assigned_authority);

  let deptInfo = DEPARTMENT_DIRECTORY.find(
    (d) => normalize(d.name) === target
  );

  if (!deptInfo) {
    // Fallback: partial match to handle dropdown ↔ directory naming differences.
    deptInfo = DEPARTMENT_DIRECTORY.find((d) => {
      const dn = normalize(d.name);
      return dn.includes(target) || target.includes(dn);
    });
  }

  if (!deptInfo) {
    deptInfo = {
      name: complaint.assigned_authority || "Authority",
      phone: OFFICIAL_WHATSAPP_NUMBER_INTERNATIONAL,
    };
  }

  const officialMessage =
    `Respected ${complaint.assigned_authority || deptInfo.name}. ` +
    `*FORMAL COMPLAINT SUBMISSION*. ` +
    `*Tracking ID:* ${complaint.tracking_code}. ` +
    `*Category:* ${complaint.category}. ` +
    `*Submitted By:* ${complaint.complainant_name}. ` +
    `Kindly review the attached PDF for full details and take necessary action. ` +
    `Verify: https://lawledgeportal.com/track?code=${complaint.tracking_code}`;

  const phone = formatWhatsAppNumber(deptInfo.phone || OFFICIAL_WHATSAPP_NUMBER_INTERNATIONAL);

  openWhatsApp(phone, officialMessage);
}
