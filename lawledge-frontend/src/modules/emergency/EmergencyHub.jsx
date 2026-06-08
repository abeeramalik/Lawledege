import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HeartPulse, Droplets, Wind, ShieldAlert, AlertTriangle,
    Baby, UserX, Dog, Flame, Zap, Waves, Eye, HandMetal,
    Search, Info, ChevronRight, Siren, Volume2, Square, Activity
} from 'lucide-react';
import { useApp } from '../../lib/hooks'; 

const guides = [
    // --- MEDICAL (Life Saving) ---
    {
        id: 'cpr',
        title: 'CPR (Adult)',
        category: 'Medical',
        icon: HeartPulse,
        color: 'bg-red-500',
        priority: 'Critical',
        steps: [
            'Check scene for safety and tap person: "Are you okay?"',
            'Call 1122 immediately if no response.',
            'Place heel of one hand in center of chest, other hand on top.',
            'Push hard (2 inches deep) and fast (100-120 bpm).',
            'Don\'t stop until paramedics arrive or AED is ready.'
        ]
    },
    {
        id: 'choking',
        title: 'Choking (Heimlich)',
        category: 'Medical',
        icon: UserX,
        color: 'bg-orange-500',
        priority: 'Critical',
        steps: [
            'Stand behind the person, wrap arms around waist.',
            'Make a fist, place thumb side just above navel.',
            'Grasp fist with other hand, perform quick upward thrusts.',
            'Continue until object is forced out or person goes limp.',
            'If limp, start CPR immediately.'
        ]
    },
    {
        id: 'heavy-bleeding',
        title: 'Severe Bleeding',
        category: 'Medical',
        icon: Droplets,
        color: 'bg-red-600',
        priority: 'High',
        steps: [
            'Apply firm, direct pressure with clean cloth or hand.',
            'Do not remove blood-soaked bandages; add more on top.',
            'If bleeding doesn\'t stop on limb, use a tourniquet.',
            'Keep the person warm and lying down.',
            'Seek immediate surgical intervention at Nishtar.'
        ]
    },
    {
        id: 'stroke',
        title: 'Stroke (F.A.S.T)',
        category: 'Medical',
        icon: Zap,
        color: 'bg-yellow-500',
        priority: 'High',
        steps: [
            'F: Face drooping - Ask them to smile.',
            'A: Arm weakness - Ask them to raise both arms.',
            'S: Speech difficulty - Ask them to repeat a simple phrase.',
            'T: Time to call 1122 - Mention "Stroke" specifically.',
            'Note the time when symptoms first started.'
        ]
    },
    {
        id: 'poisoning-human',
        title: 'Human Poisoning',
        category: 'Medical',
        icon: AlertTriangle,
        color: 'bg-violet-500',
        priority: 'Critical',
        steps: [
            'Identify the substance and time of ingestion.',
            'Call 1122 or Poison Control immediately.',
            'Do not induce vomiting unless specifically instructed.',
            'If the substance is on skin/eyes, rinse for 15 mins.',
            'Take the container/labels to the hospital.'
        ]
    },
    { id: 'severe-burns', title: 'Severe Burns', category: 'Medical', icon: Flame, color: 'bg-red-500', priority: 'High', steps: ['Cool the burn with cool (not cold) running water for 20 mins.', 'Remove jewelry/tight clothing before swelling occurs.', 'Cover with plastic wrap or a clean non-stick dressing.', 'Do not use ice, ointments, or butter.', 'Seek hospital care for large or deep burns.'] },
    { id: 'fracture', title: 'Fracture / Dislocation', category: 'Medical', icon: Activity, color: 'bg-violet-600', priority: 'High', steps: ['Do not try to realign the bone.', 'Stop any bleeding by applying direct pressure.', 'Immobilize the area using a splint (cardboard/wood/rolled newspaper).', 'Apply ice packs to reduce swelling (wrapped in towel).', 'Check for blood flow (warmth/color) below the injury.'] },
    { id: 'electric-shock', title: 'Electric Shock', category: 'Medical', icon: Zap, color: 'bg-yellow-400', priority: 'Critical', steps: ['Do not touch the person if they are still in contact with current.', 'Turn off the main source of electricity.', 'If safe, use a non-conducting object (wood/plastic) to push them away.', 'Check for breathing; start CPR if necessary.', 'Seek immediate medical help even if they seem fine.'] },
    { id: 'poisoning-animal', title: 'Animal Poisoning', category: 'Animal Welfare', icon: AlertTriangle, color: 'bg-violet-700', priority: 'Critical', steps: ['Identify the substance (labels, vomit) if possible.', 'Do not induce vomiting unless told by a vet.', 'Collect a sample of suspected poison.', 'Keep animal calm and warm.', 'Emergency transport to vet.'] },
    { id: 'rescue-breathing-pet', title: 'Animal Rescue Breathing', category: 'Animal Welfare', icon: Wind, color: 'bg-blue-500', priority: 'Critical', steps: ['Check if animal is conscious and heart is beating.', 'Clear the airway (check for obstructions).', 'Close animal\'s mouth and blow into their nose.', 'Give 15-20 breaths per minute.', 'Continue until they breathe on their own or you reach a vet.'] },

    // --- PERSONAL SAFETY ---
    {
        id: 'harassment-public',
        title: 'Public Harassment',
        category: 'Personal Safety',
        icon: ShieldAlert,
        color: 'bg-indigo-600',
        priority: 'Critical',
        steps: [
            'Trust your gut: if you feel unsafe, leave immediately.',
            'Identify a safe "Guardian" (shopkeeper, family) nearby.',
            'Use a firm, loud voice: "Stop following me" or "Go away".',
            'Record evidence if possible without escalating danger.',
            'Call 15 (Police) or 1043 (Women Helpline).'
        ]
    },
    {
        id: 'child-safety',
        title: 'Child Protection',
        category: 'Personal Safety',
        icon: Baby,
        color: 'bg-blue-600',
        priority: 'Critical',
        steps: [
            'Listen to the child without judgment if they report abuse.',
            'Do not confront the accused yourself; notify authorities.',
            'Keep the child in a safe, familiar environment.',
            'Contact Child Protection Bureau (1121).',
            'Document behavioral changes or physical injuries.'
        ]
    },
    { id: 'kidnapping', title: 'Kidnapping Attempt', category: 'Personal Safety', icon: HandMetal, color: 'bg-slate-900', priority: 'Critical', steps: ['Make as much noise as possible: Scream "HELP".', 'Fight back with everything - bite, kick, scratch.', 'Run toward crowds or brightly lit areas.', 'Try to memorize the license plate and vehicle.', 'Call 15 and give exact location.'] },
    { id: 'cyber-stalking', title: 'Cyber Stalking', category: 'Personal Safety', icon: Eye, color: 'bg-blue-400', priority: 'Medium', steps: ['Do not engage or respond to the stalker.', 'Take screenshots of all threats, messages, and IDs.', 'Block the user on all platforms immediately.', 'Report to FIA Cybercrime Wing (9911).', 'Update all password and privacy settings.'] },
    { id: 'domestic-violence', title: 'Domestic Violence', category: 'Personal Safety', icon: ShieldAlert, color: 'bg-red-700', priority: 'Critical', steps: ['Identify a "Safe Exit" plan before an escalation.', 'Keep a secret bag with essential documents/cash.', 'Use a safe phone to call Women Helpline (1043).', 'Teach children how to hide or call 15.', 'Seek medical attention and document injuries.'] },
    { id: 'workplace-harassment', title: 'Workplace Issues', category: 'Personal Safety', icon: UserX, color: 'bg-violet-400', priority: 'Medium', steps: ['Keep a detailed log of every incident with dates.', 'Save emails, messages, and witness names.', 'Report to HR or the designated ombudsperson.', 'Consult a legal expert on harassment laws.', 'Consider filing a complaint with the MoHR.'] },
    { id: 'elderly-abuse', title: 'Elderly Self-Defense', category: 'Personal Safety', icon: UserX, color: 'bg-yellow-600', priority: 'High', steps: ['If physically threatened, use a loud alarm/whistle.', 'Identify a trusted neighbor for emergency check-ins.', 'Keep emergency numbers in large print near phones.', 'Never share bank details over unsolicited calls.', 'Report neglect or abuse to Social Welfare (1191).'] },

    // --- ANIMAL WELFARE ---
    {
        id: 'injured-stray',
        title: 'Injured Stray',
        category: 'Animal Welfare',
        icon: Dog,
        color: 'bg-emerald-600',
        priority: 'High',
        steps: [
            'Approach slowly and talk in a low, calm voice.',
            'Use a thick towel or blanket to cover if aggressive.',
            'Check for a collar or identifier if safe.',
            'Contact local animal NGOs (Edhi/Lucky Pets).',
            'Transport to nearest vet in a secure crate/box.'
        ]
    },
    { id: 'animal-heatstroke', title: 'Animal Heatstroke', category: 'Animal Welfare', icon: Droplets, color: 'bg-yellow-700', priority: 'High', steps: ['Symptoms: Heavy panting, drooling, red gums.', 'Move to shade/cool room with a fan immediately.', 'Apply cool (not ice cold) water to their belly/paws.', 'Allow them to lick water, do not force drink.', 'Seek vet care as internal damage can persist.'] },
    { id: 'rabies-suspect', title: 'Rabies Awareness', category: 'Animal Welfare', icon: AlertTriangle, color: 'bg-red-900', priority: 'Critical', steps: ['Signs: Foaming at mouth, aggression, hydrophobia.', 'Do not attempt to touch or capture the animal.', 'Warn neighbors and clear the immediate area.', 'Call Livestock Department or Civil Defense.', 'If bitten: Wash for 15m and get PEP immediately.'] },
    { id: 'bird-rescue', title: 'Injured Bird/Nestling', category: 'Animal Welfare', icon: Wind, color: 'bg-blue-300', priority: 'Medium', steps: ['Check for immediate life-threats (cats, traffic).', 'If uninjured but fell, try to locate the nest.', 'Use gloves or a towel to move to a cardboard box.', 'Do not force water or food (can drown them).', 'Contact a wildlife rehabilitator or local vet.'] },

    // --- DISASTER RESPONSE ---
    {
        id: 'flood-survival',
        title: 'Flash Flood',
        category: 'Disaster',
        icon: Waves,
        color: 'bg-blue-700',
        priority: 'Critical',
        steps: [
            'Move to higher ground immediately.',
            'Avoid walking or driving through moving water.',
            'If car stalls in water, abandon it and move to land.',
            'Stay away from power lines and electrical cables.',
            'Monitor weather radio for evacuation orders.'
        ]
    },
    { id: 'earthquake', title: 'Earthquake', category: 'Disaster', icon: Wind, color: 'bg-amber-900', priority: 'Critical', steps: ['Drop to hands and knees.', 'Cover head and neck under a sturdy table/desk.', 'Hold on until the shaking stops.', 'If outside, move away from buildings and glass.', 'Do not use elevators during or after the quake.'] },
    { id: 'gas-leak', title: 'Large Gas Leak', category: 'Disaster', icon: AlertTriangle, color: 'bg-red-800', priority: 'Critical', steps: ['Do not turn on/off any lights or appliances.', 'Do not use phones or lighters inside the building.', 'Open all windows and doors quickly.', 'Evacuate everyone and call SNGPL (1199).', 'Shut off main gas supply valve if safe to do so.'] },
    { id: 'electrical-fire', title: 'Electrical Fire', category: 'Disaster', icon: Zap, color: 'bg-amber-800', priority: 'Critical', steps: ['Do not use water on an electrical fire.', 'Unplug the device or switch off the main breaker.', 'Use a Class C or Multi-purpose fire extinguisher.', 'If small, use baking soda to smother the flame.', 'Evacuate and call 16 (Fire Brigade) if uncontrolled.'] },
    { id: 'building-collapse', title: 'Structural Fail', category: 'Disaster', icon: ShieldAlert, color: 'bg-slate-800', priority: 'Critical', steps: ['Move away from the building if possible.', 'If trapped: Stay calm and cover your face/nose.', 'Tap on pipes/walls so rescuers can hear you.', 'Use a whistle if available; shout only as last resort.', 'Avoid unnecessary movement to conserve oxygen.'] },
    { id: 'chemical-spill', title: 'Toxic Spill', category: 'Disaster', icon: Droplets, color: 'bg-yellow-900', priority: 'High', steps: ['Evacuate the area upwind (wind at your back).', 'Do not touch, walk through, or smell the spill.', 'If on skin: Wash with water for 15-20 mins.', 'Identify the substance from placards if safe.', 'Notify Environmental Protection Agency (EPA).'] },
    { id: 'severe-storm', title: 'Severe Wind/Storm', category: 'Disaster', icon: Wind, color: 'bg-slate-500', priority: 'Medium', steps: ['Move to an interior room on the lowest floor.', 'Stay away from windows and glass doors.', 'Charge mobile devices and power banks.', 'Secure loose outdoor items (chairs, pots).', 'Avoid using landlines during lightning.'] }
];


const CATEGORIES = ['All', 'Medical', 'Personal Safety', 'Animal Welfare', 'Disaster'];

const QUICK_TIPS = [
    "Keep 1122 on speed dial.",
    "Store 5 liters of water per person for floods.",
    "Do not use elevators during earthquakes.",
    "Identify your nearest emergency ward.",
    "Learn how to shut off main gas valves.",
    "Keep a printed directory of neighbors.",
    "Maintain a basic first-aid kit at home.",
    "Check expiry dates of medicines monthly.",
    "Learn basic sign language for emergencies.",
    "Keep power banks charged during storms.",
    "Avoid standing under trees in lightning.",
    "Know your blood group and keep it in wallet.",
    "Keep important documents in a waterproof bag.",
    "Learn to apply a tourniquet correctly.",
    "Identify emergency exits in public spaces.",
    "Check on elderly neighbors during heatwaves.",
    "Don't share unverified news during crises.",
    "Practice family evacuation drills.",
    "Keep a whistle in your emergency kit.",
    "Stay hydrated with ORS during summer."
];

export default function EmergencyHub() {
    const [selectedGuide, setSelectedGuide] = useState(guides[0]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const { highVisibility } = useApp();

    const handleSpeak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            if (isSpeaking) {
                setIsSpeaking(false);
                return;
            }

            const fullText = `${selectedGuide.title}. Step 1: ${text.join('. Step ')}`;
            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    const filteredGuides = guides.filter(g => {
        const matchesCat = activeCategory === 'All' || g.category === activeCategory;
        const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h2 className="text-5xl font-black italic tracking-tighter">Emergency Hub</h2>
                    <p className="text-slate-500 font-medium">Multan's Critical Response Directory. Seconds count.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search guides..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-slate-900 transition-all"
                        />
                    </div>

                    <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {filteredGuides.map((guide) => (
                            <button
                                key={guide.id}
                                onClick={() => setSelectedGuide(guide)}
                                className={`w-full flex items-center p-5 rounded-[2rem] transition-all text-left ${selectedGuide.id === guide.id
                                        ? `${guide.color} text-white shadow-xl scale-[1.02]`
                                        : 'bg-white border border-slate-100 hover:border-slate-300'
                                    }`}
                            >
                                <div className={`p-3 rounded-xl mr-4 ${selectedGuide.id === guide.id ? 'bg-white/20' : guide.color + ' text-white'}`}>
                                    <guide.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-sm leading-tight">{guide.title}</p>
                                    <p className={`text-[10px] font-bold opacity-60 uppercase tracking-tighter ${selectedGuide.id === guide.id ? 'text-white' : 'text-slate-400'}`}>
                                        {guide.category} • {guide.priority}
                                    </p>
                                </div>
                                <ChevronRight className={`w-4 h-4 opacity-40 ${selectedGuide.id === guide.id && 'opacity-100'}`} />
                            </button>
                        ))}
                    </div>

                    <div className="p-6 rounded-[2.5rem] bg-red-600 text-white relative overflow-hidden group shadow-lg shadow-red-100">
                        <Siren className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                        <h4 className="text-lg font-black italic">Rapid SOS</h4>
                        <p className="text-white/80 text-xs mt-1 mb-4 italic leading-snug">Emergency Hotlines Multan</p>
                        <div className="grid grid-cols-2 gap-2">
                            <a href="tel:1122" className="bg-white/20 p-2 rounded-xl text-center text-xs font-black hover:bg-white/30 transition">RESQUE 1122</a>
                            <a href="tel:15" className="bg-white/20 p-2 rounded-xl text-center text-xs font-black hover:bg-white/30 transition">POLICE 15</a>
                            <a href="tel:16" className="bg-white/20 p-2 rounded-xl text-center text-xs font-black hover:bg-white/30 transition">FIRE 16</a>
                            <a href="tel:1043" className="bg-white/20 p-2 rounded-xl text-center text-xs font-black hover:bg-white/30 transition">WOMEN 1043</a>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedGuide.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`rounded-[3.5rem] p-10 md:p-16 flex flex-col space-y-8 min-h-[600px] border shadow-2xl relative overflow-hidden ${highVisibility ? 'bg-white border-black text-black' : 'bg-slate-900 border-slate-800 text-white'
                                }`}
                        >
                            <div className={`absolute top-0 right-0 w-64 h-64 ${selectedGuide.color} opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />

                            <div className="flex items-center space-x-6 relative z-10">
                                <div className={`p-6 rounded-[2rem] ${selectedGuide.color}`}>
                                    <selectedGuide.icon className="w-12 h-12 text-white" />
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedGuide.color} text-white`}>
                                        {selectedGuide.priority} PRIORITY
                                    </span>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <h3 className="text-4xl md:text-6xl font-black italic">{selectedGuide.title}</h3>
                                        <button
                                            onClick={() => handleSpeak(selectedGuide.steps)}
                                            className={`p-4 rounded-2xl transition-all shadow-lg active:scale-95 ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-white text-slate-900 border border-slate-200'
                                                }`}
                                            title="Play Audio Guide"
                                        >
                                            {isSpeaking ? <Square className="w-6 h-6 fill-current text-white" /> : <Volume2 className="w-6 h-6" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 relative z-10">
                                <div className="space-y-8">
                                    <div className="flex items-center space-x-3 opacity-40">
                                        <Info className="w-4 h-4" />
                                        <h4 className="uppercase tracking-[0.2em] font-black text-xs">Action Protocol</h4>
                                    </div>
                                    <div className="flex flex-col space-y-8">
                                        {selectedGuide.steps.map((step, idx) => (
                                            <div key={idx} className="flex space-x-6 group">
                                                <span className={`${selectedGuide.color} text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black flex-shrink-0 shadow-lg`}>
                                                    {idx + 1}
                                                </span>
                                                <p className="font-bold text-xl leading-snug group-hover:translate-x-1 transition-transform">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className={`p-10 rounded-[3rem] border-2 border-dashed flex flex-col items-center text-center space-y-6 ${highVisibility ? 'border-black' : 'border-white/10 bg-white/5'
                                        }`}>
                                        <AlertTriangle className={`w-16 h-16 ${selectedGuide.color.replace('bg-', 'text-')} animate-pulse`} />
                                        <h4 className="text-2xl font-black uppercase tracking-tighter">Immediate Response</h4>
                                        <p className="text-lg font-medium opacity-60 leading-relaxed italic">
                                            In any life-threatening situation, do not wait. Call 1122 and perform the steps as instructed.
                                        </p>
                                        <a
                                            href="tel:1122"
                                            className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-xl hover:scale-105 transition-all text-white ${selectedGuide.color}`}
                                        >
                                            DIAL EMERGENCY 1122
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Quick Tips Section */}
                    <div className="bg-white border rounded-[3rem] p-10">
                        <h3 className="text-2xl font-black mb-8 italic">20 Survival Quick-Tips</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {QUICK_TIPS.map((tip, idx) => (
                                <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="bg-slate-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {idx + 1}
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 leading-tight">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


