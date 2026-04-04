"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(true);

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
    window.location.href = "/";
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
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#146DFA]"
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
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#146DFA] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

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
