"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, LogIn, Users, Clock, Trophy, Zap, AlertCircle, Gamepad2, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";



interface SessionInfo {
  id: string;
  status: string;
  host_id: string;
  current_question_index: number;
  participant_count: number;
  quizzes: {
    id: string;
    title: string;
    description: string;
    creator_id: string;
    profiles: {
      username: string;
      full_name: string;
    };
  };
}

export default function JoinPage() {
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Mock user - in real app this would come from auth
  const user = { id: "1", name: "Demo User" };

  // Simulate session validation
  useEffect(() => {
    const validateCode = async () => {
      if (!joinCode || joinCode.length !== 6) {
        setSession(null);
        return;
      }

      setIsValidating(true);

      // Simulate API call
      setTimeout(() => {
        if (joinCode === "DEMO12") {
          setSession({
            id: "1",
            status: "waiting",
            host_id: "host1",
            current_question_index: 0,
            participant_count: 12,
            quizzes: {
              id: "quiz1",
              title: "Pengetahuan Umum Indonesia",
              description: "Quiz tentang sejarah, budaya, dan geografi Indonesia",
              creator_id: "host1",
              profiles: {
                username: "quizmaster",
                full_name: "Quiz Master",
              },
            },
          });
        } else {
          setSession(null);
          if (joinCode.length === 6) {
            toast.error("Kode tidak valid atau sesi tidak ditemukan");
          }
        }
        setIsValidating(false);
      }, 1000);
    };

    const timeoutId = setTimeout(validateCode, 500);
    return () => clearTimeout(timeoutId);
  }, [joinCode]);

  const handleJoin = async () => {
    if (!user || !session) return;

    setIsLoading(true);

    // Simulate joining
    setTimeout(() => {
      toast.success("Berhasil bergabung dengan kuis!");
      setIsLoading(false);
    }, 2000);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "waiting":
        return {
          color: "bg-yellow-500",
          text: "Menunggu Dimulai",
          icon: Clock,
          description: "Kuis belum dimulai, menunggu host untuk memulai",
        };
      case "active":
        return {
          color: "bg-green-500",
          text: "Sedang Berlangsung",
          icon: Zap,
          description: "Kuis sedang berlangsung, bergabung sekarang!",
        };
      case "paused":
        return {
          color: "bg-orange-500",
          text: "Dijeda",
          icon: AlertCircle,
          description: "Kuis dijeda sementara oleh host",
        };
      default:
        return {
          color: "bg-gray-500",
          text: "Unknown",
          icon: AlertCircle,
          description: "",
        };
    }
  };

  if (!user) {
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
                🎮 Join Quiz
              </Badge>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Login Diperlukan</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Anda harus login terlebih dahulu untuk bergabung dengan kuis.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/auth" className="w-full">
                <Button className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl">
                  Login / Daftar
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

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
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2">🎮 Join Quiz</Badge>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Left Side - Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-white">
          <div className="flex flex-col justify-center max-w-lg mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Bergabung dengan Quiz</h1>
              <p className="text-xl text-blue-100">
                Masukkan kode 6 karakter untuk bergabung dengan quiz yang sedang berlangsung
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: Users,
                  title: "Multiplayer Real-time",
                  description: "Main bersama pemain lain secara bersamaan",
                },
                {
                  icon: Trophy,
                  title: "Live Leaderboard",
                  description: "Lihat ranking secara real-time",
                },
                {
                  icon: Zap,
                  title: "Instant Join",
                  description: "Langsung masuk dengan kode quiz",
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
          </div>
        </div>

        {/* Right Side - Join Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 lg:hidden">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Bergabung dengan Quiz
              </h1>
              <p className="text-muted-foreground">Masukkan kode 6 karakter untuk bergabung</p>
            </div>

            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">Masukkan Kode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative">
                    <Input
                      id="join-code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ABCDEF"
                      maxLength={6}
                      className="uppercase text-center text-2xl tracking-[0.5em] font-bold h-16 border-2 focus:border-blue-500 rounded-xl"
                    />
                    {isValidating && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {session && !isValidating && (
                    <div className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 mb-2">{session.quizzes.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Dibuat oleh:{" "}
                            {session.quizzes.profiles?.full_name || session.quizzes.profiles?.username || "Tanpa Nama"}
                          </p>
                        </div>
                        <Badge className={`${getStatusInfo(session.status).color} text-white px-3 py-1`}>
                          {getStatusInfo(session.status).text}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-700 mb-6">
                        {session.quizzes.description || "Tidak ada deskripsi"}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
                          <Users className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">{session.participant_count} pemain</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium">Pertanyaan {session.current_question_index + 1}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/80 rounded-lg text-sm text-gray-600 border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusInfo(session.status).icon({ className: "w-4 h-4" })}
                          <span className="font-medium">Status:</span>
                        </div>
                        {getStatusInfo(session.status).description}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleJoin}
                  disabled={!session || isLoading || isValidating}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      Bergabung...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Bergabung dengan Quiz
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              <p>Belum punya kode? Minta host untuk membagikan kode atau QR code</p>
              <div className="mt-4">
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                  ← Kembali ke beranda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
