import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Crown, PenSquare, Calendar, Search, Home, Clock, Trash2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneFrame from "@/components/PhoneFrame";
import { useAuth } from "@/contexts/AuthContext";
import { isProUser } from "@/services/proService";
import { supabase } from "@/integrations/supabase/client";
import PaymentModal from "@/components/PaymentModal";
import DownloadModal from "@/components/DownloadModal";
import { toast } from "sonner";

const Account = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [designToDelete, setDesignToDelete] = useState<string | null>(null);
    const [designToDownload, setDesignToDownload] = useState<any | null>(null);

    // Profile editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || "Guest User");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [showSubscription, setShowSubscription] = useState(false);

    // Get lookup count
    const [lookupCount, setLookupCount] = useState(0);
    const [weeklyLookups, setWeeklyLookups] = useState(0);
    const [lastReset, setLastReset] = useState(0);

    const [savedDesigns, setSavedDesigns] = useState<any[]>([]);

    useEffect(() => {
        if (!user?.id) return;

        // Fetch real profile
        supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).single().then(({ data }) => {
            if (data) {
                if (data.display_name) setDisplayName(data.display_name);
                if (data.avatar_url) setAvatarUrl(data.avatar_url);
            }
        });

        // Update counts on mount securely keyed to user
        setLookupCount(parseInt(localStorage.getItem(`designMatch_lookupCount_${user.id}`) || "0"));
        setWeeklyLookups(parseInt(localStorage.getItem(`designMatch_lookup_count_week_${user.id}`) || "0"));
        setLastReset(parseInt(localStorage.getItem(`designMatch_lookup_lastReset_${user.id}`) || "0"));

        try {
            const history = JSON.parse(localStorage.getItem(`designMatch_history_${user.id}`) || "[]");
            setSavedDesigns(history);
        } catch (e) { }
    }, [user?.id]);

    const confirmDeleteDesign = () => {
        if (designToDelete && user?.id) {
            const updated = savedDesigns.filter(d => d.id !== designToDelete);
            setSavedDesigns(updated);
            localStorage.setItem(`designMatch_history_${user.id}`, JSON.stringify(updated));
            localStorage.removeItem(`designMatch_saved_${designToDelete}_${user.id}`);
            setDesignToDelete(null);
        }
    };

    const handleSaveName = async () => {
        setIsEditingName(false);
        const newName = displayName.trim() || user?.email?.split('@')[0] || "Guest User";
        setDisplayName(newName);
        if (user?.id) {
            await supabase.from("profiles").upsert({
                user_id: user.id,
                display_name: newName
            }, { onConflict: "user_id" });
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            await supabase.auth.signOut();
            navigate("/");
        }
    };

    const profilePicUrl = avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.id || displayName || "guest"}&backgroundColor=222222&radius=50`;
    const isPro = isProUser();

    // Get plan details from localStorage
    const planType = localStorage.getItem("designMatch_plan") || "monthly";

    // Format date
    const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" }) : "Jan 1, 2024";

    // Calculate next billing date
    const getNextBillingDate = () => {
        if (!isPro) return null;
        const days = planType === 'yearly' ? 365 : 30;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);
        return nextDate.toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" });
    };

    const getDaysUntilReset = () => {
        if (!lastReset) return 0;
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
        const resetTime = lastReset + ONE_WEEK;
        const now = Date.now();
        if (now >= resetTime) return 0;
        return Math.ceil((resetTime - now) / (1000 * 60 * 60 * 24));
    };

    return (
        <PhoneFrame>
            <div className="flex flex-col h-full bg-black text-white font-sans relative overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-12 pb-3 bg-black shrink-0 border-b border-[#222]">
                    <h1 className="text-xl font-bold tracking-tight">Account</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar mb-6">
                    {/* Profile Section */}
                    <section className="space-y-2">
                        <div className="bg-black border border-[#222] rounded-[1.2rem] p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-[#222] flex items-center justify-center shrink-0 overflow-hidden relative">
                                    <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    {isEditingName ? (
                                        <input
                                            ref={nameInputRef}
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            onBlur={handleSaveName}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                            autoFocus
                                            className="bg-[#222] text-white text-base font-bold rounded-md px-2 py-1 w-full outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 group cursor-pointer w-max" onClick={() => setIsEditingName(true)}>
                                            <h2 className="text-base font-bold truncate">{displayName}</h2>
                                            <PenSquare size={14} className="text-[#555] group-hover:text-white transition-colors" />
                                        </div>
                                    )}
                                    <p className="text-sm text-[#888] mt-0.5 truncate">{user?.email || "Not signed in"}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#222] flex items-center gap-2 text-xs text-[#555]">
                                <Calendar size={14} /> Member since {memberSince}
                            </div>
                        </div>
                    </section>

                    {/* Plan Section */}
                    <section className="space-y-2">
                        <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-widest pl-1">Subscription</h2>
                        <div className="bg-black border border-[#222] rounded-[1.2rem] p-4 relative overflow-hidden group transition-all hover:border-primary/30">
                            {isPro && (
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Crown size={64} className="text-yellow-500" />
                                </div>
                            )}
                            <div className="flex flex-col gap-3 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? "bg-yellow-500/10 text-yellow-500" : "bg-[#222] text-[#888]"}`}>
                                        <Crown size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{isPro ? "Pro Plan" : "Free Plan"}</p>
                                        <p className="text-xs text-[#888]">
                                            {isPro
                                                ? (planType === 'yearly' ? 'Yearly Billing' : 'Monthly Billing')
                                                : "Upgrade for unlimited designs"
                                            }
                                        </p>
                                    </div>
                                </div>

                                {isPro && (
                                    <div className="pt-3 border-t border-[#222]">
                                        <p className="text-xs text-[#888]">
                                            Next billing date: <span className="text-white">{getNextBillingDate()}</span>
                                        </p>
                                    </div>
                                )}

                                {!isPro && (
                                    <button
                                        onClick={() => setShowSubscription(true)}
                                        className="w-full text-xs font-bold text-[#0a0a0a] bg-white px-4 py-3 rounded-2xl active:scale-95 shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:bg-[#f0f0f0] transition-colors"
                                    >
                                        Upgrade to Pro
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Stats Dashboard - Lookups */}
                    <section className="space-y-2">
                        <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-widest pl-1">Activity</h2>
                        <div className="bg-black border border-[#222] rounded-[1.2rem] p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#222] text-[#888] flex items-center justify-center">
                                    <Search size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Lookup Limit</span>
                                        <span className="text-[10px] font-bold text-[#888]">
                                            {isPro ? "Unlimited" : `${weeklyLookups} / 1 Used`}
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="h-1.5 w-full bg-[#222] rounded-full mt-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isPro ? 'bg-white w-full' : (weeklyLookups >= 1 ? 'bg-red-500 w-full' : 'bg-white w-0')}`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#555] px-1">
                                <span>Total lifetime: {lookupCount}</span>
                                {!isPro && weeklyLookups >= 1 && (
                                    <span className="text-orange-400">Resets in {getDaysUntilReset()} days</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Saved Designs */}
                    <section className="space-y-2">
                        <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-widest pl-1 flex items-center gap-1.5">
                            <Clock size={12} /> Saved Designs
                        </h2>
                        {savedDesigns.length === 0 ? (
                            <div className="bg-black border border-[#222] rounded-[1.2rem] p-6 flex flex-col items-center justify-center text-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-[#555] mb-2">
                                    <Search size={20} />
                                </div>
                                <p className="text-sm font-bold text-[#888]">No designs saved yet</p>
                                <p className="text-xs text-[#555]">Go to the Studio to create and save your first design.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {savedDesigns.map((design) => (
                                    <div
                                        key={design.id}
                                        onClick={() => navigate(`/studio?loadId=${design.id}&template=${design.templateId || 'tshirt'}`)}
                                        className="bg-black border border-[#222] rounded-xl overflow-hidden group cursor-pointer hover:border-[#444] transition-colors"
                                    >
                                        <div className="aspect-square bg-[#222] relative overflow-hidden">
                                            {design.thumbnail ? (
                                                <img src={design.thumbnail} alt={design.name} className="w-full h-full object-cover blur-sm scale-110 opacity-80" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#555] p-4 text-center text-xs">No thumbnail</div>
                                            )}
                                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDesignToDownload(design); }}
                                                    className="w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white/70 hover:text-blue-400 hover:bg-black/80 transition-all"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDesignToDelete(design.id); }}
                                                    className="w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-black/80 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-bold truncate text-white">{design.name}</p>
                                            <p className="text-[10px] text-[#888] mt-0.5">{design.date || "Unknown date"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>


                    {/* Log Out */}
                    <div className="pt-2 pb-8">
                        <button onClick={() => { supabase.auth.signOut(); navigate("/"); }}
                            className="w-full h-11 rounded-[12px] bg-transparent border border-[#333] text-[#888] font-semibold text-sm active:scale-95 transition-transform hover:text-white hover:border-[#555] flex items-center justify-center gap-2">
                            <LogOut size={16} /> Log Out
                        </button>
                    </div>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="relative z-20 flex shrink-0 items-center justify-around py-3 pb-6 border-t border-[#222] bg-black rounded-b-[2.8rem]">
                    <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 transition-colors text-[#888]">
                        <Home size={20} />
                        <span className="text-[10px] font-medium">Home</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 transition-colors text-white">
                        <User size={20} />
                        <span className="text-[10px] font-medium">Account</span>
                    </button>
                </div>
            </div>

            <PaymentModal open={showSubscription} onClose={() => setShowSubscription(false)} onSuccess={() => { setShowSubscription(false); window.location.reload(); }} />
            <DownloadModal open={!!designToDownload} onClose={() => setDesignToDownload(null)} design={designToDownload} />

            <AnimatePresence>
                {designToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-black border border-[#222] p-6 rounded-2xl w-full max-w-[320px] shadow-2xl flex flex-col gap-4 text-center"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-2">
                                <Trash2 size={20} />
                            </div>
                            <h2 className="text-white text-lg font-bold">Delete Design?</h2>
                            <p className="text-[#888] text-sm">This action cannot be undone. Are you sure you want to permanently delete this design?</p>

                            <div className="flex items-center gap-3 mt-4">
                                <button onClick={() => setDesignToDelete(null)} className="flex-1 py-3 rounded-xl bg-transparent border border-[#333] text-white/70 font-semibold hover:bg-[#111] hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button onClick={confirmDeleteDesign} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold active:scale-95 transition-transform hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PhoneFrame>
    );
};

export default Account;
