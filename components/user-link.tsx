"use client";

import Link from "next/link";
import { User, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserLinkProps {
  username: string;
  className?: string;
  showIcon?: boolean;
}

export function UserLink({
  username,
  className,
  showIcon = false,
}: UserLinkProps) {
  const isAnonymous = username === "Anonymous";

  const content = (
    <>
      {showIcon && <User className="h-3 w-3" />}
      <span className="truncate">{username}</span>
      {!isAnonymous && <ExternalLink className="h-3 w-3" />}
    </>
  );

  if (isAnonymous) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-muted-foreground cursor-default",
          className
        )}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={`/user/${username}`}
      className={cn(
        "inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors",
        className
      )}
    >
      {content}
    </Link>
  );
}
