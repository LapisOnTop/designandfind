import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { TablesInsert } from "@/integrations/supabase/types";
import { clearProForUser } from "@/services/proService";

export interface AuthSession {
  session: Session | null;
  user: User | null;
}

export const getInitialSession = async (): Promise<AuthSession> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Failed to get Supabase session", error);
    return { session: null, user: null };
  }
  return { session: data.session, user: data.session?.user ?? null };
};

export const signOut = async () => {
  // Get the current user ID before signing out so we can clean up their data
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (userId) {
    clearProForUser(userId);
  }
  // Also clean up legacy global keys from old code
  localStorage.removeItem("pro_sub");
  localStorage.removeItem("pro_sub_expiry");
  localStorage.removeItem("designMatch_plan");
  localStorage.removeItem("designMatch_subSeen");
  await supabase.auth.signOut();
};

const ensureProfile = async (user: User, displayName?: string | null) => {
  const profile: TablesInsert<"profiles"> = {
    user_id: user.id,
    display_name: displayName || user.email || null,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to upsert profile", error);
  }
};

export const signUpWithEmail = async (params: {
  email: string;
  password: string;
  displayName?: string;
}) => {
  const { email, password, displayName } = params;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email },
    },
  });

  if (error) {
    console.error("Signup error:", error);
    if (error.message.includes("Error sending confirmation email") && error.status === 429) {
      throw new Error("Supabase email rate limit reached (3 per hour for free tier). Please configure custom SMTP or try again later.");
    }
    throw error;
  }

  // If email confirmation is required and security settings obscure signups,
  // existing users will return a user object but with an empty identities array.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error("User already registered");
  }

  // When email confirmation is enabled, Supabase returns no session here.
  // Only treat this as an authenticated session when we actually have one.
  if (data.session && data.user) {
    await ensureProfile(data.user, displayName);
    localStorage.setItem(`designMatch_showProAfterLogin_${data.user.id}`, "true");
  }

  return data;
};

export const signInWithPassword = async (params: {
  email: string;
  password: string;
}) => {
  const { email, password } = params;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    await ensureProfile(data.user, null);

    // Only show subscription on first-ever login
    const alreadySeen = localStorage.getItem("designMatch_subSeen");
    if (!alreadySeen) {
      localStorage.setItem(`designMatch_showProAfterLogin_${data.user.id}`, "true");
    }
  }

  return data;
};

export const sendEmailOtp = async (email: string, displayName?: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
    }
  });

  if (error) throw error;
  return data;
};

export const resetPasswordForEmail = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return data;
};

export const updateUserPassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
};

export const verifyEmailOtp = async (email: string, token: string, displayName?: string, type: any = 'email') => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type
  });

  if (error) throw error;

  if (data.session && data.user) {
    await ensureProfile(data.user, displayName);

    // Only show subscription on first-ever login
    const alreadySeen = localStorage.getItem("designMatch_subSeen");
    if (!alreadySeen) {
      localStorage.setItem(`designMatch_showProAfterLogin_${data.user.id}`, "true");
    }
  }

  return data;
};

export const resendSignupOtp = async (email: string) => {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  if (error) throw error;
  return data;
};

