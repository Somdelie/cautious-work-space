"use client";

import { UserButton } from "@clerk/nextjs";

export function AppUserButton() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-8 h-8",
          userButtonPopoverCard: "bg-slate-900 border-slate-800",
          userButtonPopoverActions: "text-slate-100",
          userButtonPopoverActionButton: "text-slate-100 hover:bg-slate-800",
          userButtonPopoverFooter: "hidden",
        },
      }}
      afterSignOutUrl="/sign-in"
    />
  );
}

