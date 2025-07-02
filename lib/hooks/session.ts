"use client";

import { useEffect, useState } from "react";

export function useSession() {
  const [session, setSession] = useState<{
    isAuthenticated: boolean;
    user?: { userId: string; email: string; role: string };
  } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession(data);
    };

      fetchSession();
  }, []);

  return session;
}