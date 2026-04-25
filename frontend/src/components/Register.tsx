/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { Link, Lock, User, ArrowRight, UserPlus } from "lucide-react";

interface RegisterProps {
  onRegister: (
    username: string,
    password: string,
    isStaff: boolean,
  ) => Promise<void>;
  onBackToLogin: () => void;
}

export default function Register({ onRegister, onBackToLogin }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isStaff, setIsStaff] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onRegister(username, password, isStaff);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10 space-y-1">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mb-1"
          >
            <Link className="text-indigo-400 rotate-45" size={42} />
            <h1 className="text-5xl font-black tracking-tight text-white uppercase italic">
              Knot
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-semibold"
          >
            Join the community
          </motion.p>
        </div>

        <div className="glass-card p-6 md:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl -z-10" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">
                Choose Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all font-sans"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all font-sans"
                  placeholder="Min. 8 characters"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all font-sans"
                  placeholder="Confirm password"
                  required
                />
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider mt-1 ml-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Moderator
              </span>
              <button
                type="button"
                onClick={() => setIsStaff(!isStaff)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                  isStaff ? "bg-indigo-500" : "bg-white/10"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                    isStaff ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !username.trim() ||
                password.length < 6 ||
                password !== confirmPassword
              }
              className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-white/10 border border-white/10 rounded-xl py-4 flex items-center justify-center gap-2 text-white font-bold transition-all hover:gap-4 active:scale-95 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <UserPlus size={18} />
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4 text-center">
            <button
              onClick={onBackToLogin}
              className="text-slate-400 hover:text-indigo-400 text-xs font-semibold transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
