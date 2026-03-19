import { motion } from "framer-motion";
import { User, ShieldCheck, LogOut, ChevronRight, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhoneFrame from "@/components/PhoneFrame";
import { useAuth } from "@/contexts/AuthContext";
import { isProUser } from "@/services/proService";
import { supabase } from "@/integrations/supabase/client";
import { Home } from "lucide-react";

const Account = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <PhoneFrame>
            <div className="flex flex-col h-full bg-[#0a0a0a] text-white font-sans relative overflow-hidden">
                {/* Header */}
                <div className="relative z-10 px-6 pt-14 pb-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
                    <h1 className="text-2xl font-bold tracking-tight">Account</h1>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 relative z-10 hide-scrollbar">
                    {/* Profile Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                            <User size={28} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/40 font-medium">Logged in as</p>
                            <p className="text-sm font-bold truncate leading-tight mt-0.5">{user?.email || "Guest User"}</p>
                        </div>
                    </div>

                    {/* Plan Section */}
                    <div className="space-y-3">
                        <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest ml-1">Subscription</h2>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Crown size={18} className={isProUser() ? "text-yellow-400" : "text-white/20"} />
                                    <span className="font-bold">{isProUser() ? "DesignMatch PRO" : "Free Plan"}</span>
                                </div>
                                {isProUser() ? (
                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">Active</span>
                                ) : (
                                    <button onClick={() => navigate("/studio")} className="text-[10px] text-primary font-bold hover:underline">UPGRADE</button>
                                )}
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed">
                                {isProUser()
                                    ? "Enjoy unlimited AI lookups, premium fonts, and high-resolution exports."
                                    : "Upgrade to unlock 4K exports, advanced tools, and AI design placement."}
                            </p>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-2">
                        {[
                            { label: "Design History", icon: ShieldCheck },
                            { label: "Saved Templates", icon: ShieldCheck },
                            { label: "Preferences", icon: ShieldCheck },
                        ].map((item) => (
                            <button key={item.label} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <item.icon size={16} className="text-white/40 group-hover:text-white" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                                <ChevronRight size={14} className="text-white/20" />
                            </button>
                        ))}
                    </div>

                    <button onClick={() => { supabase.auth.signOut(); navigate("/"); }}
                        className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm active:scale-[0.98] transition-all hover:bg-red-500/20 flex items-center justify-center gap-2">
                        <LogOut size={18} /> Log Out
                    </button>
                </div>

                {/* Sync with Landing's Nav */}
                <div className="relative z-20 flex items-center justify-around py-3 pb-6 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl">
                    <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 transition-colors text-white/40">
                        <Home size={20} />
                        <span className="text-[10px] font-medium">Home</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 transition-colors text-primary">
                        <User size={20} />
                        <span className="text-[10px] font-medium">Account</span>
                    </button>
                </div>
            </div>
        </PhoneFrame>
    );
};

export default Account;
