import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  authId: string;
  email: string;
  username?: string;
  role: string;
  provider?: string;
  profilePicture?: string;
  createdAt: Date;
  graduatingYear?: number;
  program?: string;
  school?: string;
  yearOfStudy?: number;
  profileVisibility: string;
  showEmail: boolean;
  showSchoolInfo: boolean;
  showGraduationYear: boolean;
  showResourceCount: boolean;
  showContributionScore: boolean;
  bio?: string;
  socialLinks: string[];
}

export async function createOrUpdateUserProfile(
  authUser: User
): Promise<UserProfile | null> {
  const supabase = await createClient();

  try {
    // Check if user already exists in your custom Users table
    const { data: existingUser, error: fetchError } = await supabase
      .from("User")
      .select("*")
      .eq("authId", authUser.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from("User")
        .update({
          email: authUser.email,
          profilePicture: authUser.user_metadata?.avatar_url,
        })
        .eq("authId", authUser.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new user with default MEMBER role
      const username =
        `user_${Date.now()}`;

      const { data, error } = await supabase
        .from("User")
        .insert({
          id: authUser.id,
          authId: authUser.id,
          email: authUser.email!,
          username: username,
          role: "MEMBER", // Default role
          provider: "google",
          profilePicture: authUser.user_metadata?.avatar_url,
          profileVisibility: "PUBLIC",
          showEmail: false,
          showSchoolInfo: true,
          showGraduationYear: true,
          showResourceCount: true,
          showContributionScore: true,
          socialLinks: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    return null;
  }
}

export async function getUserProfile(
  authId: string
): Promise<UserProfile | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("User")
      .select("*")
      .eq("authId", authId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
