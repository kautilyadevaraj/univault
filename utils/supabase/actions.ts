"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { createOrUpdateUserProfile } from "@/lib/user-service";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // ship fast test in prod we validate form later
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.log("Login error:", error);
    // Return error instead of redirecting
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // ship fast test in prod we validate form later
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUpWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      scopes: "email profile",
    },
  });

  if (data.url) {
    redirect(data.url);
  }

  if (error) {
    console.log("Error signing up with Google", error);
    redirect("/error");
  }
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log("Error logging out", error);
    redirect("/error");
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function syncUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Error getting user:", error);
    return null;
  }

  const profile = await createOrUpdateUserProfile(user);
  return profile;
}