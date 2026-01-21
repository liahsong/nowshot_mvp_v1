// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("pending");
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (currentUser) => {
    const userId = currentUser?.id;
    if (!userId) {
      setRole("pending");
      setOnboardingCompleted(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Profile fetch error:", error);
    }

    if (data?.role && data.role !== "pending") {
      setRole(data.role ?? "pending");
      setOnboardingCompleted(Boolean(data.onboarding_completed));
      return;
    }

    const { data: ownerProfile } = await supabase
      .from("owner_profiles")
      .select("onboarding_completed, profile_completed")
      .eq("user_id", userId)
      .maybeSingle();

    if (ownerProfile) {
      setRole("owner");
      setOnboardingCompleted(
        Boolean(
          ownerProfile.onboarding_completed ?? ownerProfile.profile_completed
        )
      );
      await supabase.from("profiles").upsert(
        {
          id: userId,
          email: currentUser?.email ?? null,
          role: "owner",
          onboarding_completed: Boolean(
            ownerProfile.onboarding_completed ?? ownerProfile.profile_completed
          ),
          updated_at: new Date(),
        },
        { onConflict: "id" }
      );
      return;
    }

    const { data: baristaProfile } = await supabase
      .from("barista_profiles")
      .select("profile_completed")
      .eq("user_id", userId)
      .maybeSingle();

    if (baristaProfile) {
      setRole("barista");
      setOnboardingCompleted(Boolean(baristaProfile.profile_completed));
      await supabase.from("profiles").upsert(
        {
          id: userId,
          email: currentUser?.email ?? null,
          role: "barista",
          onboarding_completed: Boolean(baristaProfile.profile_completed),
          updated_at: new Date(),
        },
        { onConflict: "id" }
      );
      return;
    }

    setRole("pending");
    setOnboardingCompleted(false);
  };

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          console.error("Session error:", error);
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchUserProfile(currentUser);
        } else {
          setRole("pending");
          setOnboardingCompleted(false);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchUserProfile(currentUser);
      } else {
        setRole("pending");
        setOnboardingCompleted(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        onboardingCompleted,
        loading,
        refetchProfile: () => fetchUserProfile(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
