"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Slack, Users, ArrowBigLeft } from "lucide-react";
import Link from "next/link";
import { PageWithLoading } from "@/components/ui/page-with-loading";

function JoinGamePageContent() {
  const [gamePin, setGamePin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-fill game PIN if provided in URL
  useEffect(() => {
    const pinFromUrl = searchParams.get("pin");
    if (pinFromUrl) {
      setGamePin(pinFromUrl);
    }
  }, [searchParams]);

  const joinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamePin.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Ambil user dari session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Kamu harus login untuk join game.");
        setLoading(false);
        return;
      }

      // Ambil username dari profile
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", user.id)
        .single();

      // Jika profil tidak ditemukan, coba buat profil baru
      if (profileError || !profile) {
        console.log("Profile not found, creating new profile");
        
        // Ekstrak username dari email
        let username = "";
        let email = "";
        
        if (user.email) {
          email = user.email;
          username = user.email.split('@')[0];
          
          // Tambahkan angka random jika username sudah ada
          const { data: usernameExists } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", username)
            .single();
            
          if (usernameExists) {
            username = `${username}${Math.floor(Math.random() * 1000)}`;
          }
        } else {
          username = `user_${Math.floor(Math.random() * 10000)}`;
          email = `${username}@example.com`;
        }
        
        // Buat profil baru
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username: username,
            email: email,
            fullname: user.user_metadata?.full_name || username,
            avatar_url: user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          console.error("Error creating profile:", insertError);
          setError("Gagal membuat profile: " + insertError.message);
          setLoading(false);
          return;
        }
        
        profile = newProfile;
      }

      // Cek session game
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .select("id, status, quiz_id")
        .eq("game_pin", gamePin.trim())
        .eq("status", "waiting")
        .single();

      if (sessionError || !session) {
        setError("Game PIN tidak valid atau game sudah dimulai");
        setLoading(false);
        return;
      }

      // Cek apakah username sudah dipakai
      const { data: existingParticipant, error: existingError } = await supabase
        .from("game_participants")
        .select("id")
        .eq("session_id", session.id)
        .eq("nickname", profile?.username || "")
        .single();

      // PGRST116 adalah kode error "tidak ada data" yang berarti username belum dipakai
      if (existingParticipant) {
        setError("Username kamu sudah dipakai di game ini.");
        setLoading(false);
        return;
      }

      // Join game dengan username
      const { data: participant, error: participantError } = await supabase
        .from("game_participants")
        .insert({
          session_id: session.id,
          user_id: user.id,
          nickname: profile?.username || "user_" + Math.floor(Math.random() * 10000),
        })
        .select()
        .single();

      if (participantError) {
        console.error("Error joining game:", participantError);
        setError("Gagal bergabung ke game: " + participantError.message);
        setLoading(false);
        return;
      }

      router.push(`/play/${session.id}?participant=${participant.id}`);
    } catch (error: any) {
      console.error("Error joining game:", error);
      let errorMessage = "Gagal bergabung ke game. Silakan coba lagi.";
      if (error && error.message) {
        errorMessage += " Detail: " + error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Slack className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GolekQuiz</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-gray-600 hover:bg-white hover:text-purple-600 transition-colors flex items-center gap-1 px-3 py-2 rounded-lg"
          >
            <ArrowBigLeft />
            Back
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Gabung Game
              </CardTitle>
              <p className="text-gray-600">
                Masukkan Game PIN untuk bergabung
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={joinGame} className="space-y-6">
                <div className="space-y-6">
                  <div className="relative">
                    <Label htmlFor="gamePin" className="text-base font-medium">
                      Game PIN
                    </Label>
                    <Input
                      id="gamePin"
                      type="text"
                      value={gamePin}
                      onChange={(e) =>
                        setGamePin(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="123456"
                      className="mt-2 text-center text-2xl tracking-[0.5em] font-bold h-16 border-2 focus:border-blue-500 rounded-xl"
                      maxLength={6}
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm text-center">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading || !gamePin.trim()}
                  >
                    {loading ? "Bergabung..." : "Gabung Game"}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Belum punya Game PIN?{" "}
                  <Link
                    href="/auth/register"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Buat quiz sendiri
                  </Link>
                </p>
                <div className="mt-4">
                  <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                    ← Kembali ke beranda
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function JoinGamePage() {
  return (
    <PageWithLoading 
      animation="slideDown"
      customLoadingMessage="Memuat halaman bergabung..."
      customLoadingVariant="game"
    >
      <JoinGamePageContent />
    </PageWithLoading>
  );
}
