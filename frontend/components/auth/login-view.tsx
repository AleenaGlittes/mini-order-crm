"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import {
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RotateCw,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { loginUser, UserSession } from "@/lib/api";

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFillDemo = () => {
    setEmail("admin@mystore.com");
    setPassword("admin123");
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const session = await loginUser(email.trim(), password);
      setIsLoading(false);
      onLoginSuccess(session);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage((err as Error).message || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#fffcf2] text-[#252422]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eb5e28] text-white shadow-md">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252422]">
            Mini CRM
          </h1>
      
        </div>

       

        {/* Login Form Card */}
        <Card className="border border-[#ccc5b9] bg-white shadow-lg">
          <CardHeader className="pb-6 pt-6 px-6">
            <h2 className="text-lg font-semibold text-[#252422]">Sign In</h2>
           
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-6">
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#252422]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#403d39] pointer-events-none" />
                  <Input
                    type="email"
                    required
                    placeholder="example@mystore.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10 text-xs sm:text-sm bg-white border-[#ccc5b9] text-[#252422] focus-visible:ring-[#eb5e28]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#252422]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#403d39] pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-10 text-xs sm:text-sm bg-white border-[#ccc5b9] text-[#252422] focus-visible:ring-[#eb5e28]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-[#403d39] hover:text-[#252422]"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 pb-6 px-6 flex flex-col gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-[#eb5e28] hover:bg-[#eb5e28]/90 text-white font-semibold text-sm shadow-xs transition-colors"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin mr-2" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </Button>

          
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
