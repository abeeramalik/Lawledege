// src/lib/mapping.js

/**
 * ISSUE_MAPPING
 * This object maps the user's selected category to the specific 
 * legal authority and PPC (Pakistan Penal Code) section.
 * 
 * CRITICAL: The keys 'auth' and 'law' must match the 
 * variable names used in your FileComplaint.jsx insert logic.
 */
export const ISSUE_MAPPING = {
  "Water and Sewage": { 
    auth: "WASA Multan", 
    law: "PPC Section 277" 
  },
  "Electricity/Power": { 
    auth: "MEPCO", 
    law: "Electricity Act 1910 - Sec 39" 
  },
  "Harassment/Abuse": { 
    auth: "CPO Multan / Women Police Station", 
    law: "PPC Section 509" 
  },
  "Gas Supply": { 
    auth: "SNGPL (Sui Northern Gas)", 
    law: "Gas Theft Control and Recovery Act" 
  },
  "Road and Infrastructure": { 
    auth: "MDA / Metropolitan Corp", 
    law: "PPC Section 283" 
  },
  "Sanitation and Waste": { 
    auth: "MWMC (Multan Waste Management Co)", 
    law: "PPC Section 269" 
  },
  "Environment and noise": { 
    auth: "EPA Punjab", 
    law: "PPC Section 290" 
  },
  "Customer Rights / Market": { 
    auth: "District Consumer Court Multan", 
    law: "Punjab Consumer Protection Act 2005" 
  },
  "Property and Law Dispute": { 
    auth: "Civil Courts Multan", 
    law: "PPC Section 441" 
  },
  "Health and Hospital Negligence": { 
    auth: "Punjab Healthcare Commission", 
    law: "PPC Section 337" 
  },
  "Education issues": { 
    auth: "Directorate of Education Multan", 
    law: "Punjab Private Educational Institutions Act" 
  },
  "telecom/internet": { 
    auth: "PTA / FIA Cyber Crime Wing", 
    law: "PECA 2016" 
  },
  "transport and traffic": { 
    auth: "City Traffic Police Multan", 
    law: "Provincial Motor Vehicles Ordinance 1965" 
  },
  "food safety / adulteration": { 
    auth: "Punjab Food Authority (PFA)", 
    law: "Punjab Food Authority Act 2011" 
  },
  "Corruption / Bribery": { 
    auth: "Anti-Corruption Establishment (ACE) Punjab", 
    law: "PPC Section 161" 
  },
  "Child Rights/ Labour": { 
    auth: "Child Protection & Welfare Bureau Multan", 
    law: "PPC Section 370" 
  },
  "Cyber Crime / Online Fraud": { 
    auth: "FIA Cyber Crime Wing", 
    law: "PECA 2016 Section 20" 
  },
  "Animal Welfare Cruelty": { 
    auth: "Livestock & Dairy Development Department", 
    law: "Prevention of Cruelty to Animals Act 1890" 
  }
};