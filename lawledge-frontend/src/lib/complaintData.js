import { supabase } from "../api/supabaseClient";

/**
 * 1. UPDATED CATEGORIES & MAPPING
 * This replaces your previous Billing/Service/Technical categories 
 * with the full Multan-specific list and automatic legal mapping.
 */
export const ISSUE_MAPPING = {
  "Water and Sewage": { 
    auth: "WASA Multan", 
    law: "PPC Section 277 (Corrupting water)" 
  },
  "Electricity/Power": { 
    auth: "MEPCO", 
    law: "Electricity Act 1910 - Sec 39" 
  },
  "Harrasement/Abuse": { 
    auth: "CPO / Women Police Station", 
    law: "PPC Section 509 (Insulting modesty)" 
  },
  "Gas Supply": { 
    auth: "SNGPL", 
    law: "Gas Theft Control Act" 
  },
  "Road and Infrastructure": { 
    auth: "MDA / Metropolitan Corp", 
    law: "PPC Section 283 (Obstruction in public way)" 
  },
  "Sanitation and Waste": { 
    auth: "Multan Waste Management Co", 
    law: "PPC Section 269 (Spreading infection)" 
  },
  "Environment and noise": { 
    auth: "EPA Punjab", 
    law: "PPC Section 290 (Public nuisance)" 
  },
  "Customer Rights / Market": { 
    auth: "Consumer Court Multan", 
    law: "Punjab Consumer Protection Act" 
  },
  "Property and Law Dispute": { 
    auth: "District Administration", 
    law: "PPC Section 441 (Criminal Trespass)" 
  },
  "Health and Hospital Negligence": { 
    auth: "Health Dept / PMC", 
    law: "PPC Section 337 (Negligence)" 
  },
  "Education issues": { 
    auth: "Directorate of Education", 
    law: "Punjab Education Act" 
  },
  "telecom/internet": { 
    auth: "PTA / FIA Cyber Crime", 
    law: "PECA 2016" 
  },
  "transport and traffic": { 
    auth: "City Traffic Police Multan", 
    law: "Motor Vehicle Ordinance" 
  },
  "food safety / adulteration": { 
    auth: "Punjab Food Authority", 
    law: "PFA Act 2011" 
  },
  "Corruption / Bribery": { 
    auth: "Anti-Corruption Establishment", 
    law: "PPC Section 161 (Bribery)" 
  },
  "Child Rights/ Labour": { 
    auth: "Child Protection Bureau", 
    law: "PPC Section 370" 
  },
  "Cyber Crime / Online Fraud": { 
    auth: "FIA Cyber Crime Wing", 
    law: "PECA Section 20" 
  },
  "Animal Welfare Cruelty": { 
    auth: "Livestock Dept", 
    law: "Prevention of Cruelty to Animals Act" 
  }
};

/**
 * 2. REFINED CONSTANTS
 */
export const MULTAN_ZONES = [
  "Al-Khair Chowk",
  "Bahawalpur Road",
  "BCG Chowk",
  "Bosan Road",
  "Buch Executive Villas",
  "Citi Housing",
  "DHA Multan",
  "Fatima Jinnah Town",
  "Ghanta Ghar & Old City",
  "Gulgasht Colony",
  "Hussain Agahi",
  "Khanewal Road",
  "Multan Cantt",
  "Mumtazabad",
  "New Multan",
  "Nishtar Road Area",
  "Northern Bypass",
  "Officers Colony",
  "Qasim Bela",
  "Royal Orchard",
  "Sadar Bazaar",
  "Shah Rukn-e-Alam Colony",
  "Shalimar Colony",
  "Sher Shah Road",
  "Southern Bypass",
  "Suraj Kund Road",
  "Vehari Road",
  "WAPDA Town",
  "Zakariya Town"
];

export const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"];

// This is the list for your dropdown menu
export const COMPLAINT_CATEGORIES = Object.keys(ISSUE_MAPPING);

/**
 * 3. UPDATED UTILITY FUNCTIONS
 */

// Generate a random tracking code
export function generateTrackingCode() {
  return "CMP-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Auto‑map authority and law section based on category
// Updated to use the new ISSUE_MAPPING object
export function mapAuthorityAndLaw(category) {
  const mapping = ISSUE_MAPPING[category];
  return { 
    authority: mapping?.auth || "District Administration", 
    lawSection: mapping?.law || "General Law" 
  };
}

/**
 * 4. DATABASE ACTIONS
 */

// Insert a new complaint
export async function addComplaint(complaint) {
  const { data, error } = await supabase
    .from("complaints")
    .insert([complaint])
    .select();
    
  if (error) throw error;
  return data[0];
}

// Get single complaint for tracking
export async function getComplaintByCode(code) {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("tracking_code", code)
    .single();
    
  if (error) throw error;
  return data;
}

// Update status (Admin function)
export async function updateComplaintStatus(code, status) {
  const { data, error } = await supabase
    .from("complaints")
    .update({ status })
    .eq("tracking_code", code)
    .select();
    
  if (error) throw error;
  return data[0];
}

// List all (Admin function)
export async function listComplaints() {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (error) throw error;
  return data;
}