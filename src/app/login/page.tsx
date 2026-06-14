"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (isRegistering) {
      // Handle Registration
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Registration failed");
          setIsLoading(false);
          return;
        }

        // Auto-login after successful registration
        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (loginRes?.ok) {
          router.push("/dashboard");
        } else {
          setError("Auto-login failed. Please try logging in manually.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      }
    } else {
      // Handle Login
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card p-8 sm:p-10 rounded-3xl shadow-2xl shadow-accent/10 w-full max-w-md border border-border"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-accent tracking-tight mb-2">Splitwise</h1>
          <p className="text-text-secondary font-medium">
            {isRegistering ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 text-red-500 font-bold p-3 rounded-xl mb-6 text-sm text-center border border-red-500/20"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {isRegistering && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full p-4 bg-bg-app border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-text-primary font-medium placeholder:text-text-secondary/50" 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-4 bg-bg-app border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-text-primary font-medium placeholder:text-text-secondary/50" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 bg-bg-app border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-text-primary font-medium placeholder:text-text-secondary/50" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-accent text-white font-bold py-4 rounded-2xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/25 hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none mt-2"
          >
            {isLoading ? "Please wait..." : (isRegistering ? "Sign Up" : "Log In")}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-text-secondary font-medium">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
              }}
              className="ml-2 text-accent hover:text-accent-hover font-bold transition-colors"
            >
              {isRegistering ? "Log in here" : "Register here"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
