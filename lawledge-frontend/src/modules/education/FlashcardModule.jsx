import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share2, Download, Search, Volume2, Square, Bookmark, BookmarkCheck, BookOpen, Heart, ShieldAlert, Award, ArrowRight, Activity, Users, FileText } from 'lucide-react';
import { toPng } from 'html-to-image';
// import { auth } from '../../services/firebase'; // Service missing, commented out to allow build

const flashcards = [
    // --- CONSTITUTIONAL RIGHTS (20+ Items) ---
    { id: 1, title: "Article 8: Laws & Rights", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Any law inconsistent with Fundamental Rights is void. The State cannot make laws that bridge these rights.", color: "bg-blue-500" },
    { id: 2, title: "Article 9: Security of Person", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "No person shall be deprived of life or liberty save in accordance with law.", color: "bg-blue-500" },
    { id: 3, title: "Article 10: Arrest Safeguards", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Every arrested person must be informed of the grounds for arrest and produced before a magistrate within 24 hours.", color: "bg-blue-500" },
    { id: 4, title: "Article 10A: Fair Trial", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "For the determination of civil rights and obligations or in any criminal charge, a person shall be entitled to a fair trial and due process.", color: "bg-blue-500" },
    { id: 5, title: "Article 11: No Slavery", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Slavery is forbidden. All forms of forced labor and child labor in factories or mines are prohibited.", color: "bg-blue-500" },
    { id: 6, title: "Article 12: Retrospective Punishment", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "No person shall be punished for an act that was not a crime at the time it was committed.", color: "bg-blue-500" },
    { id: 7, title: "Article 13: Double Jeopardy", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "No person shall be prosecuted or punished for the same offence more than once.", color: "bg-blue-500" },
    { id: 8, title: "Article 14: Dignity of Man", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "The dignity of man and, subject to law, the privacy of home, shall be inviolable. No torture for extracting evidence.", color: "bg-blue-500" },
    { id: 9, title: "Article 15: Freedom of Movement", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Every citizen has the right to remain in, and, subject to any reasonable restriction, move freely throughout Pakistan.", color: "bg-blue-500" },
    { id: 10, title: "Article 16: Freedom of Assembly", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Every citizen has the right to assemble peacefully and without arms, subject to reasonable restrictions.", color: "bg-blue-500" },
    { id: 11, title: "Article 17: Freedom of Association", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Every citizen has the right to form associations or unions, and to form or be a member of a political party.", color: "bg-blue-500" },
    { id: 12, title: "Article 18: Freedom of Trade", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Every citizen has the right to enter upon any lawful profession or occupation, and to conduct any lawful trade.", color: "bg-blue-500" },
    { id: 13, title: "Article 19: Freedom of Speech", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Every citizen shall have the right to freedom of speech and expression, and there shall be freedom of the press.", color: "bg-blue-500" },
    { id: 14, title: "Article 19A: Right to Information", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Every citizen shall have the right to have access to information in all matters of public importance.", color: "bg-blue-500" },
    { id: 15, title: "Article 20: Religious Freedom", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Every citizen has the right to profess, practice and propagate his religion and every religious denomination.", color: "bg-blue-500" },
    { id: 16, title: "Article 21: Religious Taxation", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "No person shall be compelled to pay any special tax the proceeds of which are to be spent on any religion other than his own.", color: "bg-blue-500" },
    { id: 17, title: "Article 22: Education Safeguards", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "No person attending any educational institution shall be required to receive religious instruction not his own.", color: "bg-blue-500" },
    { id: 18, title: "Article 23: Property Rights", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "Every citizen has the right to acquire, hold and dispose of property in any part of Pakistan.", color: "bg-blue-500" },
    { id: 19, title: "Article 24: Protection of Property", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "No person shall be deprived of his property save in accordance with law.", color: "bg-blue-500" },
    { id: 20, title: "Article 25: Equality of Citizens", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "All citizens are equal before law and are entitled to equal protection of law. No discrimination on basis of sex.", color: "bg-blue-500" },
    { id: 21, title: "Article 25A: Right to Education", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "The State shall provide free and compulsory education to all children of the age of five to sixteen years.", color: "bg-blue-500" },
    { id: 22, title: "Article 26: Public Access", category: "Constitutional Rights", reference: "Constitution of Pakistan", description: "No discrimination in respect of access to public places like parks, museums, or restaurants.", color: "bg-blue-500" },

    // --- ANIMAL WELFARE (Expanded) ---
    { id: 23, title: "Section 3: Cruelty Penalties", category: "Animal Welfare", reference: "PCA Act 1890", description: "Punishment for overworking, beating, or treating any animal in a manner causing unnecessary pain.", color: "bg-emerald-500" },
    { id: 24, title: "Section 4: Phooka/Doom Dev", category: "Animal Welfare", reference: "PCA Act 1890", description: "Prohibits the practice of 'phooka' or 'doom dev' on cows or other milch animals. High penalties and fines apply.", color: "bg-emerald-500" },
    { id: 25, title: "Section 5: Unnecessary Cruelty", category: "Animal Welfare", reference: "PCA Act 1890", description: "Whoever kills any animal with unnecessary cruelty shall be punished with a fine or imprisonment.", color: "bg-emerald-500" },
    { id: 26, title: "Section 6: Unfit for Work", category: "Animal Welfare", reference: "PCA Act 1890", description: "Using animals that are old, diseased, or injured for work is a punishable offense.", color: "bg-emerald-500" },
    { id: 27, title: "Section 7: Abandonment", category: "Animal Welfare", reference: "PCA Act 1890", description: "Abandoning any animal in circumstances which render it likely that it will suffer pain by reason of starvation or thirst.", color: "bg-emerald-500" },
    { id: 28, title: "Section 8: Failure to Feed", category: "Animal Welfare", reference: "PCA Act 1890", description: "Owners must provide adequate food, water, and shelter. Failure to do so is considered neglect and cruelty.", color: "bg-emerald-500" },
    { id: 29, title: "Section 9: Overloading", category: "Animal Welfare", reference: "PCA Act 1890", description: "Setting specific limits for loads on donkeys, horses, and bullocks to prevent structural injury.", color: "bg-emerald-500" },
    { id: 80, title: "Halal Slaughter Rules", category: "Animal Welfare", reference: "LPA 2016", description: "Animals must not see other animals being slaughtered. Knife must be sharp, and animal must be calm and unstressed.", color: "bg-emerald-500" },
    { id: 81, title: "Pet Shop Standards", category: "Animal Welfare", reference: "Local Govt Act", description: "Pet shops must provide minimum square footage per animal and climate control. No sale of underage kittens/puppies.", color: "bg-emerald-500" },
    { id: 82, title: "Right to Water", category: "Animal Welfare", reference: "Five Freedoms", description: "Freedom from thirst and hunger. Every domestic animal has the right to access clean water 24/7.", color: "bg-emerald-500" },

    // --- LABOR & WORKER RIGHTS ---
    { id: 70, title: "Minimum Wage", category: "Labor Rights", reference: "Minimum Wage Act", description: "Every worker is entitled to the minimum wage set by the provincial government. Employers cannot pay less.", color: "bg-indigo-600" },
    { id: 71, title: "Working Hours", category: "Labor Rights", reference: "Factories Act 1934", description: "Standard working hours are 8 hours/day or 48 hours/week. Anything beyond is overtime and must be paid 2x.", color: "bg-indigo-600" },
    { id: 72, title: "Maternity Leave", category: "Labor Rights", reference: "Maternity Benefit Act", description: "Female employees are entitled to 12 weeks of fully paid maternity leave before and after birth.", color: "bg-indigo-600" },
    { id: 73, title: "Safe Workplace", category: "Labor Rights", reference: "OSH Act", description: "Employers must provide safety gear and a healthy environment to prevent work-related injuries or diseases.", color: "bg-indigo-600" },

    // --- DIGITAL & PRIVACY RIGHTS ---
    { id: 75, title: "Data Privacy", category: "Digital Rights", reference: "PECA 2016", description: "Unauthorized access to data or sharing private information without consent is a criminal offense.", color: "bg-slate-800" },
    { id: 76, title: "Cyberstalking", category: "Digital Rights", reference: "PECA Section 24", description: "Harassment or stalking via digital means carries up to 3 years imprisonment or massive fines.", color: "bg-slate-800" },

    // --- ENVIRONMENTAL PROTECTION ---
    { id: 78, title: "Clean Air Right", category: "Environmental", reference: "PEPA 1997", description: "The right to live in an environment free from pollution. Industrial emissions are strictly regulated.", color: "bg-emerald-600" },
    { id: 79, title: "Anti-Littering", category: "Environmental", reference: "Local Govt By-laws", description: "Throwing waste in public spaces or canals in Multan is a fineable offense.", color: "bg-emerald-600" },

    // --- CRIMINAL LAW HIGHLIGHTS ---
    { id: 43, title: "PPC 290: Public Nuisance", category: "Criminal Law", reference: "PPC 1860", description: "Whoever commits a public nuisance in any case not otherwise punishable by this Code, shall be punished with fine.", color: "bg-red-500" },
    { id: 44, title: "PPC 509: Harassment", category: "Criminal Law", reference: "PPC 1860", description: "Insulting modesty of a woman or cause sexual harassment. Punishable by up to 3 years imprisonment.", color: "bg-red-500" },
    { id: 45, title: "PPC 377: Unnatural Offenses", category: "Criminal Law", reference: "PPC 1860", description: "Strict penalties for carnal intercourse against the order of nature with any man, woman or animal.", color: "bg-red-500" },
    { id: 46, title: "PPC 188: Disobedience", category: "Criminal Law", reference: "PPC 1860", description: "Disobedience to order duly promulgated by public servant causing obstruction, annoyance or injury.", color: "bg-red-500" },

    // --- CONSUMER RIGHTS ---
    { id: 47, title: "Section 13: Receipt", category: "Consumer Rights", reference: "CP Act 2005", description: "Every seller shall provide a receipt for any purchase. Failure to do so is a punishable offense.", color: "bg-orange-500" },
    { id: 48, title: "Section 15: Return Policy", category: "Consumer Rights", reference: "CP Act 2005", description: "Consumers have the right to return defective products or those not matching the sample within 15 days.", color: "bg-orange-500" },
    { id: 49, title: "Section 11: Disclosure", category: "Consumer Rights", reference: "CP Act 2005", description: "A manufacturer must disclose the date of manufacture, ingredients, and expiry for all consumable products.", color: "bg-orange-500" },
    { id: 50, title: "Section 19: Unfair Practice", category: "Consumer Rights", reference: "CP Act 2005", description: "Prohibits misleading advertisements and false representations of product quality or origins.", color: "bg-orange-500" },
    { id: 51, title: "Section 21: Services", category: "Consumer Rights", reference: "CP Act 2005", description: "A provider of services is liable for any injury/damage caused due to faulty or negligent service delivery.", color: "bg-orange-500" },
    { id: 52, title: "Section 32: Fines", category: "Consumer Rights", reference: "CP Act 2005", description: "The Consumer Court can impose fines of up to 100,000 PKR and 2 years imprisonment for non-compliance.", color: "bg-orange-500" }
];

const quizQuestions = [
    {
        question: "Which Constitutional Article guarantees the 'Right to Education' for children aged 5-16?",
        options: ["Article 25A", "Article 19", "Article 10", "Article 8"],
        correctIndex: 0,
        hint: "It was added via the 18th Amendment."
    },
    {
        question: "Under the PCA Act 1890, what is the penalty for unnecessary cruelty to animals?",
        options: ["Fine only", "Imprisonment only", "Fine and/or Imprisonment", "No penalty"],
        correctIndex: 2,
        hint: "Check Section 3 and 5 of the Act."
    },
    {
        question: "Every citizen has the right to access information in matters of public importance under which Article?",
        options: ["Article 15", "Article 19A", "Article 24", "Article 14"],
        correctIndex: 1,
        hint: "Think 'Right to Information' (RTI)."
    },
    {
        question: "In consumer law, how many days does a consumer have to return a defective product?",
        options: ["7 Days", "15 Days", "30 Days", "60 Days"],
        correctIndex: 1,
        hint: "Section 15 of the Consumer Protection Act."
    },
    {
        question: "Which Law protects animals from being used for work when old, diseased, or injured?",
        options: ["Section 3", "Section 6", "Section 9", "Section 12"],
        correctIndex: 1,
        hint: "It specifically addresses 'unfit for work'."
    }
];

export default function FlashcardModule() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [viewMode, setViewMode] = useState('library');
    const [speakingId, setSpeakingId] = useState(null);
    const [bookmarks, setBookmarks] = useState(() => {
        const saved = localStorage.getItem('lawledge_bookmarks');
        return saved ? JSON.parse(saved) : [];
    });

    const [quizIndex, setQuizIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState([]);
    const [showCertificate, setShowCertificate] = useState(false);

    const toggleBookmark = (id) => {
        const newBookmarks = bookmarks.includes(id)
            ? bookmarks.filter(b => b !== id)
            : [...bookmarks, id];
        setBookmarks(newBookmarks);
        localStorage.setItem('lawledge_bookmarks', JSON.stringify(newBookmarks));
    };

    const speak = (id, text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            if (speakingId === id) {
                setSpeakingId(null);
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => setSpeakingId(null);
            utterance.onerror = () => setSpeakingId(null);
            setSpeakingId(id);
            window.speechSynthesis.speak(utterance);
        }
    };

    const categories = ["All", "Constitutional Rights", "Animal Welfare", "Criminal Law", "Consumer Rights", "Labor Rights", "Digital Rights", "Bookmarked"];

    const filteredCards = flashcards.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === "All"
            ? true
            : activeCategory === "Bookmarked"
                ? bookmarks.includes(c.id)
                : c.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const downloadCard = async (cardId) => {
        const cardElement = document.getElementById(`card-${cardId}`);
        if (!cardElement) return;
        try {
            const dataUrl = await toPng(cardElement, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `Lawledge_Right_${cardId}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download image', err);
        }
    };

    const shareCard = (card) => {
        const text = `Check out this legal right from Lawledge: ${card.title} - ${card.reference}`;
        if (navigator.share) {
            navigator.share({ title: 'Lawledge Legal Literacy', text, url: window.location.href });
        } else {
            navigator.clipboard.writeText(`${text} ${window.location.href}`);
        }
    };

    return (
        <div className="space-y-12 pb-24">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="space-y-2">
                    <h2 className="text-5xl font-black italic tracking-tighter leading-none">The Civic Shield</h2>
                    <p className="text-slate-500 font-medium text-lg">Browse {flashcards.length} essential laws and animal welfare protections.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="flex bg-slate-900/5 p-1.5 rounded-[1.5rem] self-start lg:self-auto">
                        {[
                            { id: 'library', icon: BookOpen, label: 'Library' },
                            { id: 'quiz', icon: FileText, label: 'Quiz' },
                            { id: 'explorer', icon: ShieldAlert, label: 'Explorer' }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setViewMode(mode.id)}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${viewMode === mode.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <mode.icon className="w-4 h-4" />
                                <span>{mode.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search legal articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-12 pr-6 py-4 border-2 border-slate-100 bg-white rounded-2xl focus:ring-4 focus:ring-amber-100 outline-none transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {viewMode === 'library' && (
                <>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest border-2 transition-all ${activeCategory === cat ? 'bg-amber-400 border-amber-400 text-slate-900' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredCards.map((card, idx) => (
                                <motion.div
                                    layout
                                    key={card.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    id={`card-${card.id}`}
                                    className={`group relative overflow-hidden rounded-[3rem] p-10 text-white flex flex-col justify-between aspect-square shadow-xl hover:shadow-2xl transition-all ${card.color}`}
                                >
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start">
                                            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                {card.category}
                                            </span>
                                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => speak(card.id, card.description)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                                    {speakingId === card.id ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => toggleBookmark(card.id)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                                    {bookmarks.includes(card.id) ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => shareCard(card)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => downloadCard(card.id)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-3xl font-black leading-tight group-hover:translate-x-2 transition-transform duration-300 italic tracking-tighter">
                                            {card.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-lg font-medium leading-relaxed italic opacity-90">
                                            "{card.description}"
                                        </p>
                                        <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase opacity-60">Legal Reference</p>
                                                <p className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">{card.reference}</p>
                                            </div>
                                            <div className="text-[8px] font-black opacity-30 italic">LAWLEDGE.PK/SHIELD</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </>
            )}

            {viewMode === 'quiz' && (
                <div className="max-w-4xl mx-auto px-4 sm:px-0">
                    <AnimatePresence mode="wait">
                        {!showScore ? (
                            <motion.div
                                key={`q-${quizIndex}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white border border-slate-100 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-20 text-center space-y-8 md:space-y-12 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-amber-400 opacity-10 rounded-full blur-[80px]" />

                                <div className="space-y-4 md:space-y-6 relative z-10">
                                    <div className="flex justify-center items-center space-x-1.5 md:space-x-2">
                                        {quizQuestions.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 md:h-1.5 rounded-full transition-all duration-500 ${i === quizIndex ? 'w-6 md:w-8 bg-amber-400' : i < quizIndex ? 'w-3 md:w-4 bg-slate-200' : 'w-3 md:w-4 bg-slate-100'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Knowledge Check • Question {quizIndex + 1} of {quizQuestions.length}</p>
                                        <h3 className="text-2xl md:text-5xl font-black italic tracking-tighter leading-tight max-w-2xl mx-auto px-2">
                                            {quizQuestions[quizIndex].question}
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative z-10">
                                    {quizQuestions[quizIndex].options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                const isCorrect = i === quizQuestions[quizIndex].correctIndex;
                                                if (isCorrect) setScore(s => s + 1);
                                                setQuizAnswers([...quizAnswers, i]);

                                                if (quizIndex < quizQuestions.length - 1) {
                                                    setQuizIndex(i => i + 1);
                                                } else {
                                                    setShowScore(true);
                                                }
                                            }}
                                            className="group relative w-full p-4 md:p-6 text-left border-2 border-slate-50 bg-slate-50 rounded-2xl md:rounded-3xl font-black text-slate-700 hover:border-amber-400 hover:bg-white transition-all transform active:scale-95 md:hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center space-x-3 md:space-x-4">
                                                <span className="shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-[10px] md:text-xs group-hover:border-amber-400">
                                                    {String.fromCharCode(65 + i)}
                                                </span>
                                                <span className="text-sm md:text-base leading-tight">{opt}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-6 md:pt-8 border-t border-slate-100 relative z-10">
                                    <button
                                        disabled={quizIndex === 0}
                                        onClick={() => setQuizIndex(i => i - 1)}
                                        className="flex items-center space-x-2 text-[10px] md:text-sm font-black text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-opacity"
                                    >
                                        <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                                        <span>BACK</span>
                                    </button>
                                    <p className="text-[8px] md:text-[10px] font-black opacity-30 italic">LAWLEDGE.PK/QUIZ</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white border border-slate-100 rounded-[3rem] md:rounded-[4rem] p-8 md:p-20 text-center space-y-10 md:space-y-12 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-amber-400 opacity-5 pointer-events-none" />

                                <div className="space-y-8 md:space-y-10 py-6 md:py-10 relative z-10">
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-amber-400 rounded-full flex items-center justify-center mx-auto text-slate-900 shadow-xl shadow-amber-400/30">
                                        <Award className="w-12 h-12 md:w-16 md:h-16" />
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        <h3 className="text-4xl md:text-7xl font-black italic tracking-tighter">
                                            {score === quizQuestions.length ? 'Master Citizen!' : score >= 3 ? 'Civic Scholar!' : 'Knowledge Seeker!'}
                                        </h3>
                                        <p className="text-slate-500 font-medium text-lg md:text-xl max-w-md mx-auto leading-relaxed">
                                            You scored <span className="text-slate-900 font-black">{score}/{quizQuestions.length}</span>.
                                            {score === quizQuestions.length
                                                ? ' Your knowledge of Pakistani law is exemplary.'
                                                : score >= 3
                                                    ? ' Great job! You have a solid grasp of civic duties.'
                                                    : ' A good start. Continue browsing the shield to improve.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                                        <button
                                            onClick={() => setShowCertificate(true)}
                                            className="px-8 md:px-10 py-4 md:py-5 bg-amber-400 text-slate-900 rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center space-x-3 active:scale-95"
                                        >
                                            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            <span>GET CERTIFICATE</span>
                                        </button>
                                        <button
                                            onClick={() => { setQuizIndex(0); setScore(0); setShowScore(false); setQuizAnswers([]); }}
                                            className="px-8 md:px-10 py-4 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest hover:shadow-xl transition-all active:scale-95"
                                        >
                                            RESTART
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {showCertificate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCertificate(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] md:rounded-[3rem] p-4 md:p-10 space-y-6 md:space-y-10 overflow-hidden"
                        >
                            <div className="max-h-[70vh] overflow-y-auto md:overflow-visible custom-scrollbar">
                                <div id="quiz-certificate" className="relative p-6 md:p-16 border-[12px] md:border-[20px] border-amber-400 bg-white text-center space-y-6 md:space-y-10 min-w-[300px]">
                                    <div className="absolute top-6 right-6 md:top-10 md:right-10 w-24 h-24 md:w-40 md:h-40 opacity-[0.05] pointer-events-none">
                                        <Award className="w-full h-full text-slate-900" />
                                    </div>

                                    <div className="space-y-2 md:space-y-4">
                                        <h1 className="text-sm md:text-2xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-amber-600">Civic Literacy Certificate</h1>
                                        <div className="w-20 md:w-32 h-0.5 md:h-1 bg-amber-400 mx-auto" />
                                    </div>

                                    <div className="space-y-6 md:space-y-8">
                                        <p className="text-base md:text-xl font-medium text-slate-400 italic">This digital badge recognizes the proficiency of</p>
                                        <h2 className="text-3xl md:text-7xl font-black italic tracking-tighter text-slate-900 break-words px-4">
                                            Lawledge Citizen
                                        </h2>
                                        <div className="max-w-2xl mx-auto space-y-4 px-2">
                                            <p className="text-sm md:text-lg text-slate-700 leading-relaxed font-medium">
                                                {score === quizQuestions.length
                                                    ? `For demonstrating exceptional legal mastery by achieving an outstanding performance score of 100%. This individual exhibits total command over the Constitutional and Animal Welfare laws of Pakistan.`
                                                    : score >= 3
                                                        ? `For successfully completing the Civic Literacy Challenge with credit, achieving a performance score of ${(score / quizQuestions.length) * 100}%. This individual demonstrated proficient understanding of public rights and civic duties.`
                                                        : `For completing the Civic Literacy Introductory Challenge. This individual is actively engaged in learning about Pakistani law and social responsibility.`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0 pt-6 md:pt-10 border-t border-slate-50">
                                        <div className="text-center md:text-left space-y-1">
                                            <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-300">Level Achieved</p>
                                            <p className="text-xl md:text-3xl font-black italic">
                                                {score === quizQuestions.length ? 'PLATINUM' : score >= 3 ? 'GOLD' : 'SILVER'}
                                            </p>
                                        </div>
                                        <div className="space-y-1 md:space-y-2 order-first md:order-none">
                                            <div className="w-24 md:w-32 h-0.5 bg-slate-900/10 mx-auto" />
                                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Digital Accreditation</p>
                                            <p className="text-[7px] md:text-[8px] font-black opacity-20 italic">LAWLEDGE.PK/VERIFIED</p>
                                        </div>
                                        <div className="text-center md:text-right space-y-1">
                                            <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-300">Date Issued</p>
                                            <p className="text-base md:text-xl font-black">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 relative z-20">
                                <button
                                    onClick={() => setShowCertificate(false)}
                                    className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    CLOSE
                                </button>
                                <button
                                    onClick={async () => {
                                        const el = document.getElementById('quiz-certificate');
                                        if (el) {
                                            const dataUrl = await toPng(el, {
                                                pixelRatio: 3,
                                                backgroundColor: '#ffffff',
                                                style: {
                                                    borderRadius: '0'
                                                }
                                            });
                                            const link = document.createElement('a');
                                            link.download = 'Lawledge_Certificate.png';
                                            link.href = dataUrl;
                                            link.click();
                                        }
                                    }}
                                    className="flex-1 py-4 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:shadow-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98]"
                                >
                                    DOWNLOAD HIGH-RES CERTIFICATE
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {viewMode === 'explorer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { title: "I'm being arrested", tasks: ["Request identification", "Call a lawyer", "Don't sign anything yet"], icon: ShieldAlert, color: 'bg-red-50 text-red-600' },
                        { title: "Found Injured Animal", tasks: ["Safe distance", "Call rescue NGO", "Provide basic first aid"], icon: Heart, color: 'bg-emerald-50 text-emerald-600' },
                        { title: "Defective Product", tasks: ["Keep receipt", "Document fault", "File Consumer complaint"], icon: FileText, color: 'bg-amber-50 text-amber-600' },
                        { title: "Harassment Incident", tasks: ["Find safe spot", "Call HELP 15", "Document evidence"], icon: Users, color: 'bg-indigo-50 text-indigo-600' },
                        { title: "Traffic Collision", tasks: ["Don't flee", "Exchange info", "Call traffic police"], icon: Activity, color: 'bg-blue-50 text-blue-600' },
                    ].map((pkg, i) => (
                        <div key={i} className={`p-10 rounded-[3.5rem] space-y-8 border border-white hover:scale-105 transition-all shadow-xl ${pkg.color}`}>
                            <div className="flex justify-between items-center">
                                <pkg.icon className="w-10 h-10" />
                                <ArrowRight className="w-5 h-5 opacity-40" />
                            </div>
                            <h3 className="text-2xl font-black italic tracking-tighter leading-tight">{pkg.title}</h3>
                            <div className="space-y-3">
                                {pkg.tasks.map((t, idx) => (
                                    <div key={idx} className="flex items-center space-x-3 text-xs font-black uppercase tracking-widest opacity-70">
                                        <div className="w-1.5 h-1.5 bg-current rounded-full" />
                                        <span>{t}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full py-4 bg-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm">
                                View Detailed Checklist
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {filteredCards.length === 0 && viewMode === 'library' && (
                <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">No matching rights found</p>
                    <button onClick={() => { setSearchTerm(""); setActiveCategory("All"); }} className="mt-4 text-slate-900 font-black border-b-2 border-slate-900">
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
}
