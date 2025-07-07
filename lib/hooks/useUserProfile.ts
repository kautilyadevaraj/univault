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
    const getProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);

          // Fetch user profile from your custom Users table
          const { data: userProfile } = await supabase
            .from("User")
            .select("*")
            .eq("authId", session.user.id)
            .single();

          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);

        // Fetch user profile
        const { data: userProfile } = await supabase
          .from("User")
          .select("*")
          .eq("authId", session.user.id)
          .single();

        setProfile(userProfile);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
}
