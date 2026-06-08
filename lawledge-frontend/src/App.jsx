import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useState } from 'react';
import { 
  BookOpen, ShieldAlert, Phone, Bot, Eye, EyeOff, 
  ShieldCheck, Compass, Search, Trophy, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Core State Providers (.jsx files containing ONLY React components)
import { AppProvider } from './lib/context.jsx';
import { AuthProvider } from './lib/AuthContext';
import { SocketProvider } from './lib/SocketContext';

// Standardized Shared Hooks Channel (.js file containing custom hooks)
import { useAuth, useApp } from './lib/hooks';

// Dashboard Tool Components
import DirectoryModule from './modules/directory/DirectoryModule';
import EducationModule from './modules/education/FlashcardModule';
import EmergencyHub from './modules/emergency/EmergencyHub';
import { AgentInterface } from './modules/ai-agent';

// Integrated Volunteer Social System Pages
import Feed from "./Pages/Feed";
import Profile from "./Pages/Profile";
import Reels from "./Pages/Reels";
import HelpRequests from "./Pages/HelpRequests";
import AuthorityLeaderboard from "./Components/AuthorityLeaderboard";
import VolunteerLeaderboard from "./Components/VolunteerLeaderboard";
import Explore from "./Pages/Explore";
import VolunteerHub from "./Pages/VolunteerHub";


import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Messages from "./Pages/Messages";
import Notifications from "./Pages/Notifications";

// Split Administrative Control Components

import VolunteerAdmin from "./Pages/VolunteerAdmin";

// Core Platform Pages
import AdminDashboard from "./Pages/AdminDashboard";
import FileComplaint from "./Pages/FileComplaint";
import ApprovedComplaints from "./Pages/ApprovedComplaints";
import TrackComplaint from "./Pages/TrackComplaint";
import Questions from "./Pages/Questions";
import CreatePost from "./Components/CreatePost";
import BottomNav from './Components/BottomNav';

import "./App.css";

// Standardized Side Navigation Target Configuration Array
const SIDEBAR_LINKS = [
  { to: "/", label: "Home Tools", icon: <Bot size={18} /> },
  { to: "/complaints", label: "File Complaint", icon: <ShieldCheck size={18} /> },
  { to: "/approved-complaints", label: "Complaints Portal", icon: <BookOpen size={18} /> },
  { to: "/track", label: "Track Complaint", icon: <Search size={18} /> },
  { to: "/admin", label: "Platform Admin", icon: <Shield size={18} /> },
  { to: "/leaderboard", label: "Authority Board", icon: <Trophy size={18} /> },
  { to: "/feed", label: "Justice Hub", icon: <Compass size={18} /> },
];

const JUSTICE_HUB_PATHS = [
  '/feed', '/reels', '/explore', '/messages', '/notifications',
  '/create', '/help', '/volunteer-rewards'
];

function isJusticeHubPath(pathname) {
  return JUSTICE_HUB_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
}

function isLinkActive(linkTo, pathname) {
  if (linkTo === '/feed') return isJusticeHubPath(pathname);
  return pathname === linkTo || (linkTo !== '/' && pathname.startsWith(`${linkTo}/`));
}

function NavButton({ active, onClick, icon, label, isAI, highViz }) {
  const activeStyles = highViz 
    ? 'bg-black text-yellow-400 border-2 border-yellow-400 scale-105' 
    : (isAI ? 'bg-amber-500 text-white shadow-lg scale-105' : 'bg-slate-900 text-white scale-105');

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2.5 px-4 rounded-[1.25rem] sm:rounded-[1.5rem] transition-all duration-300 flex-1 ${active ? activeStyles : 'text-slate-400 hover:bg-slate-100'}`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">{label}</span>
    </button>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { highVisibility, setHighVisibility } = useApp();
  const [activeTab, setActiveTab] = useState('directory');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isModularHome = pathname === "/";
  const shouldShowBottomNav = Boolean(user) && isJusticeHubPath(pathname);
  
  return (
    <div className={`app-container ${highVisibility ? 'high-viz' : ''}`}>
      
      {/* ── Mobile Top Bar (visible only on small screens) ── */}
      <div className="mobile-topbar" style={{ display:'none', position:'sticky', top:0, zIndex:200, background:'#fff', borderBottom:'1.5px solid #e2e8f0', padding:'0.65rem 1rem', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(94,53,177,0.08)' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:'1.4rem', background:'linear-gradient(135deg,#5e35b1,#e91e63)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Lawledge</div>
        <button onClick={() => setMobileNavOpen(o => !o)} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', display:'flex', flexDirection:'column', gap:5 }}>
          <span style={{ display:'block', width:24, height:2.5, borderRadius:2, background:'#5e35b1', transition:'all .25s', transform: mobileNavOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <span style={{ display:'block', width:24, height:2.5, borderRadius:2, background:'#5e35b1', transition:'all .25s', opacity: mobileNavOpen ? 0 : 1 }} />
          <span style={{ display:'block', width:24, height:2.5, borderRadius:2, background:'#5e35b1', transition:'all .25s', transform: mobileNavOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </div>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileNavOpen && (
        <div onClick={() => setMobileNavOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:198, backdropFilter:'blur(2px)' }} />
      )}

      {/* ── Mobile Slide-in Drawer ── */}
      <div className="mobile-drawer" style={{ position:'fixed', top:0, left: mobileNavOpen ? 0 : '-100%', width:'75vw', maxWidth:300, height:'100vh', background:'#fff', borderRight:'2.5px solid #5e35b1', zIndex:199, transition:'left .3s cubic-bezier(0.4,0,0.2,1)', overflowY:'auto', padding:'1.5rem 1.25rem', display:'flex', flexDirection:'column', gap:'0.3rem' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:'1.6rem', background:'linear-gradient(135deg,#5e35b1,#e91e63)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:'1.5rem' }}>Lawledge <span style={{ display:'block', fontFamily:'Arial,sans-serif', fontSize:'0.85rem', fontWeight:800, color:'#5e35b1', WebkitTextFillColor:'#5e35b1', background:'none' }}>Legal Portal</span></div>
        {SIDEBAR_LINKS.map(link => (
          <Link key={link.to} to={link.to} onClick={() => setMobileNavOpen(false)} className={isLinkActive(link.to, pathname) ? "active" : ""} style={{ display:'flex', alignItems:'center', gap:'0.75rem', fontSize:'1rem', fontWeight:800, color:'#475569', textDecoration:'none', padding:'0.75rem 1rem', borderRadius:'1.25rem', border:'2px solid transparent', marginBottom:'0.15rem' }}>
            <span style={{ color:'#7c3aed' }}>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
        <button onClick={() => { setHighVisibility(!highVisibility); }} style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'0.75rem', borderRadius:12, border:'2px solid transparent', fontWeight:900, fontSize:11, textTransform:'uppercase', cursor:'pointer', ...(highVisibility ? { background:'#facc15', color:'#000', borderColor:'#000' } : { background:'#f1f5f9', color:'#475569', borderColor:'transparent' }) }}>
          {highVisibility ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>Contrast Mode</span>
        </button>
      </div>

      {/* ── Fixed Sidebar Navigation System ── */}
      <nav className="navbar">
        <div className="nav-logo">
          <h2>Lawledge</h2>
          <span>Legal Portal</span>
        </div>
        
        <div className="nav-links-wrapper">
          {SIDEBAR_LINKS.map(link => (
            <Link 
              key={link.to} 
              to={link.to} 
              className={isLinkActive(link.to, pathname) ? "active" : ""}
            >
              <span className="link-icon-align">{link.icon}</span>
              <span className="link-label-align">{link.label}</span>
            </Link>
          ))}
        </div>

        <button 
          onClick={() => setHighVisibility(!highVisibility)}
          className="lg:mt-auto flex items-center justify-center gap-2 p-3 rounded-xl transition-all border-2 font-black uppercase text-[11px] w-full"
          style={highVisibility 
            ? { background: '#facc15', color: '#000', borderColor: '#000' } 
            : { background: '#f1f5f9', color: '#475569', borderColor: 'transparent' }
          }
        >
          {highVisibility ? <EyeOff size={16} /> : <Eye size={16} />}
          <span>Contrast Mode</span>
        </button>
      </nav>

      {/* ── Main Scroll Viewport Display ── */}
      <div className="main-wrapper">
        <main className="content">
          <Routes>
            {/* Core Baseline Tools Dashboard */}
            <Route path="/" element={
              <AnimatePresence mode="wait">
                <motion.div
                  className="lawledge-module-shell"
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {activeTab === 'education' && <EducationModule />}
                  {activeTab === 'directory' && <DirectoryModule />}
                  {activeTab === 'emergency' && <EmergencyHub />}
                  {activeTab === 'ai' && <AgentInterface />}
                </motion.div>
              </AnimatePresence>
            } />

            {/* Volunteer Social Sub-System Tracks */}
            <Route path="/volunteer-hub" element={user ? <VolunteerHub /> : <Navigate to="/login" replace />} />
            <Route path="/justice-hub" element={<Navigate to="/feed" replace />} />

            <Route path="/feed" element={<Feed />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/reels" element={<Reels />} />
            <Route path="/help" element={user ? <HelpRequests /> : <Navigate to="/login" replace />} />
            <Route path="/leaderboard" element={<AuthorityLeaderboard />} />

            <Route path="/volunteer-rewards" element={user ? <VolunteerLeaderboard /> : <Navigate to="/login" replace />} />


            <Route path="/explore" element={user ? <Explore /> : <Navigate to="/login" replace />} />

            <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" replace />} />
            <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" replace />} />
            <Route path="/create" element={user ? <CreatePost /> : <Navigate to="/login" replace />} />


            
            {/* Integrated Dual-Factor Secure Administration Control Center Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/volunteer-admin" element={<VolunteerAdmin />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Existing Platform Pages */}
            <Route path="/complaints" element={<FileComplaint />} />
            <Route path="/approved-complaints" element={<ApprovedComplaints />} />
            <Route path="/track" element={<TrackComplaint />} />
            <Route path="/questions" element={<Questions />} />
            
            {/* Fallback Catch-all Route Redirection Map */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {shouldShowBottomNav && <BottomNav />}

      {/* ── Floating Dashboard Tab Controller Dock ── */}
      {isModularHome && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+140px)] w-[92%] max-w-[420px] z-50 px-2">
          <nav className={`flex justify-between items-center p-2 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.15)] transition-all ${
              highVisibility ? 'bg-yellow-400 border-4 border-black' : 'bg-white/90 backdrop-blur-xl border border-white/60'
            }`}>
            <NavButton active={activeTab === 'education'} onClick={() => setActiveTab('education')} icon={<BookOpen size={18} />} label="Learn" highViz={highVisibility} />
            <NavButton active={activeTab === 'directory'} onClick={() => setActiveTab('directory')} icon={<Phone size={18} />} label="Dir" highViz={highVisibility} />
            <NavButton active={activeTab === 'emergency'} onClick={() => setActiveTab('emergency')} icon={<ShieldAlert size={18} />} label="SOS" highViz={highVisibility} />
            <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Bot size={18} />} label="AI Guide" isAI highViz={highVisibility} />
          </nav>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppProvider>
          <AppLayout />
        </AppProvider>
      </SocketProvider>
    </AuthProvider>
  );
}