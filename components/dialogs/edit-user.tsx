"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import type { User } from "../users/users-columns";

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated?: (user: User) => void;
}) {
  const { data: sessionData } = useSession();
  // Type assertion to ensure custom properties are recognized
  const session = sessionData as Session & {
    user: { id: string; role: string };
  };

  const isSuperAdmin = session?.user?.role === "superadmin";
  const isHardcodedAdmin = user?.email === "admin@cautiousndlovu.co.za";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<User["role"]>("user");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Initialize form when user changes OR dialog opens
  useEffect(() => {
    if (!open) return;

    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone((user?.phone as string) || "");
    setRole(user?.role || "user");

    setProfileError("");

    // Reset password flow every time dialog opens or user changes
    setShowPasswordDialog(false);
    setSavingPassword(false);
    setPasswordError("");
    setCode("");
    setNewPassword("");
  }, [user?.id, open]);

  const showWarning = useMemo(() => {
    if (!user) return false;
    const emailChanged = email !== (user.email || "");
    const passwordTyped = newPassword.length > 0;
    return session?.user?.id === user.id && (emailChanged || passwordTyped);
  }, [email, newPassword, session?.user?.id, user]);

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  // Removed handleSendCode, no longer needed

  async function handleSavePassword() {
    if (!user?.id) return;
    if (!isSuperAdmin) {
      setPasswordError("Only admin can change passwords.");
      return;
    }

    setSavingPassword(true);
    setPasswordError("");

    try {
      if (code.trim() !== "19021994") throw new Error("Invalid admin code.");
      if (!newPassword || newPassword.length < 8)
        throw new Error("Password must be at least 8 characters.");

      // POST /api/users/[id]/password-reset/verify
      const res = await fetch(`/api/users/${user.id}/password-reset/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to update password");

      // If changing own password, force logout
      if (session?.user?.id === user.id) {
        await signOut({ callbackUrl: "/sign-in" });
        return;
      }

      // Otherwise update local state and close password dialog
      setShowPasswordDialog(false);
      setCode("");
      setNewPassword("");

      onUserUpdated?.(user);
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSaveProfile() {
    if (!user?.id) return;

    setSavingProfile(true);
    setProfileError("");

    try {
      const updateBody: Partial<User> & { email?: string } = {
        name,
        phone,
        role,
      };

      // Only superadmin can change email
      if (isSuperAdmin) {
        updateBody.email = email;
      }

      // ✅ profile update endpoint:
      // PUT /api/users/[id]
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to update user");

      // If updating yourself and email changed, log out
      const emailChanged = isSuperAdmin && email !== (user.email || "");
      if (session?.user?.id === user.id && emailChanged) {
        await signOut({ callbackUrl: "/sign-in" });
        return;
      }

      onUserUpdated?.(data || { ...user, ...updateBody });
      onOpenChange(false);
    } catch (err: any) {
      setProfileError(err?.message || "Failed to update user");
    } finally {
      setSavingProfile(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              readOnly={!isSuperAdmin}
            />
            {!isSuperAdmin && (
              <div className="text-xs text-muted-foreground">
                Only superadmin can change email.
              </div>
            )}
            {isHardcodedAdmin && (
              <div className="text-xs text-muted-foreground">
                This is the hardcoded admin email. You can still change phone
                and password if needed.
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={isHardcodedAdmin} // keep your original behavior
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
              </SelectContent>
            </Select>
            {isHardcodedAdmin && (
              <div className="text-xs text-muted-foreground">
                The hardcoded admin role cannot be changed.
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <div className="space-y-1">
              <Label>Password</Label>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Change Password
                </Button>
              </div>
            </div>
          )}

          {showWarning && (
            <Alert
              title="Heads up"
              description="Changing your email or password will log you out. You’ll need to sign in again."
              className="mt-2"
            />
          )}

          {profileError && (
            <div className="text-red-500 text-sm">{profileError}</div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>

        {/* Password Dialog (Admin Only) */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Admin Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter admin code"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-1">
                <Label>New Password</Label>
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>

              {passwordError && (
                <div className="text-red-500 text-sm">{passwordError}</div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleSavePassword}
                disabled={savingPassword || !code || !newPassword}
              >
                {savingPassword ? "Saving..." : "Save Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
