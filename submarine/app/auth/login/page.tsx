"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, User, Gamepad2, ArrowLeft, Star, Trophy, Users, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import { PageWithLoading } from "@/components/ui/page-with-loading";

export default function Page() {
  return (
    <PageWithLoading 
      animation="slideUp" 
      loadingDuration={500}
      customLoadingMessage="Memuat halaman login..."
      customLoadingVariant="minimal"
    >
      <LoginPage />
    </PageWithLoading>
  );
}

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      
      toast.success("Berhasil masuk!");
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error signing in:", error);
      setError(error.message || "Gagal masuk. Periksa email dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      });

      if (error) throw error;
      
      toast.success("Akun berhasil dibuat! Silakan cek email untuk verifikasi.");
      
      // Switch to sign in tab after successful registration
      const tabsElement = document.querySelector('[data-state="active"][role="tab"]');
      if (tabsElement) {
        const signinTab = document.querySelector('[value="signin"]');
        if (signinTab instanceof HTMLElement) {
          signinTab.click();
        }
      }
    } catch (error: any) {
      console.error("Error signing up:", error);
      setError(error.message || "Gagal mendaftar. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NODE_ENV === 'production' 
            ? `https://${window.location.hostname}` 
            : window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setError(error.message || "Gagal masuk dengan Google. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GolekQuiz
              </span>
            </Link>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2">
              🎉 Gratis Selamanya
            </Badge>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Left Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-white">
          <div className="flex flex-col justify-center max-w-lg mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Bergabung dengan 50K+ Pemain</h1>
              <p className="text-xl text-blue-100">
                Platform quiz terbaik untuk belajar dan bermain bersama teman-teman
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: Users,
                  title: "Multiplayer Real-time",
                  description: "Main bersama teman secara bersamaan",
                },
                {
                  icon: Trophy,
                  title: "Sistem Ranking",
                  description: "Kompetisi sehat dengan leaderboard",
                },
                {
                  icon: Zap,
                  title: "Instant Play",
                  description: "Langsung main tanpa ribet",
                },
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-blue-100">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="ml-2 font-semibold">4.9/5</span>
              </div>
              <p className="text-blue-100 italic">
                "Platform quiz terbaik yang pernah saya coba! Fitur multiplayer-nya keren banget."
              </p>
              <div className="flex items-center mt-4">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  SW
                </div>
                <div>
                  <div className="font-semibold">Sarah Wijaya</div>
                  <div className="text-sm text-blue-200">Mahasiswa UI</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center lg:hidden">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Selamat Datang!
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-lg">
                    Mulai petualangan quiz kamu sekarang
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="signin" className="space-y-6">
                  <TabsContent value="signin" className="space-y-6">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-gray-700 font-medium">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <Input
                            id="signin-email"
                            name="email"
                            type="email"
                            placeholder="nama@email.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-gray-700 font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <Input
                            id="signin-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-600 text-sm text-center">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={loading}
                      >
                        {loading ? "Memproses..." : "Masuk Sekarang"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm uppercase">
                    <span className="bg-white px-4 text-gray-500 font-medium">Atau</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 hover:bg-gray-50 bg-white rounded-xl font-semibold transition-all duration-300"
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Masuk dengan Google
                </Button>
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Belum punya akun?{" "}
                      <Link
                        href="/auth/register"
                        className="text-purple-600 hover:underline font-medium"
                      >
                        Register di sini
                      </Link>
                    </p>
                  </div>

                <div className="mt-8 text-center">
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Gratis Selamanya</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Tanpa Iklan</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
