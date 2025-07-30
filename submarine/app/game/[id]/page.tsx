"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Square,
  Trophy,
  Timer,
  Slack,
  ChevronLeft,
  Loader,
  Gamepad2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GamePageWithLoading } from "@/components/ui/page-with-loading";

interface Participant {
  id: string;
  nickname: string;
  score: number;
  responsesCount?: number; // optional
}

interface Question {
  id: string;
  question_text: string;
  time_limit: number;
  points: number;
  order_index: number;
  answers: Array<{
    id: string;
    answer_text: string;
    is_correct: boolean;
    color: string;
    order_index: number;
  }>;
}

interface GameSession {
  id: string;
  status: string;
  quiz_id: string;
  current_question: number;
  total_time_minutes: number;
  started_at: string;
  ended_at: string | null;
}

interface Answer {
  id: string;
  answer_text: string;
  color: string;
  order_index: number;
}

interface GameState {
  sessionId: string;
  participantId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: string;
  questions: Question[];
  hasAnswered: boolean;
  score: number;
  rank: number;
  totalPlayers: number;
  totalTimeMinutes: number | null;
  gameStartTime: Date | null;
  timeLeft: number;
}

function GamePageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participant");

  // If there's a participant ID, this is a player view - redirect to player interface
  useEffect(() => {
    if (participantId) {
      // This should be handled by the player game interface
      router.replace(
        `/play-active/${resolvedParams.id}?participant=${participantId}`
      );
      return;
    }
  }, [participantId, resolvedParams.id, router]);

  // Host-only states
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!participantId) {
      const init = async () => {
        await fetchGameData(); // fetch semua data dulu
        const unsubscribe = setupRealTimeSubscription(); // baru setup listener

        // cleanup di unmount
        return () => {
          unsubscribe?.();
        };
      };

      init();
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [resolvedParams.id, participantId]);

  // Timer effect
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (
      gameSession &&
      gameSession.status === "active" &&
      gameSession.started_at
    ) {
      const updateTimer = () => {
        const now = new Date();
        const startTime = new Date(gameSession.started_at);
        const totalTimeMs = gameSession.total_time_minutes * 60 * 1000;
        const endTime = new Date(startTime.getTime() + totalTimeMs);
        const remaining = Math.max(0, endTime.getTime() - now.getTime());
        const timeLeftSeconds = Math.ceil(remaining / 1000);

        setTimeLeft(timeLeftSeconds);

        if (remaining <= 0) {
          // Time's up, end the game
          handleEndGame();
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameSession]);

  const fetchGameSession = useCallback(async () => {
    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", resolvedParams.id)
      .single();

    if (error) throw error;
    return data;
  }, [resolvedParams.id]);

  const fetchQuestions = useCallback(async (quizId: string) => {
    const { data, error } = await supabase
      .from("questions")
      .select(
        `
      id,
      question_text,
      time_limit,
      points,
      order_index,
      answers (
        id,
        answer_text,
        is_correct,
        color,
        order_index
      )
    `
      )
      .eq("quiz_id", quizId)
      .order("order_index");

    if (error) throw error;
    return data || [];
  }, []);

  const fetchParticipants = useCallback(async () => {
    const { data, error } = await supabase
      .from("game_participants")
      .select("id, nickname, score")
      .eq("session_id", resolvedParams.id)
      .order("score", { ascending: false });

    if (error) throw error;
    return data || [];
  }, [resolvedParams.id]);

  const fetchResponses = useCallback(async () => {
    const { data, error } = await supabase
      .from("game_responses")
      .select("participant_id, question_id, answer_id")
      .eq("session_id", resolvedParams.id);

    if (error) throw error;
    return data || [];
  }, [resolvedParams.id]);

  const updateParticipantProgress = useCallback(async () => {
    const [participantsData, responsesData] = await Promise.all([
      fetchParticipants(),
      fetchResponses(),
    ]);

    // Log untuk debugging
    console.log(
      "Responses data:",
      responsesData.map((r) => ({
        participant_id: r.participant_id,
        question_id: r.question_id,
        has_answer: !!r.answer_id,
      }))
    );

    // Hitung jumlah soal yang sudah dijawab (memiliki answer_id) per participant
    const responseMap = responsesData.reduce((acc, curr) => {
      // Hanya hitung jika ada answer_id (sudah dijawab)
      if (curr.answer_id) {
        acc[curr.participant_id] = (acc[curr.participant_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Log untuk debugging
    console.log("Response map (jawaban per participant):", responseMap);

    const updatedParticipants = participantsData.map((p) => ({
      ...p,
      responsesCount: responseMap[p.id] || 0,
    }));

    // Log untuk debugging
    console.log(
      "Updated participants with response count:",
      updatedParticipants
    );

    setParticipants(updatedParticipants);
  }, [fetchParticipants, fetchResponses]);

  const fetchGameData = useCallback(async () => {
    try {
      setLoading(true);

      const session = await fetchGameSession();
      const questions = await fetchQuestions(session.quiz_id);

      setGameSession(session);
      setQuestions(questions);
      await updateParticipantProgress(); // gabungkan peserta + response count
    } catch (error) {
      console.error("Error fetching game data:", error);
      toast.error("Gagal memuat data game");
    } finally {
      setLoading(false);
    }
  }, [fetchGameSession, fetchQuestions, updateParticipantProgress]);

  const setupRealTimeSubscription = useCallback(() => {
    const channel = supabase
      .channel(`game_control_${resolvedParams.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_responses",
          filter: `session_id=eq.${resolvedParams.id}`,
        },
        () => {
          updateParticipantProgress(); // hanya update progress
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
          updateParticipantProgress();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${resolvedParams.id}`,
        },
        () => {
          fetchGameData(); // reload full untuk timer / status
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedParams.id, updateParticipantProgress, fetchGameData]);

  // akhir mencoba progress
  useEffect(() => {
    if (gameSession?.status === "finished") {
      router.push(`/results/${resolvedParams.id}`);
    }
  }, [gameSession, resolvedParams.id, router]);

  useEffect(() => {
    const cleanup = setupRealTimeSubscription();
    return () => {
      cleanup();
    };
  }, [setupRealTimeSubscription]);

  const handleEndGame = useCallback(async () => {
    setIsEnding(true);
    try {
      // Update status game menjadi finished
      const { error } = await supabase
        .from("game_sessions")
        .update({
          status: "finished",
          ended_at: new Date().toISOString(),
        })
        .eq("id", resolvedParams.id);

      if (error) throw error;

      // Ambil data peserta terbaru
      const { data: latestParticipants, error: participantsError } =
        await supabase
          .from("game_participants")
          .select("id, nickname, score")
          .eq("session_id", resolvedParams.id);

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
                session_id_input: resolvedParams.id,
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

      toast.success("Game berakhir!");
      router.push(`/results/${resolvedParams.id}`);
    } catch (error) {
      console.error("Error ending game:", error);
      toast.error("Gagal mengakhiri game");
    } finally {
      setIsEnding(false);
    }
  }, [resolvedParams.id, router]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  // Show loading while redirecting players
  if (participantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center text-blue-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Mengarahkan ke game...</p>
        </div>
      </div>
    );
  }

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-[#105981] via-[#09799E] to-[#58B8CE] flex items-center justify-center">
  //       <div className="text-center text-white">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
  //         <p className="text-lg">Memuat kontrol game...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (!gameSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Game tidak ditemukan
            </h2>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-2 md:gap-0 md:flex-row items-center justify-between">
          <div className="w-full flex items-center justify-between relative md:justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/host/${resolvedParams.id}`)}
              className="border-2 border-gray-200 absolute left-0 z-10 md:relative md:z-auto"
            >
              <ChevronLeft className="w-4 h-4 md:mr-1" />
              <span className="hidden md:block">Kembali</span>
            </Button>
            <div className="flex gap-2 items-center justify-center w-full md:justify-start md:w-auto md:ml-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Game Control
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Game Timer */}
            <Badge
              variant="outline"
              className={`${
                timeLeft <= 60
                  ? "bg-red-100 text-red-800 border-red-300"
                  : timeLeft <= 300
                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                  : "bg-green-100 text-green-800 border-green-300"
              } text-lg px-4 py-2`}
            >
              <Timer className="w-4 h-4 mr-2" />
              {formatTime(timeLeft)}
            </Badge>
            <Badge
              variant="outline"
              className="bg-blue-100 text-blue-800 border-blue-300"
            >
              <Users className="w-3 h-3 mr-1" />
              {participants.length} pemain
            </Badge>
            <Badge
              variant="outline"
              className={`${
                gameSession.status === "active"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-red-100 text-red-800 border-red-300"
              }`}
            >
              {gameSession.status === "active" ? "Aktif" : "Selesai"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-2 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Game Timer Card */}
            <Card className="bg-white/90 backdrop-blur-sm mb-6 shadow-xl border-0">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex md:flex-col items-center justify-between md:gap-2">
                  <div className="flex items-center md:justify-center space-x-3 md:pr-12">
                    <Timer className="w-8 h-8 text-purple-600" />
                    <div className="md:text-center">
                      <h3 className="text-xl font-bold text-gray-900">
                        Timer Game
                      </h3>
                      <p className="text-gray-600">
                        Total waktu: {gameSession.total_time_minutes} menit
                      </p>
                    </div>
                  </div>
                  <div className="text-right md:text-center">
                    <div
                      className={`text-4xl font-bold ${
                        timeLeft <= 60
                          ? "text-red-600 animate-pulse"
                          : timeLeft <= 300
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {timeLeft <= 60
                        ? "SEGERA BERAKHIR!"
                        : timeLeft <= 300
                        ? "Waktu hampir habis"
                        : "Game berjalan"}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress
                    value={
                      gameSession.total_time_minutes
                        ? ((gameSession.total_time_minutes * 60 - timeLeft) /
                            (gameSession.total_time_minutes * 60)) *
                          100
                        : 0
                    }
                    className="h-3 bg-gray-200"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Game Controls */}
            <Card className="bg-white/90 backdrop-blur-sm mb-6 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Kontrol Game</span>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleEndGame}
                      disabled={isEnding}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      size="lg"
                    >
                      {isEnding ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Mengakhiri...
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Akhiri Game
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">
                      {questions.length}
                    </div>
                    <div className="text-sm text-gray-600">Total soal</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="text-2xl font-bold text-green-600">
                      {participants.length}
                    </div>
                    <div className="text-sm text-gray-600">Pemain Aktif</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.max(
                        0,
                        Math.floor(
                          (gameSession.total_time_minutes * 60 - timeLeft) / 60
                        )
                      )}
                      m
                    </div>
                    <div className="text-sm text-gray-600">Waktu Berlalu</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Leaderboard */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Loader className="w-5 h-5 text-blue-500" />
                <span>Progress Pemain</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada data pemain</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Semua Pemain dalam satu grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[...participants]
                      .sort(
                        (a, b) =>
                          (b.responsesCount || 0) - (a.responsesCount || 0)
                      )
                      .map((player, idx) => {
                        const progress =
                          questions.length > 0
                            ? ((player.responsesCount || 0) /
                                questions.length) *
                              100
                            : 0;

                        // Log untuk debugging
                        console.log(
                          `Player ${player.nickname} (rank ${idx + 1}): ${
                            player.responsesCount || 0
                          }/${questions.length} soal (${Math.round(progress)}%)`
                        );

                        return (
                          <motion.div
                            key={player.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                            className={`p-3 rounded-lg shadow-md ${
                              idx === 0
                                ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300"
                                : idx === 1
                                ? "bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300"
                                : idx === 2
                                ? "bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300"
                                : "bg-white border border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                    idx === 0
                                      ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                      : idx === 1
                                      ? "bg-gradient-to-r from-gray-500 to-gray-400"
                                      : idx === 2
                                      ? "bg-gradient-to-r from-blue-500 to-blue-400"
                                      : "bg-gradient-to-r from-blue-500 to-purple-600"
                                  }`}
                                >
                                  {idx + 1}
                                </div>
                                <h3 className="text-lg font-bold truncate max-w-[100px] sm:max-w-[120px] md:max-w-[80px] lg:max-w-[100px]">
                                  {player.nickname}
                                </h3>
                              </div>
                              <motion.div
                                className={`px-3 py-1 md:text-xs rounded-full md:text-center text-sm font-medium ${
                                  idx === 0
                                    ? "bg-yellow-200 text-yellow-800"
                                    : idx === 1
                                    ? "bg-gray-200 text-gray-800"
                                    : idx === 2
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.1, 1] }}
                                key={player.responsesCount}
                                transition={{ duration: 0.5 }}
                              >
                                {player.responsesCount || 0}/{questions.length}{" "}
                                soal
                              </motion.div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm font-medium">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <motion.div
                                className="w-full bg-gray-200 rounded-full h-4 overflow-hidden"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.5 }}
                              >
                                <motion.div
                                  className={`h-full rounded-full ${
                                    idx === 0
                                      ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                      : idx === 1
                                      ? "bg-gradient-to-r from-gray-500 to-gray-400"
                                      : idx === 2
                                      ? "bg-gradient-to-r from-blue-500 to-blue-400"
                                      : "bg-gradient-to-r from-blue-500 to-purple-600"
                                  }`}
                                  initial={{ width: "0%" }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 25,
                                  }}
                                ></motion.div>
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <GamePageWithLoading 
      animation="zoom"
      customLoadingMessage="Memuat permainan..."
    >
      <GamePageContent params={params} />
    </GamePageWithLoading>
  );
}
