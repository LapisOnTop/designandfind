export const isProUser = () => {
  // Check if user has an active pro subscription
  const hasProSub = localStorage.getItem("pro_sub") === "true";
  const subExpiry = localStorage.getItem("pro_sub_expiry");
  
  if (!hasProSub || !subExpiry) return false;
  
  // Check if subscription is still valid (not expired)
  return new Date(subExpiry) > new Date();
};

