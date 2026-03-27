import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the current user's ID from the Supabase session synchronously
 * using a cached approach (reads from localStorage where supabase stores it).
 */
const getCurrentUserId = (): string | null => {
  try {
    // Supabase stores session in localStorage under a predictable key pattern
    const keys = Object.keys(localStorage);
    const sbKey = keys.find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (sbKey) {
      const raw = localStorage.getItem(sbKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.user?.id || null;
      }
    }
  } catch { }
  return null;
};

export const isProUser = (): boolean => {
  const userId = getCurrentUserId();
  if (!userId) return false;

  const hasProSub = localStorage.getItem(`pro_sub_${userId}`) === "true";
  const subExpiry = localStorage.getItem(`pro_sub_expiry_${userId}`);

  if (!hasProSub || !subExpiry) return false;

  // Check if subscription is still valid (not expired)
  return new Date(subExpiry) > new Date();
};

/**
 * Activate Pro subscription for a specific user.
 */
export const activateProForUser = (userId: string, plan: "monthly" | "yearly") => {
  const exp = new Date();
  exp.setMonth(exp.getMonth() + (plan === "monthly" ? 1 : 12));
  localStorage.setItem(`pro_sub_${userId}`, "true");
  localStorage.setItem(`pro_sub_expiry_${userId}`, exp.toISOString());
  localStorage.setItem(`designMatch_plan_${userId}`, plan);
};

/**
 * Clear Pro subscription data for a specific user (used on sign out).
 */
export const clearProForUser = (userId: string) => {
  localStorage.removeItem(`pro_sub_${userId}`);
  localStorage.removeItem(`pro_sub_expiry_${userId}`);
  localStorage.removeItem(`designMatch_plan_${userId}`);
};

/**
 * Get the plan name for the current user.
 */
export const getCurrentPlan = (): string => {
  const userId = getCurrentUserId();
  if (!userId) return "monthly";
  return localStorage.getItem(`designMatch_plan_${userId}`) || "monthly";
};
