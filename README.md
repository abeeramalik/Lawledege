# [Project Name: Lawledge Portal]
###  Multan-Focused Legal Help, Complaint Filing & Tracking Platform

---

## Live Demo
**URL:** [Add your Vercel/Render link for Lawledge Portal]
**Admin Credentials:**
- **Email:** admin@lawledge.pk
- **Password:** Admin@123  
  *(These are currently hardcoded in the frontend role logic—recommended: rotate/remove in production.)*

---

## Project Overview
Lawledge Portal helps people in Pakistan (with a strong focus on Multan/Punjab) file legal/civic complaints, attach evidence, and track the complaint status through a reference (tracking code).  
It also provides an “Authority Board” and volunteer-driven civic support features, plus an AI Legal Guide to offer quick, localized guidance for common civic/legal situations.

---

## Tech Stack
- **Frontend:** React.js, Tailwind CSS, React Router, Framer Motion
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** Supabase (Auth + Postgres tables + Storage buckets)
- **Others:**
  - groq-sdk (AI assistant)
  - html2canvas + jsPDF (PDF/report generation)
  - EmailJS (emailing complaint PDFs)
  - socket.io-client (realtime chat/updates)

---

## Core Features & Logic
- **1) Complaint Filing (Evidence + Tracking Code)**
  - Users register complaints with category, Multan-area location, severity, a detailed description, and an evidence upload.
  - A unique tracking code is generated for each submission and stored with the complaint record.

- **2) Complaints Portal (Approved/Resolved browsing)**
  - Displays complaints whose `status` is **approved** or **resolved**.
  - Includes actions to **bookmark**, **download/share** complaint cards, and **copy tracking links**.
  - Evidence is previewed (image/PDF indicator) using Supabase Storage public URLs.

- **3) Complaint Tracking**
  - Users track a complaint using the tracking code.
  - Shows progress stages: **Pending → Approved → Sent → Resolved**.
  - For approved complaints, users can mark as **Resolved** (updates the Supabase record).

- **4) Real-time Messaging (Socket.IO)**
  - Socket server supports:
    - direct messages via user IDs (`join`, `send_message`, `receive_message`)
    - group messaging (`join_group`, `group_message`)
    - broadcasting new posts and help requests
  - Frontend connects to `http://localhost:4000` and joins the user room by Supabase user id.

- **5) AI Legal Guide (Groq)**
  - A chat-style assistant using Groq with a strict local Multan/legal-tone system prompt.
  - Includes TTS support using browser `speechSynthesis`.
  - The AI is integrated into the `/ai`/Home tool workflow via the `AgentInterface`.

- **6) Emergency Hub**
  - Provides locally relevant safety and helpline instructions (e.g., 15 and women helpline references in the emergency module).

---

## Localized Optimizations
- **Geography-first flow (Multan/Punjab)**
  - Complaint location selection is limited to predefined Multan zones.
  - WhatsApp messaging uses a local department directory mapping.

- **WhatsApp integration (Pakistan-friendly formatting)**
  - Phone normalization supports converting local formats to international WhatsApp format (e.g., handling leading `0` → `92`).
  - Official submission flow formats a “FORMAL COMPLAINT SUBMISSION” message and opens WhatsApp with the department phone.

- **Multan Legal/Local tone for AI**
  - AI system prompt instructs responses to include Multan context and local civic/legal terms (FIR, Thana, Union Council, Challan, etc.).

---

## Security Measures
- **Authentication & Role Handling (Supabase)**
  - Auth uses Supabase Auth state.
  - A profile/role fetch step ensures user rows exist (`users`) and volunteer profile creation (`volunteer_profiles`) when needed.
  - Admin role is derived by matching admin email and/or stored user role.

- **Server interaction hardening (client-side validation)**
  - Complaint form validates:
    - required category/location/severity
    - description length (min/max)
    - evidence presence
  - The complaint text is lightly sanitized on client by removing `<` and `>` before upload.

- **Role Guards / Access Control**
  - Routes like `/profile`, `/messages`, `/notifications`, `/admin` and volunteer pages use conditional rendering / navigation guards based on auth/role.

> Note: Client-side validation improves UX, but authoritative sanitization should also exist server-side / via DB policies.

---

## Database Schema (High-level)
Supabase is used for both Auth and data storage. Main entities used by the app include:

- **`users`**
  - Stores user profile fields (e.g., `full_name`, `phone`, `cnic`, `city`, `role`, `is_volunteer`, `status`)

- **`volunteer_profiles`**
  - Volunteer-specific metadata like bio/skills/location/points (populated via `ensureVolunteerProfile`)

- **`complaints`**
  - Complaint core record:
    - `tracking_code`, `complainant_name`, `complainant_email`
    - `category`, `location`, `severity`, `complaint_text`
    - `evidence_url` (Supabase storage path)
    - `ppc_mapping`, `assigned_authority`
    - `status` lifecycle (Pending/Approved/Sent/Resolved)

- **Supabase Storage bucket: `evidence`**
  - Stores uploaded complaint evidence files (images/PDF)

---

## Installation & Setup
1. **Clone the repo**
   ```bash
   git clone [your-repo-link]
   cd [repo-folder]
   ```

2. **Frontend (Lawledge)**
   ```bash
   cd lawledge-frontend
   npm install
   ```

3. **Set environment variables**
   - Create `lawledge-frontend/.env` with at least:
     - `VITE_GROQ_API_KEY` (required for AI agent)
     - *(any Supabase env config if you’re not using the hardcoded keys in `src/supabase.js`)*

4. **Run frontend**
   ```bash
   npm run dev
   ```
   - Frontend typically serves on Vite default port (commonly `5173`).

5. **Backend (Socket server)**
   ```bash
   cd ../lawledge-server
   npm install
   npm run dev
   ```
   - Backend runs Socket.IO on **port 4000** (used by `SocketContext`).

6. **Check health**
   - Open: `http://localhost:4000/health`

---

## Deployment Notes (Vercel/Render)
- The app is Vite-based; ensure:
  - AI key env var is configured for the frontend build (`VITE_GROQ_API_KEY`).
  - Supabase project keys and table/storage policies are correctly configured.
- The Socket server must be hosted separately (not via purely static Vercel build) or replaced with a hosted Socket endpoint.

---

## Important Files (Where to look)
- **App routing / modules:** `lawledge-frontend/src/App.jsx`
- **Auth + role/profile sync:** `lawledge-frontend/src/lib/AuthContext.jsx`
- **Real-time sockets:** `lawledge-frontend/src/lib/SocketContext.jsx`
- **Complaint filing:** `lawledge-frontend/src/Pages/FileComplaint.jsx`
- **Approved complaints portal:** `lawledge-frontend/src/Pages/ApprovedComplaints.jsx`
- **Tracking:** `lawledge-frontend/src/Pages/TrackComplaint.jsx`
- **AI Agent:** `lawledge-frontend/src/modules/ai-agent/AgentInterface.jsx`, `GroqService.js`
- **WhatsApp submission + directory:** `lawledge-frontend/src/lib/whatsappSender.js`
- **Socket server:** `lawledge-server/index.js`

---

## Disclaimer
- Admin credentials currently appear in code (role logic). For production, replace with secure server-side auth/claims and remove hardcoded secrets.
- AI responses are guidance only—users should consult a qualified legal professional for critical cases.

