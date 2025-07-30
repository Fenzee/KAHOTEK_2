"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { ChatPanel } from "@/components/ui/chat-panel";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";

import {
  ArrowLeft,
  Play,
  Users,
  Copy,
  Check,
  Slack,
  AlertCircle,
  User,
  Globe,
  Lock,
  Clock,
  ArrowBigLeft,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GamePageWithLoading } from "@/components/ui/page-with-loading";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  creator_id: string;
  questions: Array<{
    id: string;
    question_text: string;
    time_limit: number;
    points: number;
  }>;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface GameSession {
  id: string;
  game_pin: string;
  status: string;
  total_time_minutes: number | null;
  countdown_started_at?: number | null;
  game_end_mode?: 'first_finish' | 'wait_timer'; // Game end setting
  participants: Array<{
    id: string;
    nickname: string;
    joined_at: string;
    profiles?:
      | {
          avatar_url?: string | null;
        }
      | Array<{
          avatar_url?: string | null;
        }>;
  }>;
}

interface SupabaseQuizResponse {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  creator_id: string;
  questions: Array<{
    id: string;
    question_text: string;
    time_limit: number;
    points: number;
  }>;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

function HostGamePageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTimeSetup, setShowTimeSetup] = useState(false);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number>(10);
  const [gameEndMode, setGameEndMode] = useState<'first_finish' | 'wait_timer'>('wait_timer'); // Game end mode state
  const [isJoining, setIsJoining] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-15, 15]),
    springConfig
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-20, 20]),
    springConfig
  );
  const [error, setError] = useState<{
    type:
      | "permission"
      | "not_found"
      | "no_questions"
      | "connection"
      | "unknown";
    message: string;
    details?: string;
  } | null>(null);
  const hasCreatedSession = useRef(false);
  const [countdownLeft, setCountdownLeft] = useState<number | null>(null);
  const countdownDuration = 10; // 10 detik
  const [hostParticipantId, setHostParticipantId] = useState<string | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<{
    username: string;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (user && !gameSession && !hasCreatedSession.current) {
      hasCreatedSession.current = true;
      fetchQuizAndCreateSession();
    }
  }, [user, gameSession]);

  useEffect(() => {
    if (!user) {
      router.push("/dashboard");
    }
    if (user) {
      fetchUserProfile();
    }
  }, [user, router]);

  useEffect(() => {
    if (gameSession) {
      fetchParticipants();

      const channel = supabase
        .channel(`game_${gameSession.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "game_participants",
            filter: `session_id=eq.${gameSession.id}`,
          },
          (payload) => {
            console.log("Participant change detected:", payload);
            fetchParticipants();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [gameSession]);

  useEffect(() => {
    if (gameSession?.countdown_started_at && gameSession.status === "active") {
      const interval = setInterval(() => {
        const now = new Date();
        const countdownStart = new Date(gameSession.countdown_started_at!);
        const remaining = Math.max(
          0,
          5 - Math.floor((now.getTime() - countdownStart.getTime()) / 1000)
        );

        setCountdownLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          setCountdownLeft(null);
          router.push(`/game/${gameSession.id}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameSession, router]);

  useEffect(() => {
    if (
      gameSession?.countdown_started_at &&
      hostParticipantId &&
      gameSession.status === "waiting"
    ) {
      const startTime = new Date(gameSession.countdown_started_at).getTime();
      const now = Date.now();
      const diff = Math.ceil((startTime + 5000 - now) / 1000); // 5 detik countdown

      if (diff <= 0) {
        router.push(
          `/play-active/${resolvedParams.id}?participant=${hostParticipantId}`
        );
      } else {
        setCountdownLeft(diff);
        const interval = setInterval(() => {
          setCountdownLeft((prev) => {
            if (prev && prev > 1) return prev - 1;

            clearInterval(interval);
            router.push(
              `/play-active/${resolvedParams.id}?participant=${hostParticipantId}`
            );
            return 0;
          });
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [gameSession?.countdown_started_at, hostParticipantId]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    }
  };

  const displayName = useMemo(() => {
    if (userProfile?.username) return userProfile.username;
    if (user && user.email) return user.email.split("@")[0];
    return "User";
  }, [userProfile, user]);

  const fetchQuizAndCreateSession = async () => {
    try {
      console.log("🔍 Fetching quiz with ID:", resolvedParams.id);
      console.log("👤 Current user:", user?.id);

      if (gameSession) {
        console.log("⛔ Game session sudah ada, tidak membuat ulang.");
        return;
      }
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      if (!resolvedParams.id) {
        throw new Error("Quiz ID is required");
      }

      const { data: testData, error: testError } = await supabase
        .from("quizzes")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("❌ Supabase connection test failed:", testError);
        setError({
          type: "connection",
          message: "Tidak dapat terhubung ke database",
          details: testError.message,
        });
        return;
      }

      console.log("✅ Supabase connection test passed");

      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select(
          `
          id,
          title,
          description,
          is_public,
          creator_id,
          questions (
            id,
            question_text,
            time_limit,
            points
          ),
          profiles!quizzes_creator_id_fkey (
            username,
            avatar_url
          )
        `
        )
        .eq("id", resolvedParams.id)
        .single();

      console.log("📊 Quiz query result:", { quizData, quizError });

      if (quizError) {
        console.error("❌ Quiz fetch error:", quizError);
        if (quizError.code === "PGRST116") {
          setError({
            type: "not_found",
            message: "Quiz tidak ditemukan",
            details: "Quiz dengan ID tersebut tidak ada dalam database",
          });
        } else {
          setError({
            type: "unknown",
            message: "Gagal memuat quiz",
            details: quizError.message,
          });
        }
        return;
      }

      if (!quizData) {
        setError({
          type: "not_found",
          message: "Quiz tidak ditemukan",
          details: "Data quiz tidak tersedia",
        });
        return;
      }

      const quiz = quizData as unknown as SupabaseQuizResponse;

      console.log("🎯 Quiz details:", {
        id: quiz.id,
        title: quiz.title,
        creator_id: quiz.creator_id,
        is_public: quiz.is_public,
        current_user: user.id,
        is_creator: quiz.creator_id === user.id,
      });

      const isCreator = quiz.creator_id === user.id;
      const isPublic = quiz.is_public;

      if (!isCreator && !isPublic) {
        console.log("❌ Permission denied: Private quiz, not creator");
        setError({
          type: "permission",
          message: "Tidak dapat menghost quiz ini",
          details:
            "Quiz ini bersifat private dan hanya dapat dihost oleh pembuatnya",
        });
        return;
      }

      if (!quiz.questions || quiz.questions.length === 0) {
        setError({
          type: "no_questions",
          message: "Quiz tidak memiliki pertanyaan",
          details: "Tambahkan pertanyaan terlebih dahulu sebelum menghost quiz",
        });
        return;
      }

      console.log("✅ Permission check passed - User can host this quiz");

      const processedQuiz: Quiz = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        is_public: quiz.is_public,
        creator_id: quiz.creator_id,
        questions: quiz.questions,
        profiles: {
          username: quiz.profiles.username,
          avatar_url: quiz.profiles.avatar_url || null,
        },
      };

      setQuiz(processedQuiz);

      console.log("🎮 Creating game session...");
      const gamePin = Math.floor(100000 + Math.random() * 900000).toString();

      const { data: session, error: createSessionError } = await supabase
        .from("game_sessions")
        .insert({
          quiz_id: resolvedParams.id,
          host_id: user.id,
          game_pin: gamePin,
          status: "waiting",
          total_time_minutes: null,
          game_end_mode: gameEndMode, // Add game end mode to session creation
        })
        .select()
        .single();

      if (createSessionError) {
        console.error("❌ Session creation error:", createSessionError);
        throw createSessionError;
      }

      console.log("✅ Game session created:", session);

      setGameSession({
        id: session.id,
        game_pin: session.game_pin,
        status: session.status,
        total_time_minutes: session.total_time_minutes,
        game_end_mode: session.game_end_mode || gameEndMode, // Add game end mode to state
        participants: [],
      });
    } catch (error) {
      console.error("💥 Error in fetchQuizAndCreateSession:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      if (!error || typeof error !== "object") {
        setError({
          type: "unknown",
          message: "Terjadi kesalahan tidak dikenal",
          details: errorMessage,
        });
      } else if (errorMessage.includes("not authenticated")) {
        setError({
          type: "permission",
          message: "Sesi login telah berakhir",
          details: "Silakan login ulang untuk melanjutkan",
        });
      } else if (errorMessage.includes("connection")) {
        setError({
          type: "connection",
          message: "Masalah koneksi database",
          details: "Periksa koneksi internet dan coba lagi",
        });
      } else {
        setError({
          type: "unknown",
          message: "Gagal menyiapkan game",
          details: errorMessage,
        });
      }
    } finally {
      // setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!gameSession) return;

    try {
      console.log("Fetching participants for session:", gameSession.id);

      const { data, error } = await supabase
        .from("game_participants")
        .select(
          `
          id, 
          nickname,
          joined_at,
          profiles (
          avatar_url
          )
          `
        )
        .eq("session_id", gameSession.id)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Error fetching participants:", error);
        throw error;
      }

      console.log("Fetched participants:", data);

      setGameSession((prev) =>
        prev
          ? {
              ...prev,
              participants: data || [],
            }
          : null
      );
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const copyGamePin = async () => {
    if (!gameSession) return;

    try {
      await navigator.clipboard.writeText(gameSession.game_pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    x.set(event.clientX - rect.left - halfWidth);
  };

  const handleStartGame = () => {
    if (!gameSession || gameSession.participants.length === 0) return;
    setShowTimeSetup(true);
  };

  const startCountdownBeforeGame = async () => {
    if (!gameSession || !totalTimeMinutes) return;

    const countdownStartTime = new Date(); // Waktu countdown dimulai
    const startedTime = new Date(
      countdownStartTime.getTime() + countdownDuration * 1000
    );

    // 1. Simpan ke Supabase terlebih dahulu
    const { error } = await supabase
      .from("game_sessions")
      .update({
        countdown_started_at: countdownStartTime.toISOString(),
        started_at: startedTime.toISOString(),
        status: "active",
        total_time_minutes: totalTimeMinutes,
      })
      .eq("id", gameSession.id);

    if (error) {
      console.error("Gagal menyimpan waktu countdown:", error);
      return;
    }

    // 2. Jalankan countdown lokal di host untuk ditampilkan
    setCountdownLeft(countdownDuration);
    let secondsLeft = countdownDuration;

    const interval = setInterval(() => {
      secondsLeft -= 1;
      setCountdownLeft(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(interval);

        // 3. Setelah countdown selesai, redirect ke halaman pengerjaan
        router.push(`/game/${gameSession.id}`);
      }
    }, 1000);
  };

  const joinAsHostAndStartCountdown = async () => {
    if (!gameSession) return;

    setIsJoining(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user) {
        setError({
          type: "unknown",
          message: "Gagal memuat quiz",
          details: "tidak ada user yang terautentikasi",
        });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setError({
          type: "unknown",
          message: "Gagal memuat quiz",
          details: "tidak ada profil yang ditemukan",
        });
        return;
      }

      // Insert participant jika belum
      const { data: existing } = await supabase
        .from("game_participants")
        .select("id")
        .eq("session_id", gameSession.id)
        .eq("nickname", profile.username)
        .maybeSingle();

      let participantId = existing?.id;

      if (!participantId) {
        const { data: newParticipant } = await supabase
          .from("game_participants")
          .insert({
            session_id: gameSession.id,
            user_id: user.id,
            nickname: profile.username,
          })
          .select()
          .single();

        participantId = newParticipant.id;
      }

      // === START COUNTDOWN ===
      const countdownDuration = 10;
      const now = new Date();
      const startedTime = new Date(now.getTime() + countdownDuration * 1000);

      const { error: updateError } = await supabase
        .from("game_sessions")
        .update({
          countdown_started_at: now.toISOString(),
          started_at: startedTime.toISOString(),
          status: "active",
          total_time_minutes: totalTimeMinutes,
        })
        .eq("id", gameSession.id);

      if (updateError) {
        setError({
          type: "unknown",
          message: "Gagal memulai countdown",
          details: "Gagal menyimpan waktu mulai",
        });
        return;
      }

      setHostParticipantId(participantId);
      setCountdownLeft(countdownDuration); // untuk ditampilkan di UI

      let secondsLeft = countdownDuration;
      const interval = setInterval(() => {
        secondsLeft -= 1;
        setCountdownLeft(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(interval);
          router.push(
            `/play-active/${gameSession.id}?participant=${participantId}`
          );
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setError({
        type: "unknown",
        message: "Gagal memuat quiz",
        details: "Terjadi kesalahan saat bergabung sebagai host",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const endSession = async () => {
    if (!gameSession) return;

    try {
      // Update status game menjadi finished
      const { error } = await supabase
        .from("game_sessions")
        .update({
          status: "finished",
          ended_at: new Date().toISOString(),
        })
        .eq("id", gameSession.id);

      if (error) throw error;

      // Ambil data peserta terbaru
      const { data: latestParticipants, error: participantsError } =
        await supabase
          .from("game_participants")
          .select("id, nickname")
          .eq("session_id", gameSession.id);

      if (participantsError) {
        console.error("Error fetching latest participants:", participantsError);
      } else if (latestParticipants && latestParticipants.length > 0) {
        // Hitung skor untuk semua peserta
        console.log(
          `Calculating scores for ${latestParticipants.length} participants`
        );
        await Promise.all(
          latestParticipants.map(async (participant) => {
            try {
              await supabase.rpc("calculate_score", {
                session_id_input: gameSession.id,
                participant_id_input: participant.id,
              });
              console.log(`Score calculated for ${participant.nickname}`);
            } catch (err) {
              console.error(
                `Error calculating score for ${participant.nickname}:`,
                err
              );
            }
          })
        );
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
  //         <p>Menyiapkan game...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error.message}
            </h2>
            <p className="text-gray-600 mb-4 text-sm">{error.details}</p>
          </div>

          <div className="space-y-3">
            {error.type === "permission" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-800 mb-2">Solusi:</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>
                    • Minta pembuat quiz untuk mengubah status menjadi public
                  </li>
                  <li>• Atau login dengan akun pembuat quiz</li>
                  <li>• Hubungi pembuat quiz untuk mendapatkan akses</li>
                </ul>
              </div>
            )}

            {error.type === "not_found" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Kemungkinan penyebab:
                </h3>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Quiz telah dihapus</li>
                  <li>• Link yang digunakan tidak valid</li>
                  <li>• Quiz belum dipublikasikan</li>
                </ul>
              </div>
            )}

            {error.type === "no_questions" && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-orange-800 mb-2">
                  Yang perlu dilakukan:
                </h3>
                <ul className="text-orange-700 text-sm space-y-1">
                  <li>• Buka halaman edit quiz</li>
                  <li>• Tambahkan minimal 1 pertanyaan</li>
                  <li>• Simpan perubahan</li>
                  <li>• Coba host ulang</li>
                </ul>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={fetchQuizAndCreateSession}
                variant="outline"
                className="flex-1 bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Coba Lagi
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Kembali ke Dashboard
              </Button>
            </div>
          </div>

          {error.type === "connection" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-left">
              <p className="font-semibold text-red-800">Tips Debugging:</p>
              <ul className="text-red-700 mt-1 space-y-1">
                <li>• Periksa koneksi internet</li>
                <li>• Refresh halaman</li>
                <li>• Coba beberapa saat lagi</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!quiz || !gameSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quiz tidak ditemukan
          </h2>
          <Link href="/dashboard">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = quiz.creator_id === user?.id;

  return (
    <div className="min-h-screen bg-white text-gray-900 relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 md:px-6 lg:px-8 border-b">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Play className="h-6 w-6 text-purple-600" />
          <span>GolekQuiz</span>
        </div>
        <Button
          onClick={endSession}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back & end session
        </Button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Quiz Info Card */}
          <Card className="bg-white shadow-lg rounded-xl p-6">
            <CardHeader className="pb-4 px-0 pt-0">
              <CardTitle className="text-xl font-semibold">
                {quiz.title}
              </CardTitle>
              {quiz.description && (
                <p className="text-gray-600 text-sm">{quiz.description}</p>
              )}
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {quiz.questions.length}
                  </div>
                  <div className="text-sm text-gray-600">Pertanyaan</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {gameSession.participants.length}
                  </div>
                  <div className="text-sm text-gray-600">Pemain</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                <div className="flex items-center gap-1">
                  <Avatar className="h-8 w-8 bg-white border-2 border-white">
                    <AvatarImage
                      src={
                        quiz.profiles.avatar_url ||
                        (user?.email
                          ? `https://robohash.org/${encodeURIComponent(
                              user.email
                            )}.png`
                          : "/default-avatar.png") // fallback lokal
                      }
                      alt={user?.email || ""}
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="bg-white text-purple-600">
                      {displayName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>Maker {quiz.profiles.username}</span>
                </div>
                <div className="flex gap-2">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      quiz.is_public
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {quiz.is_public ? "Public" : "Private"}
                  </div>

                  {isCreator && (
                    <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      Quiz Anda
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Setup Card */}
          <Card className="bg-white shadow-lg rounded-xl p-6">
            {/* Countdown sedang berlangsung */}
            {countdownLeft !== null && countdownLeft > 0 ? (
              <CardContent className="p-8 text-center">
                <h2 className="text-4xl font-bold text-purple-700 mb-2">
                  Mulai dalam {countdownLeft} detik...
                </h2>
                <p className="text-gray-600">Bersiaplah!</p>
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-4 px-0 pt-0 flex flex-row items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-xl font-semibold">
                    Set Quiz Time Limit
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="totalTime"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Total Quiz Time (minutes)
                    </Label>
                    <Input
                      id="totalTime"
                      type="number"
                      min="1"
                      max="120"
                      value={totalTimeMinutes}
                      onChange={(e) =>
                        setTotalTimeMinutes(
                          Number.parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full"
                    />
                  </div>
                  
                  {/* Game End Mode Selection */}
                  <div className="space-y-3">
                    <Label className="block text-sm font-medium text-gray-700">
                      Game End Mode
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="wait_timer"
                          name="gameEndMode"
                          value="wait_timer"
                          checked={gameEndMode === 'wait_timer'}
                          onChange={(e) => setGameEndMode(e.target.value as 'first_finish' | 'wait_timer')}
                          className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <label htmlFor="wait_timer" className="text-sm text-gray-700 cursor-pointer">
                          <span className="font-medium">Wait for Timer</span> - Semua pemain menunggu hingga waktu habis
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="first_finish"
                          name="gameEndMode"
                          value="first_finish"
                          checked={gameEndMode === 'first_finish'}
                          onChange={(e) => setGameEndMode(e.target.value as 'first_finish' | 'wait_timer')}
                          className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <label htmlFor="first_finish" className="text-sm text-gray-700 cursor-pointer">
                          <span className="font-medium">First to Finish</span> - Game berakhir ketika satu pemain selesai
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    <Button
                      onClick={startCountdownBeforeGame}
                      className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                      disabled={
                        gameSession.participants.length === 0 ||
                        !totalTimeMinutes ||
                        totalTimeMinutes < 1
                      }
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Mulai Game
                    </Button>
                    {gameSession?.status === "waiting" &&
                      !gameSession?.countdown_started_at && (
                        <Button
                          onClick={joinAsHostAndStartCountdown}
                          disabled={isJoining}
                          size="lg"
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 bg-transparent flex-1"
                        >
                          {isJoining
                            ? "Memulai..."
                            : "Ikut Bermain sebagai Host"}
                        </Button>
                      )}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Game PIN Card */}
          <Card className="bg-white shadow-lg rounded-xl p-6 text-center">
            <CardHeader className="pb-4 px-0 pt-0">
              <CardTitle className="text-xl font-semibold">Game PIN</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-6">
              <div className="flex items-center justify-center gap-3">
                <div className="text-6xl font-extrabold text-purple-600 left-[30px] relative">
                  {gameSession.game_pin}
                </div>
                <div className="relative inline-block left-[30px]">
                  <Button
                    onClick={copyGamePin}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onMouseMove={handleMouseMove}
                    variant="ghost"
                    size="icon"
                    className="text-purple-600 hover:bg-purple-50 relative bg-transparent border-2 "
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                  <AnimatePresence mode="wait">
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 260,
                            damping: 15,
                          },
                        }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        style={{
                          translateX: translateX,
                          rotate: rotate,
                        }}
                        className="absolute -top-12 left-[-22px] z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-3 py-1.5 text-xs shadow-xl min-w-[80px]"
                      >
                        <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                        <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                        <div className="relative z-30 text-sm font-medium text-white">
                          {copied ? "Tersalin!" : "Salin PIN"}
                        </div>
                        <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45 z-10"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex justify-center py-4 w-full">
                <div className="w-48 h-48 md:w-72 md:h-72 border border-gray-200 rounded-lg p-2">
                  <QRCodeSVG
                    value={`${window.location.origin}/join?pin=${gameSession.game_pin}`}
                    size="100%"
                    className="w-full h-full"
                    bgColor="#FFFFFF"
                    fgColor="#4C1D95"
                    level="H"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Bagikan PIN atau scan QRCode kepada pemain untuk bergabung
              </p>
            </CardContent>
          </Card>

          {/* Players Card */}
        </div>
        <Card className="bg-white shadow-lg rounded-xl p-6 w-full md:col-span-2">
          <CardHeader className="pb-4 px-0 pt-0 flex flex-row items-center gap-2 justify-center text-center">
            <Users className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-xl font-semibold">
              Pemain ({gameSession.participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {gameSession.participants.length === 0 ? (
              <div className="text-center py-4">
                <div className="flex justify-center py-4">
                  <Users className="w-24 h-24 text-gray-300" />
                </div>
                <p className="text-lg font-medium text-gray-700">
                  Menunggu pemain...
                </p>
                <p className="text-sm text-gray-600">
                  Bagikan Game PIN untuk mengundang pemain bergabung
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {gameSession.participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        <AvatarImage
                          src={
                            (participant.profiles &&
                              (Array.isArray(participant.profiles)
                                ? participant.profiles[0]?.avatar_url
                                : participant.profiles?.avatar_url)) ||
                            `https://robohash.org/${encodeURIComponent(
                              participant.nickname
                            )}.png`
                          }
                          alt={participant.nickname}
                          className="object-cover w-full h-full"
                        />
                      </Avatar>
                      <span className="font-medium">
                        {participant.nickname}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(participant.joined_at).toLocaleTimeString(
                        "id-ID",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Chat Panel */}
      {user && gameSession && (
        <ChatPanel
          sessionId={gameSession.id}
          userId={user.id}
          nickname={displayName}
          avatarUrl={userProfile?.avatar_url}
          position="right"
          isHost={true}
        />
      )}
    </div>
  );
}

export default function HostGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <GamePageWithLoading 
      animation="slide"
      customLoadingMessage="Memuat ruang host..."
    >
      <HostGamePageContent params={params} />
    </GamePageWithLoading>
  );
}
