/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      // STEP 1 — Start sign-in
      let result = await signIn.create({
        identifier: email,
        password,
      });

      // Clerk sometimes starts with "needs_first_factor"
      if (result.status === "needs_first_factor") {
        result = await signIn.attemptFirstFactor({
          strategy: "password",
          password,
        });
      }

      // STEP 2 — Handle second factor (should not happen if MFA is disabled)
      if (result.status === "needs_second_factor") {
        setErrorMessage(
          "Two-factor authentication is required. Please disable MFA in Clerk Dashboard or contact support."
        );
        toast.error("2FA is required but not supported in this flow");
        return;
      }

      // STEP 3 — Final completion
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Welcome back!");
        window.location.href = "/";
        return;
      }

      // Anything else = unexpected
      setErrorMessage(`Unexpected sign-in status: ${result.status}`);
      toast.error("Could not complete sign-in");
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid email or password";

      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Order Checks Admin
          </h1>
          <p className="text-slate-400 text-sm">Sign in to continue</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-slate-100"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-slate-100"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
