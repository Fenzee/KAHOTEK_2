"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Users, Trophy, AlertCircle, Play, ArrowLeft } from "lucide-react";
import { use } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ChatPanel } from "@/components/ui/chat-panel";
import { GamePageWithLoading } from "@/components/ui/page-with-loading";

interface GameSession {
  id: string;
  quiz_id: string;
  status: string;
  started_at: string | null;
  total_time_minutes: number | null;
  countdown_started_at?: string | null;
  game_pin: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question_text: string;
    time_limit: number;
    points: number;
  }>;
}

interface Participant {
  id: string;
  nickname: string;
  score: number;
  profiles?:
    | {
        avatar_url?: string | null;
      }
    | Array<{
        avatar_url?: string | null;
      }>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PlayGamePageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participant");

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string>("");
  const [countdownLeft, setCountdownLeft] = useState<number | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  // Use refs to prevent infinite loops

  const fetchGameData = useCallback(async () => {
    try {
      // Fetch game session
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Game session tidak ditemukan");
        return;
      }

      setGameSession(session);

      // Check if status changed to active and redirect if needed
      if (session.status === "active" && lastStatusRef.current === "waiting") {
        setGameStarted(true);
      }

      // Check if game finished and redirect to results
      if (session.status === "finished") {
        router.push(
          `/results/${resolvedParams.id}?participant=${participantId}`
        );
        return;
      }

      lastStatusRef.current = session.status;

      // Fetch quiz data
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select(
          `
          id,
          title,
          description,
          questions (
            id,
            question_text,
            time_limit,
            points
            )
            `
        )
        .eq("id", session.quiz_id)
        .single();

      if (quizError) {
        console.error("Quiz error:", quizError);
        setError("Quiz tidak ditemukan");
        return;
      }

      setQuiz(quizData);

      // Fetch participants
      const { data: participantsData, error: participantsError } =
        await supabase
          .from("game_participants")
          .select("id, nickname, score, profiles(avatar_url)")
          .eq("session_id", resolvedParams.id)
          .order("score", { ascending: false });

      if (participantsError) {
        console.error("Participants error:", participantsError);
      } else {
        setParticipants(participantsData || []);
      }
    } catch (error) {
      console.error("Error fetching game data:", error);
      setError("Gagal memuat data game");
    }
  }, [resolvedParams.id, participantId, router]);

  // Initial data fetch
  useEffect(() => {
    if (!participantId) {
      router.push("/join");
      return;
    }

    fetchGameData().finally(() => {
      setLoading(false);
      router.prefetch(
        `/play-active/${resolvedParams.id}?participant=${participantId}`
      );
    });
  }, [participantId, fetchGameData, router]);

  // Setup real-time subscription for game status changes
  useEffect(() => {
    const channel = supabase
      .channel(`play_game_${resolvedParams.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${resolvedParams.id}`,
        },
        (payload) => {
          console.log("Game session updated:", payload);
          fetchGameData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_participants",
          filter: `session_id=eq.${resolvedParams.id}`,
        },
        () => {
          fetchGameData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedParams.id, fetchGameData]);

  // Setup polling for waiting games
  useEffect(() => {
    // Clear existing poll
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (gameSession?.status === "waiting") {
      pollIntervalRef.current = setInterval(fetchGameData, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [gameSession?.status, fetchGameData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      gameSession?.status === "active" &&
      gameSession?.started_at &&
      gameSession?.countdown_started_at &&
      participantId
    ) {
      router.prefetch(
        `/play-active/${resolvedParams.id}?participant=${participantId}`
      );
      const startTime = new Date(gameSession.started_at).getTime();
      const now = Date.now();
      const timeLeft = Math.ceil((startTime - now) / 1000);
      setCountdownLeft(timeLeft);

      const interval = setInterval(() => {
        setCountdownLeft((prev) => {
          if (prev && prev > 1) return prev - 1;

          return 0;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameSession, participantId, resolvedParams.id, router]);

  useEffect(() => {
    if (countdownLeft === 0) {
      router.push(
        `/play-active/${resolvedParams.id}?participant=${participantId}`
      );
    }
  }, [countdownLeft, participantId, resolvedParams.id, router]);

  const leaveGame = async () => {
    if (!participantId || !gameSession) return;

    try {
      // Hapus peserta dari game
      const { error } = await supabase
        .from("game_participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;

      // Arahkan ke dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error leaving game:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#105981] via-[#09799E] to-[#58B8CE] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Memuat Game...</h2>
          <p className="text-white/80">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg rounded-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => router.push("/join")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Kembali ke Join
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameSession || !quiz) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg rounded-xl">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Game tidak ditemukan
            </h2>
            <Button
              onClick={() => router.push("/join")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Kembali ke Join
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {gameSession.status === "active" &&
      countdownLeft !== null &&
      countdownLeft > 0 ? (
        <Card className="bg-white shadow-lg rounded-xl p-6 min-h-screen">
          <CardContent className="p-8 min-h-screen text-center flex flex-col items-center justify-center">
            <h2 className="text-4xl font-bold text-purple-700 mb-2">
              Mulai dalam {countdownLeft} detik...
            </h2>
            <p className="text-gray-600">Bersiaplah!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col min-h-screen">
          <header className="flex items-center justify-between px-4 py-4 md:px-6 lg:px-8 border-b">
            <Link
              href="#"
              className="flex items-center gap-2 font-bold text-lg"
              prefetch={false}
            >
              <Trophy className="h-6 w-6 text-purple-600" />
              <span>GolekQuiz</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-gray-700">
                <Users className="w-3 h-3 mr-1" />
                {participants.length} pemain
              </Badge>
              <Badge
                className={`${
                  gameSession.status === "waiting"
                    ? "bg-purple-600"
                    : gameSession.status === "active"
                    ? "bg-green-500"
                    : "bg-red-500"
                } text-white`}
              >
                {gameSession.status === "waiting"
                  ? "Menunggu"
                  : gameSession.status === "active"
                  ? "Aktif"
                  : "Selesai"}
              </Badge>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8 md:py-12 lg:py-16 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column - Quiz Info */}
              <div className="md:col-span-5 lg:col-span-4 space-y-6">
                <Card className="bg-white shadow-lg rounded-xl p-6">
                  <CardHeader className="pb-4 px-0 pt-0">
                    <CardTitle className="text-xl font-semibold text-center">
                      {quiz.title}
                    </CardTitle>
                    {quiz.description && (
                      <p className="text-gray-600 text-center text-sm">
                        {quiz.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">
                          {quiz.questions.length}
                        </div>
                        <div className="text-sm text-gray-600">Pertanyaan</div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">
                          {participants.length}
                        </div>
                        <div className="text-sm text-gray-600">Pemain</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          {gameSession.total_time_minutes || "-"}
                        </div>
                        <div className="text-sm text-gray-600">Menit Total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Status */}
                {gameSession.status === "waiting" && countdownLeft === null && (
                  <Card className="bg-white shadow-lg rounded-xl p-6 text-center">
                    <CardContent className="px-0 pb-0 space-y-6">
                      <div className="flex justify-center">
                        <Play className="w-24 h-24 text-purple-600" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Menunggu Host Memulai Game
                      </h2>
                      <p className="text-base text-gray-600">
                        Game akan dimulai sebentar lagi...
                      </p>
                      <p className="text-lg font-semibold text-purple-600">
                        Game PIN: {gameSession.game_pin}
                      </p>

                      {/* Tombol Kembali */}
                      <Button
                        onClick={leaveGame}
                        variant="outline"
                        className="mt-4 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Keluar dari Game
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Leaderboard */}
              <div className="md:col-span-7 lg:col-span-8">
                <Card className="bg-white shadow-lg rounded-xl p-6 h-full">
                  <CardHeader className="pb-4 px-0 pt-0">
                    <CardTitle className="text-xl font-semibold">
                      Waiting room
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    {participants.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Belum ada pemain yang bergabung</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {participants.map((participant, index) => (
                          <div
                            key={participant.id}
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              index === 0
                                ? "bg-yellow-50"
                                : index === 1
                                ? "bg-gray-50"
                                : index === 2
                                ? "bg-orange-50"
                                : "bg-gray-50"
                            }`}
                          >
                            <Avatar className="h-10 w-10 border-2 border-yellow-300">
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
                              <AvatarFallback className="bg-white text-purple-600 text-sm font-semibold">
                                {getInitials(participant.nickname)}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`font-medium text-gray-800 ${
                                participant.id === participantId
                                  ? "italic underline"
                                  : ""
                              }`}
                            >
                              {participant.nickname}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>

          {/* Chat Panel */}
          {participantId && gameSession && (
            <ChatPanel
              sessionId={gameSession.id}
              userId={null}
              nickname={
                participants.find((p) => p.id === participantId)?.nickname ||
                "Player"
              }
              avatarUrl={(() => {
                const participant = participants.find(
                  (p) => p.id === participantId
                );
                if (!participant || !participant.profiles) return null;
                return Array.isArray(participant.profiles)
                  ? participant.profiles[0]?.avatar_url
                  : participant.profiles?.avatar_url;
              })()}
              position="right"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function PlayGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <GamePageWithLoading 
      animation="zoom"
      customLoadingMessage="Memuat ruang permainan..."
    >
      <PlayGamePageContent params={params} />
    </GamePageWithLoading>
  );
}
