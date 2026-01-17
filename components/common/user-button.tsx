"use client";

import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function AppUserButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Skeleton className="w-8 h-8 rounded-full" />;
  }

  const user = session?.user as {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full p-0"
        >
          <Avatar>
            <AvatarImage
              src={user?.image || undefined}
              alt={user?.name || "User"}
            />
            <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
          <p className="text-xs text-gray-400 truncate">
            {user?.email || "No email"}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/sign-in" })}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
