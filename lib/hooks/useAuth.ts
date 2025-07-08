"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout as logoutAction } from "@/utils/supabase/actions";
import { toast } from "sonner";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const logout = async () => {
    try {
      setIsLoading(true);
      const result = await logoutAction();

      if (result?.error) {
        toast.error(result?.error);
        return;
      }

      toast.success("You have been logged out successfully!");

      // Force a hard refresh to ensure all client state is cleared
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An unexpected error occured.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
  };
}
