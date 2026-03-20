import { useState, useEffect, useRef } from "react";
import { User, LogOut, Crown, PenSquare, Calendar, Search, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhoneFrame from "@/components/PhoneFrame";
import { useAuth } from "@/contexts/AuthContext";
import { isProUser } from "@/services/proService";
import { supabase } from "@/integrations/supabase/client";
import SubscriptionGate from "@/components/SubscriptionGate";

const Account = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Profile editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(localStorage.getItem("designMatch_displayName") || user?.email?.split('@')[0] || "Guest User");
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [showSubscription, setShowSubscription] = useState(false);

    // Get lookup count from localStorage
    const [lookupCount, setLookupCount] = useState(() => {
        return parseInt(localStorage.getItem("designMatch_lookupCount") || "0");
    });

    useEffect(() => {
        // Update lookup count on mount
        const count = parseInt(localStorage.getItem("designMatch_lookupCount") || "0");
        setLookupCount(count);
    }, []);

    const handleSaveName = () => {
        setIsEditingName(false);
        if (displayName.trim() !== "") {
            localStorage.setItem("designMatch_displayName", displayName.trim());
        } else {
            setDisplayName(user?.email?.split('@')[0] || "Guest User");
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            await supabase.auth.signOut();
            navigate("/");
        }
    };

    const initials = displayName.substring(0, 2).toUpperCase();
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

    return (
        <PhoneFrame>
            <div className="flex flex-col h-full bg-[#0a0a0a] text-white font-sans relative overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-12 pb-3 bg-[#0a0a0a] shrink-0 border-b border-[#222]">
                    <h1 className="text-xl font-bold tracking-tight">Account</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar mb-6">
                    {/* Profile Section */}
                    <section className="space-y-2">
                        <div className="bg-[#141414] border border-[#222] rounded-[1.2rem] p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-[#222] flex items-center justify-center text-lg font-bold text-[#888] shrink-0">
                                    {initials}
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
                        <div className="bg-gradient-to-br from-[#141414] to-[#0f0f0f] border border-[#222] rounded-[1.2rem] p-4 relative overflow-hidden group transition-all hover:border-primary/30">
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
                                        className="w-full text-xs font-semibold text-white bg-primary px-4 py-2.5 rounded-full active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                    >
                                        Upgrade to Pro
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Stats Dashboard - Only Lookups */}
                    <section className="space-y-2">
                        <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-widest pl-1">Activity</h2>
                        <div className="bg-[#141414] border border-[#222] rounded-[1.2rem] p-4 flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Search size={18} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Total Lookups</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-white">{lookupCount}</span>
                                        <span className="text-[10px] text-[#555]">searches</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="space-y-2 pt-4">
                        <h2 className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest pl-1">Danger Zone</h2>
                        <button onClick={handleDeleteAccount} className="w-full h-11 rounded-[12px] bg-transparent border border-red-500/20 text-red-500 font-semibold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-red-500/10">
                            <LogOut size={16} /> Delete Account
                        </button>
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
                <div className="relative z-20 flex shrink-0 items-center justify-around py-3 pb-6 border-t border-[#222] bg-[#0a0a0a] rounded-b-[2.8rem]">
                    <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 transition-colors text-[#888]">
                        <Home size={20} />
                        <span className="text-[10px] font-medium">Home</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 transition-colors text-primary">
                        <User size={20} />
                        <span className="text-[10px] font-medium">Account</span>
                    </button>
                </div>
            </div>
            <SubscriptionGate open={showSubscription} onClose={() => setShowSubscription(false)} />
        </PhoneFrame>
    );
};

export default Account;
