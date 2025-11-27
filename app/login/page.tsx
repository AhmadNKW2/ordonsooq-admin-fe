/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Login Page - Admin Authentication
 */

"use client";

import React, { useState } from "react";
import { useAuth } from "../src/contexts/auth.context";
import { Input } from "../src/components/ui/input";
import { Button } from "../src/components/ui/button";
import { Card } from "../src/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !email || !password}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>Ordonsooq Admin Dashboard</p>
        </div>
      </Card>
    </div>
  );
}
