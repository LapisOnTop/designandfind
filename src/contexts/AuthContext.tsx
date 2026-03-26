import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getInitialSession, signOut as supabaseSignOut } from "@/services/authService";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout in case getSession hangs
    const timer = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("AuthContext: Force setting loading to false due to timeout");
        setLoading(false);
      }
    }, 1500);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        setLoading(false);
        clearTimeout(timer);
      }
    });

    getInitialSession()
      .then(({ session }) => {
        if (isMounted) {
          setSession(session);
          setLoading(false);
          clearTimeout(timer);
        }
      })
      .catch((err) => {
        console.error("Auth context session fetch error:", err);
        if (isMounted) {
          setLoading(false);
          clearTimeout(timer);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabaseSignOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
