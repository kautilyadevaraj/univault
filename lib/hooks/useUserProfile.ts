"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/user-service";

const supabase = createClient();

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires on initial load and any time auth state changes.
    // This is the single source of truth for user session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // If a user is logged in, fetch their profile
        const { data: userProfile } = await supabase
          .from("User")
          .select("*")
          .eq("authId", currentUser.id)
          .single();
        setProfile(userProfile);
      } else {
        // If no user, clear the profile
        setProfile(null);
      }

      // Once session and profile are handled, loading is complete.
      setLoading(false);
    });

    // Unsubscribe from the listener when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
