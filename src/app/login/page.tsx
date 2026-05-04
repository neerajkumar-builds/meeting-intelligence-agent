"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";

const TAGLINES = [
  "AI-powered meeting intelligence",
  "Real-time coaching insights",
  "Cross-call analysis at scale",
];

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "deactivated") {
      setError("Your account has been deactivated. Contact your admin.");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineVisible(false);
      setTimeout(() => {
        setTaglineIndex((i) => (i + 1) % TAGLINES.length);
        setTaglineVisible(true);
      }, 500);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmNewPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setRecoveryMode(false);
      window.location.href = "/";
    }
  }

  async function handleResetPassword() {
    if (!email) { setError("Enter your email to reset password"); return; }
    setLoading(true);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Full page navigation to force middleware re-evaluation with new auth cookie
    const redirect = searchParams.get("redirect") ?? "/";
    window.location.href = redirect;
  }

  return (
    <div className="min-h-screen flex items-center justify-center login-gradient-bg p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/fullfunnel-logo-white.svg"
            alt="FullFunnel"
            width={180}
            height={30}
            className="mb-4"
          />
          <h1 className="text-lg font-semibold text-white">Meeting Intelligence</h1>
          <p className="text-sm text-white/50 mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        {recoveryMode ? (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <h3 className="text-lg font-semibold text-white text-center">Set New Password</h3>
            <p className="text-sm text-white/50 text-center">Enter your new password below</p>
            <div>
              <label className="text-sm text-white/80 mb-1 block">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#146DFA]"
                required
              />
            </div>
            <div>
              <label className="text-sm text-white/80 mb-1 block">Confirm Password</label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#146DFA]"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-[#146DFA] hover:bg-[#146DFA]/90 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@fullfunnel.co"
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#146DFA]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#146DFA] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {resetSent && (
            <p className="text-sm text-emerald-400 bg-emerald-400/10 rounded-lg px-3 py-2">
              Password reset email sent. Check your inbox.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#146DFA] hover:bg-[#146DFA]/90 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
        )}

        {/* Rotating taglines */}
        <p
          className={`text-xs text-white/30 text-center mt-6 tagline-fade ${taglineVisible ? "opacity-100" : "opacity-0"}`}
        >
          {TAGLINES[taglineIndex]}
        </p>
      </div>
    </div>
  );
}
