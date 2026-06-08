import { useState } from 'react';
import { Search, Phone, MapPin, BadgeCheck, Filter, Copy, ExternalLink, Globe, Star, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const directory = [
  // --- EMERGENCY & POLICE ---
  { id: 1, name: "Rescue 1122 Multan HQ", category: "Emergency", phone: "1122", location: "BZU Road", verified: true, website: "https://rescue.gov.pk" },
  { id: 2, name: "Fire Brigade Multan", category: "Emergency", phone: "16", location: "Ghanta Ghar", verified: true },
  { id: 3, name: "Police Emergency 15", category: "Police", phone: "15", location: "City Wide", verified: true },
  { id: 4, name: "Multan Traffic Police HQ", category: "Police", phone: "061-9201103", location: "Ghanta Ghar", verified: true, website: "https://multantrafficpolice.gov.pk" },
  { id: 5, name: "CPO Multan Office", category: "Police", phone: "061-9200234", location: "Kutchery Road", verified: true },
  { id: 6, name: "CTD Multan Office", category: "Police", phone: "061-9239855", location: "Khanewal Road", verified: true },
  { id: 7, name: "PS Gulgasht", category: "Police", phone: "061-9210088", location: "Gulgasht Colony", verified: true },
  { id: 8, name: "PS Cantt Multan", category: "Police", phone: "061-9200235", location: "Cantt Area", verified: true },
  { id: 9, name: "PS Mumtazabad", category: "Police", phone: "061-9239103", location: "Mumtazabad", verified: true },
  { id: 10, name: "PS New Multan", category: "Police", phone: "061-9201089", location: "New Multan", verified: true },

  // --- HEALTHCARE ---
  { id: 11, name: "Nishtar Hospital Emergency", category: "Health", phone: "061-9200231", location: "Nishtar Road", verified: true },
  { id: 12, name: "Children's Hospital Multan", category: "Health", phone: "061-9201014", location: "Bosan Road", verified: true },
  { id: 13, name: "Civil Hospital Multan", category: "Health", phone: "061-9200051", location: "Abdali Road", verified: true },
  { id: 14, name: "CPE Cardiology Institute", category: "Health", phone: "061-9201047", location: "Abdali Road", verified: true },
  { id: 15, name: "Multan Institute of Kidney Diseases", category: "Health", phone: "061-9201072", location: "Nishtar Road", verified: true },
  { id: 16, name: "MINAR (Cancer Hospital)", category: "Health", phone: "061-9200840", location: "Nishtar Hospital Road", verified: true },
  { id: 17, name: "Fatimid Blood Bank", category: "Health", phone: "061-4512411", location: "Civil Lines", verified: true },
  { id: 18, name: "Shaukat Khanum Collection Centre", category: "Health", phone: "061-111-155-555", location: "Abdali Road", verified: true },

  // --- UTILITIES ---
  { id: 19, name: "MEPCO HQ Multan", category: "Utility", phone: "061-9210332", location: "Khanewal Road", verified: true, website: "https://mepco.com.pk" },
  { id: 20, name: "WASA Multan (Head Office)", category: "Utility", phone: "061-9200812", location: "Multan City", verified: true, website: "https://wasamultan.punjab.gov.pk" },
  { id: 21, name: "SNGPL Multan (Gas)", category: "Utility", phone: "1199", location: "MDA Road", verified: true, website: "https://sngpl.com.pk" },
  { id: 22, name: "PTCL Multan Central", category: "Utility", phone: "1218", location: "Cantt", verified: true },
  { id: 23, name: "MWMC (Waste Management)", category: "Utility", phone: "1139", location: "Shamsabad", verified: true, website: "https://mwmc.com.pk" },
  { id: 24, name: "MEPCO Complaint Center", category: "Utility", phone: "118", location: "MDA Road", verified: true },

  // --- LEGAL & COURTS ---
  { id: 25, name: "District & Sessions Courts", category: "Legal", phone: "061-9200257", location: "Kutchery Road", verified: true },
  { id: 26, name: "Lahore High Court Multan Bench", category: "Legal", phone: "061-9200057", location: "Old Bahawalpur Road", verified: true },
  { id: 27, name: "Multan High Court Bar Association", category: "Legal", phone: "061-9200155", location: "High Court Bench", verified: true },
  { id: 28, name: "District Bar Association Multan", category: "Legal", phone: "061-9200092", location: "Kutchery Road", verified: true },
  { id: 29, name: "Ombudsman Punjab Multan Office", category: "Legal", phone: "061-9201402", location: "Gulgasht Colony", verified: true },
  { id: 30, name: "Consumer Court Multan", category: "Legal", phone: "061-9201509", location: "District Courts", verified: true },

  // --- GOVERNMENT SERVICES ---
  { id: 31, name: "NADRA Mega Center Multan", category: "Services", phone: "061-9220199", location: "BCG Chowk", verified: true },
  { id: 32, name: "Passport Office Multan", category: "Services", phone: "061-9210087", location: "Gulgasht Colony", verified: true },
  { id: 33, name: "Post Office GPO Multan", category: "Services", phone: "061-9200021", location: "Cantt", verified: true },
  { id: 34, name: "MDA (Multan Development Authority)", category: "Services", phone: "061-9200848", location: "MDA Road", verified: true },
  { id: 35, name: "Multan International Airport", category: "Services", phone: "061-9202601", location: "Airport Road", verified: true },
  { id: 36, name: "Railway Station Multan Cantt", category: "Services", phone: "061-117", location: "Cantt", verified: true },

  // --- NGOs & ANIMAL WELFARE ---
  { id: 37, name: "Edhi Center Multan", category: "NGO", phone: "115", location: "Hassan Parwan", verified: true, website: "https://edhi.org" },
  { id: 38, name: "Child Protection Bureau", category: "NGO", phone: "1121", location: "Shah Rukne Alam", verified: true },
  { id: 39, name: "Saylani Welfare Multan", category: "NGO", phone: "0800-13513", location: "Bosan Road", verified: true },
  { id: 40, name: "Al-Khidmat Foundation", category: "NGO", phone: "1023", location: "Nishtar Road", verified: true },
  { id: 41, name: "Lucky Pets Clinic (Emergency)", category: "Animal Welfare", phone: "0300-6300000", location: "Gulgasht", verified: true },
  { id: 42, name: "Livestock & Dairy Development", category: "Animal Welfare", phone: "061-9200211", location: "District Courts", verified: true },
  { id: 43, name: "Multan Zoo Office", category: "Animal Welfare", phone: "061-4545041", location: "Pir Khurshid Colony", verified: true },
  { id: 44, name: "Women Crisis Center (Sanawar)", category: "NGO", phone: "061-9201026", location: "MDA Road", verified: true },

  // --- EDUCATION ---
  { id: 45, name: "BZU Multan (Admin)", category: "Education", phone: "061-9210071", location: "Bosan Road", verified: true, website: "https://bzu.edu.pk" },
  { id: 46, name: "BISE Multan (Board)", category: "Education", phone: "061-9210125", location: "Gol Bagh", verified: true, website: "https://bisemultan.edu.pk" },
  { id: 47, name: "NFC Institute of Engineering", category: "Education", phone: "061-9220012", location: "Khanewal Road", verified: true },
  { id: 48, name: "Womens University Multan", category: "Education", phone: "061-9200811", location: "Kutchery Road", verified: true },

  // --- ADDITIONAL ---
  { id: 49, name: "Multan Chamber of Commerce", category: "Services", phone: "061-4517087", location: "Shahrah-e-Quaid-e-Azam", verified: true },
  { id: 50, name: "DCO Multan Office", category: "Services", phone: "061-9200031", location: "Kutchery Road", verified: true },
  { id: 51, name: "EPA Multan (Environment)", category: "Services", phone: "061-9210141", location: "Shamsabad", verified: true },
  { id: 52, name: "Social Welfare Complex", category: "NGO", phone: "061-9239401", location: "Industrial Estate", verified: true },
  { id: 53, name: "Multan Museum Office", category: "Services", phone: "061-4581022", location: "Ghanta Ghar", verified: true }
];

const CATEGORIES = ["All", "Emergency", "Police", "Health", "Utility", "Legal", "Services", "NGO", "Animal Welfare", "Education"];

export default function DirectoryModule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [copiedId, setCopiedId] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('lawledge_dir_favs');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('lawledge_dir_favs', JSON.stringify(newFavs));
  };

  const handleShare = (entry) => {
    const text = `Lawledge Contact: ${entry.name}\nPhone: ${entry.phone}\nLocation: ${entry.location}`;
    if (navigator.share) {
      navigator.share({ title: 'Lawledge Directory', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Contact info copied to clipboard');
    }
  };

  const CATEGORIES_EXTENDED = [...CATEGORIES, "Favorites"];

  const filtered = directory.filter(entry => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "All"
      ? true
      : filter === "Favorites"
        ? favorites.includes(entry.id)
        : entry.category === filter;
    return matchesSearch && matchesFilter;
  });

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <h2 className="text-5xl font-black italic tracking-tighter leading-none">Civic Gold Mine</h2>
          <p className="text-slate-500 font-medium text-lg leading-snug">The ultimate directory of verified institutional contacts in Multan.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, site, or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-100 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest pr-14 focus:ring-4 focus:ring-slate-100 outline-none cursor-pointer w-full sm:w-auto"
            >
              {CATEGORIES_EXTENDED.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Filter className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.map((entry, idx) => (
            <motion.div
              layout
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.02 }}
              className="group relative p-10 bg-white border border-slate-100 rounded-[3.5rem] hover:shadow-2xl hover:border-slate-300 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex justify-between items-start mb-8 relative z-10">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${entry.category === 'Emergency' ? 'bg-red-500 text-white' :
                    entry.category === 'Police' ? 'bg-indigo-500 text-white' :
                      entry.category === 'Health' ? 'bg-emerald-500 text-white' :
                        entry.category === 'Utility' ? 'bg-yellow-500 text-slate-900' :
                          'bg-slate-100 text-slate-500 group-hover:bg-slate-900 group-hover:text-white'
                  }`}>
                  {entry.category}
                </span>
                <div className="flex items-center space-x-2">
                  {entry.verified && (
                    <div className="flex items-center space-x-1 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                      <BadgeCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                  <button
                    onClick={() => toggleFavorite(entry.id)}
                    className={`p-2 rounded-lg transition-colors ${favorites.includes(entry.id) ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    <Star className={`w-4 h-4 ${favorites.includes(entry.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleShare(entry)}
                    className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-2 leading-tight group-hover:translate-x-1 transition-transform">{entry.name}</h3>
                <div className="flex items-center text-slate-400 mb-8 text-sm font-medium">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{entry.location}</span>
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-100 relative z-10">
                <div className="flex gap-2">
                  {/* FIX APPLIED HERE: Added explicit text-slate-900 and group-hover/btn:text-white to the inner container */}
                  <a
                    href={`tel:${entry.phone}`}
                    className="flex-1 flex items-center justify-between p-5 bg-amber-400 rounded-3xl hover:bg-slate-900 transition-all group/btn shadow-lg shadow-amber-400/20 hover:shadow-slate-900/20"
                  >
                    <div className="flex items-center space-x-3 text-slate-900 group-hover/btn:text-white transition-colors">
                      <Phone className="w-5 h-5" />
                      <span className="font-black text-lg">{entry.phone}</span>
                    </div>
                  </a>
                  <button
                    onClick={() => handleCopy(entry.id, entry.phone)}
                    className="p-5 bg-slate-100 rounded-3xl hover:bg-slate-200 transition-colors relative"
                  >
                    <Copy className="w-5 h-5 text-slate-600" />
                    {copiedId === entry.id && (
                      <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap animate-bounce">
                        COPIED
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex gap-2">
                  {entry.website && (
                    <a
                      href={entry.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center space-x-2 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Website</span>
                      <ExternalLink className="w-2 h-2" />
                    </a>
                  )}
                  <button className="flex-1 flex items-center justify-center space-x-2 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
                    <MapPin className="w-3 h-3" />
                    <span>Locate</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-40 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest mb-4">No results found for "{searchTerm}"</p>
          <button
            onClick={() => { setSearchTerm(""); setFilter("All"); }}
            className="text-slate-900 font-black border-b-2 border-slate-900 pb-1 hover:opacity-70 transition-opacity"
          >
            Clear Search & Filters
          </button>
        </div>
      )}

      <div className="bg-slate-900 text-white p-12 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-3xl font-black italic">Missing a contact?</h4>
          <p className="text-white/60 font-medium">Help us keep the Gold Mine updated. Suggest a department or NGO.</p>
        </div>
        <button className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-lg hover:scale-105 transition-transform">
          SUBMIT CONTACT
        </button>
      </div>
    </div>
  );
}