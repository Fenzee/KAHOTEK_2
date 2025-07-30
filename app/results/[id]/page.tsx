"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QuestionImageTooltip } from "@/components/ui/question-image-tooltip";
import { AnswerTooltip } from "@/components/ui/answer-tooltip";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import {
  Trophy,
  Medal,
  Award,
  Users,
  Target,
  Clock,
  TrendingUp,
  Download,
  Share2,
  Home,
  BarChart3,
  CheckCircle,
  XCircle,
  HelpCircle,
  LayoutDashboard,
  Crown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GamePageWithLoading } from "@/components/ui/page-with-loading";

interface GameSession {
  id: string;
  quiz_id: string;
  host_id: string;
  // game_pin: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  quiz: {
    title: string;
    description: string | null;
  };
}

interface Participant {
  id: string;
  nickname: string;
  score: number;
  joined_at: string;
  user_id: string | null;
  profiles?:
    | {
        avatar_url: string | null;
      }
    | Array<{
        avatar_url: string | null;
      }>
    | null;
  avg_response_time?: number; // Tambahkan field untuk rata-rata waktu pengerjaan
  rank?: number; // Tambahkan field untuk peringkat
}

// Interface untuk hasil dari RPC get_leaderboard_with_tiebreaker
interface LeaderboardEntry {
  participant_id: string;
  nickname: string;
  score: number;
  avg_time: number;
  rank: number;
  user_id?: string | null; // Tambahkan user_id
}

interface QuestionStats {
  question_id: string;
  question_text: string;
  total_responses: number;
  correct_responses: number;
  average_time: number;
  points: number;
  image_url: string | null;
  correct_answer: string | null;
  answer_image_url: string | null; // Add this field for answer images
}

interface PersonalStats {
  total_questions: number;
  correct_answers: number;
  total_points: number;
  average_time: number;
  fastest_answer: number;
  rank: number;
  total_participants: number;
  question_details?: Array<{
    question_id: string;
    question_text: string;
    image_url: string | null;
    answer_image_url: string | null;
    correct_answer: string | null;
    is_correct: boolean;
    response_time?: number; // Tambahkan response_time
  }>;
}

function ResultsPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const participantId = searchParams.get("participant");

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(
    null
  );
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showAnswerDetails, setShowAnswerDetails] = useState(false);

  // useEffect(() => {
  //   if (
  //     gameSession &&
  //     participants.length > 0 &&
  //     user?.id &&
  //     gameSession.quiz_id
  //   ) {
  //     fetchPersonalStats(user.id, participants, gameSession.quiz_id);
  //   }
  // }, [gameSession, participants, user]);

  // useEffect(() => {
  //   if (
  //     gameSession &&
  //     participants.length > 0 &&
  //     user?.id &&
  //     gameSession.quiz_id
  //   ) {
  //     console.log("User ID:", user.id);
  //     console.log("Participants:", participants);
  //     fetchPersonalStats(user.id, participants, gameSession.quiz_id);
  //   } else {
  //     console.log("⛔ Belum siap: ", {
  //       gameSession,
  //       participantsLength: participants.length,
  //       userId: user?.id,
  //     });
  //   }
  // }, [gameSession, participants, user]);

  useEffect(() => {
    fetchResults();
  }, [resolvedParams.id, user, participantId]);

  // Tambahkan useEffect untuk log personalStats
  useEffect(() => {
    if (personalStats) {
      console.log("PersonalStats updated:", {
        rank: personalStats.rank,
        total: personalStats.total_participants,
        score: personalStats.total_points,
      });
    }
  }, [personalStats]);

  const fetchResults = async () => {
    try {
      console.log("Fetching results for session:", resolvedParams.id);
      console.log("User:", user);
      console.log("Participant ID:", participantId);

      //test
      const fetchParticipants = async () => {
        const { data, error } = await supabase
          .from("game_participants")
          .select("*")
          .eq("session_id", resolvedParams.id);

        if (error) {
          console.error("Gagal mengambil participants:", error);
        } else {
          console.log("✅ Participants berhasil dimuat:", data);
          setParticipants(data);
        }
      };
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .select(
          `
          id,
          quiz_id,
          host_id,
          status,
          started_at,
          ended_at,
          quiz:quizzes (
            title,
            description
          )
        `
        )
        .eq("id", resolvedParams.id)
        .single();

      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        throw new Error("Game session tidak ditemukan");
      }

      console.log("Game session:", session);
      // setGameSession({
      //   ...session,
      //   quiz: session.quizzes[0],
      // } as GameSession);
      setGameSession(session as unknown as GameSession);

      const userIsHost = user ? session.host_id === user.id : false;
      setIsHost(userIsHost);

      let participantsData: Participant[] = [];
      let leaderboardEntries: LeaderboardEntry[] = [];

      // Gunakan fungsi get_leaderboard_with_tiebreaker untuk mendapatkan data peserta dengan rata-rata waktu
      try {
        const { data: leaderboardData, error: leaderboardError } =
          await supabase.rpc("get_leaderboard_with_tiebreaker", {
            session_id_input: resolvedParams.id,
          });

        if (leaderboardError) {
          console.error(
            "Error fetching leaderboard with tiebreaker:",
            leaderboardError
          );

          // Fallback ke cara lama jika fungsi RPC tidak tersedia
          const { data: fallbackData, error: participantsError } =
            await supabase
              .from("game_participants")
              .select(
                `
      id,
      nickname,
      score,
      joined_at,
      user_id,
      profiles (
        avatar_url
      )
    `
              )
              .eq("session_id", resolvedParams.id)
              .order("score", { ascending: false });

          if (participantsError) {
            console.error("Error fetching participants:", participantsError);
            throw new Error("Gagal memuat data peserta");
          }

          participantsData = fallbackData as Participant[];
        } else {
          // Simpan data leaderboard asli untuk digunakan nanti
          leaderboardEntries = leaderboardData;
          console.log("Leaderboard entries with rank:", leaderboardEntries);

          // Transformasi data leaderboard ke format yang sesuai dengan interface Participant
          const transformedParticipants = await Promise.all(
            leaderboardData.map(async (entry: LeaderboardEntry) => {
              // Ambil data profil untuk setiap peserta
              let avatarUrl = null;

              // Ambil user_id dari game_participants
              const { data: participantData } = await supabase
                .from("game_participants")
                .select("user_id")
                .eq("id", entry.participant_id)
                .single();

              const userId = participantData?.user_id;

              // Jika ada user_id, ambil avatar dari profiles
              if (userId) {
                const { data: profileData } = await supabase
                  .from("profiles")
                  .select("avatar_url")
                  .eq("id", userId)
                  .single();

                avatarUrl = profileData?.avatar_url;
              }

              return {
                id: entry.participant_id,
                nickname: entry.nickname,
                score: entry.score,
                joined_at: "", // Tidak digunakan lagi
                user_id: userId,
                avg_response_time: entry.avg_time,
                profiles: {
                  avatar_url: avatarUrl,
                },
                rank: entry.rank, // Tambahkan rank dari leaderboard
              };
            })
          );

          console.log(
            "Leaderboard with avg times and avatars:",
            transformedParticipants
          );
          participantsData = transformedParticipants;
        }

        console.log("Participants data:", participantsData);
        setParticipants(participantsData);
      } catch (error) {
        console.error("Error processing participants:", error);
        throw new Error("Gagal memproses data peserta");
      }

      if (userIsHost) {
        await fetchQuestionStats(session.quiz_id);
      }

      if (participantId) {
        // Log untuk debugging
        console.log(
          "Participant data before fetchPersonalStats:",
          participantsData.find((p) => p.id === participantId)
        );

        await fetchPersonalStats(
          participantId,
          participantsData,
          session.quiz_id
        );
      }
    } catch (error: any) {
      console.error("Error fetching results:", error);
      setError(error.message || "Terjadi kesalahan saat memuat hasil");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionStats = async (quizId: string) => {
    try {
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, question_text, points, image_url")
        .eq("quiz_id", quizId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;

      const stats: QuestionStats[] = [];

      for (const question of questions) {
        const { data: responses, error: responsesError } = await supabase
          .from("game_responses")
          .select(
            `
            *,
            answers (
              is_correct
            )
          `
          )
          .eq("session_id", resolvedParams.id)
          .eq("question_id", question.id);

        if (responsesError) continue;

        // Get correct answer
        const { data: answers, error: answersError } = await supabase
          .from("answers")
          .select("answer_text, image_url")
          .eq("question_id", question.id)
          .eq("is_correct", true)
          .single();

        const correctAnswer = answersError ? null : answers?.answer_text;
        const answerImageUrl = answersError ? null : answers?.image_url;

        const totalResponses = responses.length;
        const correctResponses = responses.filter(
          (r) => r.answers?.is_correct
        ).length;
        const averageTime =
          responses.length > 0
            ? responses.reduce((sum, r) => sum + (r.response_time || 0), 0) /
              responses.length /
              1000
            : 0;

        stats.push({
          question_id: question.id,
          question_text: question.question_text,
          total_responses: totalResponses,
          correct_responses: correctResponses,
          average_time: Math.round(averageTime),
          points: question.points,
          image_url: question.image_url,
          correct_answer: correctAnswer,
          answer_image_url: answerImageUrl,
        });
      }

      setQuestionStats(stats);
    } catch (error) {
      console.error("Error fetching question stats:", error);
    }
  };

  const fetchPersonalStats = async (
    participantId: string,
    allParticipants: Participant[],
    quizId: string
  ) => {
    try {
      // Cari participant dalam data leaderboard
      const participant = allParticipants.find((p) => p.id === participantId);
      if (!participant) throw new Error("Participant tidak ditemukan");

      // Log untuk debugging
      console.log("Found participant in leaderboard:", {
        id: participant.id,
        nickname: participant.nickname,
        score: participant.score,
        rank: participant.rank,
      });

      const { data: responses, error: responsesError } = await supabase
        .from("game_responses")
        .select(
          `
          *,
          answers (
            is_correct,
            answer_text
          ),
          questions (
            id,
            question_text,
            image_url
          )
        `
        )
        .eq("session_id", resolvedParams.id)
        .eq("participant_id", participantId);

      if (responsesError) throw responsesError;

      // 🆕 Tambahkan bagian ini
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id")
        .eq("quiz_id", quizId);

      if (questionsError) throw questionsError;

      const totalQuestions = questions.length;
      // ⬆️

      const correctAnswers = responses.filter(
        (r) => r.answers?.is_correct
      ).length;
      const totalPoints = participant.score;

      // Hitung rata-rata waktu berdasarkan started_at dan ended_at
      let totalTime = 0;
      let validTimeCount = 0;
      let fastestTime = Number.MAX_VALUE;

      for (const response of responses) {
        if (response.started_at && response.ended_at) {
          const startTime = new Date(response.started_at);
          const endTime = new Date(response.ended_at);
          const timeDiffSeconds =
            (endTime.getTime() - startTime.getTime()) / 1000;

          if (timeDiffSeconds > 0) {
            totalTime += timeDiffSeconds;
            validTimeCount++;

            if (timeDiffSeconds < fastestTime) {
              fastestTime = timeDiffSeconds;
            }
          }
        }
      }

      const averageTime =
        validTimeCount > 0 ? Math.round(totalTime / validTimeCount) : 0;
      const fastestAnswer =
        fastestTime !== Number.MAX_VALUE ? Math.round(fastestTime) : 0;

      // Gunakan rank dari participant jika tersedia, atau cari dari leaderboard
      let rank;

      // Jika participant memiliki rank dari leaderboard, gunakan itu
      if (participant.rank !== undefined) {
        rank = participant.rank;
        console.log("Using rank from leaderboard:", rank);
      } else {
        // Fallback ke cara lama jika tidak ada rank
        const participantsWithHigherScores = allParticipants.filter(
          (p) => p.score > participant.score
        );
        rank = participantsWithHigherScores.length + 1;
        console.log("Calculated rank fallback:", rank);
      }

      // Fetch correct answers with images for each question
      const questionDetails: Array<{
        question_id: string;
        question_text: string;
        image_url: string | null;
        answer_image_url: string | null;
        correct_answer: string | null;
        is_correct: boolean;
        response_time?: number;
      }> = [];

      // Tambahkan Set untuk melacak pertanyaan yang sudah diproses
      const processedQuestionIds = new Set<string>();

      for (const response of responses) {
        const questionId = response.question_id;

        // Skip jika pertanyaan ini sudah diproses sebelumnya
        if (processedQuestionIds.has(questionId)) {
          console.log(`Skipping duplicate question: ${questionId}`);
          continue;
        }

        // Tandai pertanyaan ini sebagai sudah diproses
        processedQuestionIds.add(questionId);

        // Hitung waktu pengerjaan untuk soal ini
        let responseTime: number | undefined = undefined;
        if (response.started_at && response.ended_at) {
          const startTime = new Date(response.started_at);
          const endTime = new Date(response.ended_at);
          responseTime = Math.round(
            (endTime.getTime() - startTime.getTime()) / 1000
          );
        }

        // Get correct answer with image
        const { data: correctAnswerData, error: answerError } = await supabase
          .from("answers")
          .select("answer_text, image_url")
          .eq("question_id", questionId)
          .eq("is_correct", true)
          .single();

        if (!answerError && correctAnswerData) {
          questionDetails.push({
            question_id: questionId,
            question_text: response.questions?.question_text || "",
            image_url: response.questions?.image_url || null,
            answer_image_url: correctAnswerData.image_url,
            correct_answer: correctAnswerData.answer_text,
            is_correct: response.answers?.is_correct || false,
            response_time: responseTime,
          });
        }
      }

      // Urutkan detail pertanyaan berdasarkan question_id untuk konsistensi
      questionDetails.sort((a, b) =>
        a.question_id.localeCompare(b.question_id)
      );

      setPersonalStats({
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        total_points: totalPoints,
        average_time: averageTime,
        fastest_answer: fastestAnswer,
        rank,
        total_participants: allParticipants.length,
        question_details: questionDetails,
      });

      console.log("Personal stats with rank:", {
        participantId,
        participantRank: participant.rank,
        calculatedRank: rank,
        participantScore: participant.score,
        allParticipants: allParticipants.map((p) => ({
          id: p.id,
          score: p.score,
          rank: p.rank,
        })),
      });
    } catch (error) {
      console.error("Error fetching personal stats:", error);
    }
  };

  const exportResults = async () => {
    if (!gameSession || !isHost) return;

    try {
      const csvContent = [
        ["Rank", "Nickname", "Score", "Joined At"],
        ...participants.map((p, index) => [
          index + 1,
          p.nickname,
          p.score,
          new Date(p.joined_at).toLocaleString("id-ID"),
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${gameSession.quiz.title}_results.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting results:", error);
    }
  };

  const shareResults = async () => {
    if (!personalStats) return;

    const shareText = `🎉 Saya mendapat peringkat #${personalStats.rank} dari ${personalStats.total_participants} pemain dengan ${personalStats.total_points} poin di MyLessons!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hasil MyLessons",
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Hasil berhasil disalin ke clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg">Memuat hasil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg rounded-xl">
          <CardContent className="p-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Terjadi Kesalahan
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => router.push("/join")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg rounded-xl">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Hasil tidak ditemukan
            </h2>
            <p className="text-gray-600 mb-4">
              Sesi game tidak valid atau sudah berakhir.
            </p>
            <Button
              onClick={() => router.push("/join")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topThree = participants.slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* Confetti Animation Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 left-1/4 w-4 h-4 bg-yellow-500 rounded-full animate-confetti-fall-slow"></div>
        <div className="absolute -top-10 left-1/3 w-3 h-3 bg-purple-500 rounded-full animate-confetti-fall-medium"></div>
        <div className="absolute -top-10 left-1/2 w-5 h-5 bg-blue-500 rounded-full animate-confetti-fall-fast"></div>
        <div className="absolute -top-10 left-2/3 w-4 h-4 bg-green-500 rounded-full animate-confetti-fall-slow"></div>
        <div className="absolute -top-10 left-3/4 w-3 h-3 bg-red-500 rounded-full animate-confetti-fall-medium"></div>
        <div className="absolute -top-10 left-10 w-2 h-2 bg-pink-500 rounded-full animate-confetti-fall-fast"></div>
        <div className="absolute -top-10 right-10 w-6 h-6 bg-indigo-500 rounded-full animate-confetti-fall-slow"></div>
        <div className="absolute -top-10 right-1/4 w-3 h-3 bg-yellow-300 rounded-full animate-confetti-fall-medium"></div>
        <div className="absolute -top-10 right-1/3 w-4 h-4 bg-purple-300 rounded-full animate-confetti-fall-fast"></div>
        <div className="absolute -top-10 right-1/2 w-5 h-5 bg-blue-300 rounded-full animate-confetti-fall-slow"></div>
        <div className="absolute -top-10 right-2/3 w-3 h-3 bg-green-300 rounded-full animate-confetti-fall-medium"></div>
        <div className="absolute -top-10 right-3/4 w-4 h-4 bg-red-300 rounded-full animate-confetti-fall-fast"></div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 md:px-6 lg:px-8 border-b">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-purple-600 animate-bounce" />
          <div className="flex flex-col">
            <span className="font-bold text-lg">Hasil Game</span>
            <span className="text-sm text-gray-500">
              {gameSession.quiz.title}
            </span>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          {isHost ? (
            <>
              <Button
                onClick={exportResults}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent transition-all hover:scale-105"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent transition-all hover:scale-105"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </>
          ) : (
            <>
              {personalStats && (
                <Button
                  onClick={shareResults}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent transition-all hover:scale-105"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Bagikan
                </Button>
              )}
              <Button
                onClick={() => router.push("/join")}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent transition-all hover:scale-105"
              >
                <Home className="w-4 h-4 mr-2" />
                Main Lagi
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-4 pb-8 md:pb-12 lg:pb-16 space-y-8">
        {topThree.length > 0 && (
          <Card className="bg-white shadow-lg rounded-xl p-6 transform transition-all hover:shadow-xl">
            <CardHeader className="pb-4 px-0 pt-0 flex flex-row items-center justify-center gap-2">
              <Award className="w-6 h-6 text-yellow-500 animate-pulse" />
              <CardTitle className="text-xl font-semibold">
                Podium Pemenang
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-4">
              <div className="flex items-end justify-center space-x-4">
                {topThree[1] && (
                  <div className="flex flex-col items-center text-center transform transition-all hover:scale-105">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center mb-2 animate-bounce-slow">
                      <span className="text-4xl">🥈</span>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 h-24 flex flex-col justify-center shadow-md hover:shadow-lg transition-shadow">
                      <div className="font-bold text-gray-800">
                        {topThree[1].nickname}
                      </div>
                      <div className="text-2xl font-bold text-gray-600 animate-number-pop">
                        {topThree[1].score.toLocaleString()}
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700 mt-1">
                        🥈 2nd
                      </Badge>
                    </div>
                  </div>
                )}

                {topThree[0] && (
                  <div className="flex flex-col items-center text-center transform transition-all hover:scale-105 z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-2 animate-bounce">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 h-32 flex flex-col justify-center border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="font-bold text-yellow-800">
                        {topThree[0].nickname}
                      </div>
                      <div className="text-3xl font-bold text-yellow-600 animate-number-pop">
                        {topThree[0].score.toLocaleString()}
                      </div>
                      <Badge className="bg-yellow-400 text-white mt-1">
                        🥇 1st
                      </Badge>
                    </div>
                  </div>
                )}

                {topThree[2] && (
                  <div className="flex flex-col items-center text-center transform transition-all hover:scale-105">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center mb-2 animate-bounce-slow">
                      <span className="text-4xl">🥉</span>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 h-24 flex flex-col justify-center shadow-md hover:shadow-lg transition-shadow">
                      <div className="font-bold text-amber-800">
                        {topThree[2].nickname}
                      </div>
                      <div className="text-2xl font-bold text-amber-600 animate-number-pop">
                        {topThree[2].score.toLocaleString()}
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700 mt-1">
                        🥉 3rd
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard and Game Summary in grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white shadow-lg rounded-xl p-6 transform transition-all hover:shadow-xl lg:col-span-2">
            <CardHeader className="pb-4 px-0 pt-0 flex flex-row items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-xl font-semibold">
                Leaderboard ({participants.length} Pemain)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div
                className={`space-y-3 ${
                  participants.length > 5
                    ? "max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                    : ""
                }`}
              >
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      index < 3
                        ? "bg-yellow-50 hover:bg-yellow-100"
                        : "bg-gray-50 hover:bg-gray-100"
                    } transform hover:scale-[1.01] hover:shadow-md ${
                      participant.id === participantId
                        ? "ring-2 ring-purple-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold text-lg ${
                          index === 0
                            ? "text-yellow-800"
                            : index === 1
                            ? "text-gray-600"
                            : index === 2
                            ? "text-amber-800"
                            : "text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index === 0
                            ? "bg-yellow-400 text-white"
                            : index === 1
                            ? "bg-gray-300 text-white"
                            : index === 2
                            ? "bg-amber-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        <Avatar className="w-10 h-10 border-2 border-white shadow">
                          <AvatarImage
                            src={
                              // Handle profiles yang bisa jadi objek atau array
                              (() => {
                                if (!participant.profiles) return null;
                                if (Array.isArray(participant.profiles)) {
                                  return (
                                    participant.profiles[0]?.avatar_url || null
                                  );
                                }
                                return participant.profiles.avatar_url;
                              })() ||
                              `https://robohash.org/${encodeURIComponent(
                                participant.nickname
                              )}.png`
                            }
                            className="object-cover w-full h-full"
                            alt={participant.nickname}
                          />
                          <AvatarFallback className="bg-gray-300 text-white text-sm font-semibold">
                            {participant.nickname.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                          {participant.nickname}
                        </span>
                        <span className="text-xs text-gray-500">
                          {participant.avg_response_time !== undefined
                            ? `Waktu: ${participant.avg_response_time.toFixed(
                                1
                              )} detik`
                            : `Bergabung: ${new Date(
                                participant.joined_at
                              ).toLocaleTimeString("id-ID")}`}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-lg text-gray-800 animate-number-pop">
                      {participant.score.toLocaleString()} poin
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg rounded-xl p-6 transform transition-all hover:shadow-xl">
            <CardHeader className="pb-4 px-0 pt-0 flex flex-row items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-xl font-semibold">
                Ringkasan Game
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex flex-col items-center transform transition-all hover:scale-105 hover:from-blue-100 hover:to-blue-200 shadow-sm">
                  <Users className="w-8 h-8 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-blue-600 animate-number-pop">
                    {participants.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Pemain</div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex flex-col items-center transform transition-all hover:scale-105 hover:from-green-100 hover:to-green-200 shadow-sm">
                  <HelpCircle className="w-8 h-8 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-600 animate-number-pop">
                    {isHost
                      ? questionStats.length
                      : personalStats?.total_questions ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Pertanyaan</div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex flex-col items-center transform transition-all hover:scale-105 hover:from-purple-100 hover:to-purple-200 shadow-sm">
                  <Trophy className="w-8 h-8 text-purple-600 mb-2" />
                  <div className="text-2xl font-bold text-purple-600 animate-number-pop">
                    {participants.length > 0
                      ? Math.max(
                          ...participants.map((p) => p.score)
                        ).toLocaleString()
                      : 0}
                  </div>
                  <div className="text-sm text-gray-600">Skor Tertinggi</div>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg flex flex-col items-center transform transition-all hover:scale-105 hover:from-orange-100 hover:to-orange-200 shadow-sm">
                  <Clock className="w-8 h-8 text-orange-600 mb-2" />
                  <div className="text-2xl font-bold text-orange-600 animate-number-pop">
                    {gameSession.ended_at && gameSession.started_at
                      ? Math.round(
                          (new Date(gameSession.ended_at).getTime() -
                            new Date(gameSession.started_at).getTime()) /
                            60000
                        )
                      : "0"}
                  </div>
                  <div className="text-sm text-gray-600">Durasi (menit)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isHost && questionStats.length > 0 && (
          <Card className="bg-white shadow-lg rounded-xl p-6 transform transition-all hover:shadow-xl">
            <CardHeader className="pb-4 px-0 pt-0 flex flex-row items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-xl font-semibold">
                Statistik Pertanyaan
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {questionStats.map((stat, index) => (
                  <div
                    key={stat.question_id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-all hover:border-purple-200 transform hover:scale-[1.01] ${
                      questionStats.length % 2 !== 0 &&
                      index === questionStats.length - 1
                        ? "md:col-span-2 max-w-xl mx-auto w-full"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap justify-between items-center mb-3 gap-2 pb-2 border-b border-gray-100">
                      <h3 className="text-base font-semibold flex items-center flex-wrap">
                        <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="break-words">
                          {stat.question_text}
                        </span>
                        {stat.image_url && (
                          <span className="ml-2 text-blue-500 flex-shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              ></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                          </span>
                        )}
                        {stat.answer_image_url && (
                          <span className="ml-1 text-green-500 flex-shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h14"></path>
                              <path d="M12 5v14"></path>
                            </svg>
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex-shrink-0">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{stat.total_responses}</span>
                        </div>
                        <div className="flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full flex-shrink-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span>{stat.correct_responses}</span>
                        </div>
                        <Badge className="bg-gray-100 text-gray-700 flex-shrink-0">
                          {stat.points} poin
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      {stat.image_url && (
                        <div className="flex justify-center items-center my-3 w-full">
                          <QuestionImageTooltip
                            imageUrl={stat.image_url}
                            correctAnswer={stat.correct_answer}
                            onClick={() => setPreviewImage(stat.image_url)}
                          />
                        </div>
                      )}

                      {/* Always display the correct answer */}
                      <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-100">
                        <p className="text-xs text-gray-600 mb-1 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                          Jawaban Benar:
                        </p>

                        {stat.answer_image_url && (
                          <div className="mb-2 flex justify-center">
                            <div
                              className="relative w-full max-w-[200px] h-28 overflow-hidden rounded-lg border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() =>
                                setPreviewImage(stat.answer_image_url)
                              }
                            >
                              <Image
                                src={stat.answer_image_url}
                                alt="Answer image"
                                className="object-contain"
                                fill
                                sizes="(max-width: 768px) 100vw, 200px"
                              />
                            </div>
                          </div>
                        )}

                        {stat.correct_answer && (
                          <p className="text-sm text-green-800 font-medium">
                            {stat.correct_answer}
                          </p>
                        )}
                      </div>

                      {stat.total_responses > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">
                              Tingkat Kebenaran
                            </span>
                            <span className="font-medium text-gray-700">
                              {Math.round(
                                (stat.correct_responses /
                                  stat.total_responses) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-400 animate-progress-bar"
                              style={{
                                width: `${Math.round(
                                  (stat.correct_responses /
                                    stat.total_responses) *
                                    100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {personalStats && !isHost && (
          <Card className="bg-white shadow-lg rounded-xl p-6 transform transition-all hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="text-center">
              {/* <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Trophy className="w-10 h-10 text-white animate-bounce" />
              </div> */}
              <CardTitle className="text-3xl animate-fade-in">
                Hasil Anda
              </CardTitle>
              <p className="text-gray-600">Selamat telah menyelesaikan game!</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg transform transition-all hover:scale-105 hover:bg-purple-100">
                  <div className="text-3xl font-bold text-purple-600 animate-number-pop">
                    #{personalStats.rank || "?"}
                  </div>
                  <div className="text-sm text-gray-600">Peringkat</div>
                  <div className="text-xs text-purple-500 mt-1">
                    dari {personalStats.total_participants} pemain
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg transform transition-all hover:scale-105 hover:bg-green-100">
                  <div className="text-3xl font-bold text-green-600 animate-number-pop">
                    {personalStats.total_points.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Poin</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg transform transition-all hover:scale-105 hover:bg-blue-100">
                  <div className="text-3xl font-bold text-blue-600 animate-number-pop">
                    {personalStats.correct_answers}/
                    {personalStats.total_questions}
                  </div>
                  <div className="text-sm text-gray-600">Benar</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg transform transition-all hover:scale-105 hover:bg-yellow-100">
                  <div className="text-3xl font-bold text-yellow-600 animate-number-pop">
                    {personalStats.average_time}s
                  </div>
                  <div className="text-sm text-gray-600">Rata-rata Waktu</div>
                  <div className="text-xs text-yellow-500 mt-1">
                    Semua Jawaban
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg transform transition-all hover:scale-105 hover:bg-orange-100">
                  <div className="text-3xl font-bold text-orange-600 animate-number-pop">
                    {personalStats.fastest_answer}s
                  </div>
                  <div className="text-sm text-gray-600">Tercepat</div>
                  <div className="text-xs text-orange-500 mt-1">
                    Semua Jawaban
                  </div>
                </div>
              </div>

              {personalStats.question_details &&
                personalStats.question_details.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <HelpCircle className="w-5 h-5 mr-2 text-purple-600" />
                        Detail Jawaban Anda
                      </h3>
                      <Button
                        onClick={() => setShowAnswerDetails(!showAnswerDetails)}
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        {showAnswerDetails
                          ? "Sembunyikan Detail"
                          : "Lihat Detail Jawaban"}
                      </Button>
                    </div>

                    {showAnswerDetails && (
                      <div className="space-y-4">
                        {personalStats.question_details.map(
                          (question, index) => (
                            <div
                              key={question.question_id}
                              className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                                question.is_correct
                                  ? "border-green-100 hover:border-green-200"
                                  : "border-red-100 hover:border-red-200"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium flex items-center flex-wrap">
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs flex-shrink-0 ${
                                      question.is_correct
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {index + 1}
                                  </span>
                                  <span className="break-words">
                                    {question.question_text}
                                  </span>
                                  {question.image_url && (
                                    <span className="ml-2 text-blue-500 flex-shrink-0">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <rect
                                          x="3"
                                          y="3"
                                          width="18"
                                          height="18"
                                          rx="2"
                                          ry="2"
                                        ></rect>
                                        <circle
                                          cx="8.5"
                                          cy="8.5"
                                          r="1.5"
                                        ></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                      </svg>
                                    </span>
                                  )}
                                  {question.answer_image_url && (
                                    <span className="ml-1 text-green-500 flex-shrink-0">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5v14"></path>
                                      </svg>
                                    </span>
                                  )}
                                </h4>
                                <div className="flex items-center gap-2">
                                  {question.response_time && (
                                    <Badge
                                      className={`${
                                        question.is_correct
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      } flex items-center gap-1`}
                                    >
                                      <Clock className="w-3 h-3" />
                                      {question.response_time}s
                                    </Badge>
                                  )}
                                  {question.is_correct ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>

                              {question.image_url && (
                                <div className="flex justify-center items-center my-3">
                                  <div
                                    className="relative w-full max-w-[200px] h-32 overflow-hidden rounded-lg border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() =>
                                      setPreviewImage(question.image_url)
                                    }
                                  >
                                    <Image
                                      src={question.image_url}
                                      alt="Question image"
                                      className="object-contain"
                                      fill
                                      sizes="(max-width: 768px) 100vw, 200px"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Always display the correct answer */}
                              <div
                                className={`mt-3 p-3 rounded-lg border ${
                                  question.is_correct
                                    ? "bg-green-50 border-green-100"
                                    : "bg-red-50 border-red-100"
                                }`}
                              >
                                <p className="text-xs text-gray-600 mb-1 flex items-center">
                                  {question.is_correct ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                      Jawaban Benar:
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 mr-1 text-red-600" />
                                      Jawaban yang Benar:
                                    </>
                                  )}
                                </p>

                                {question.answer_image_url && (
                                  <div className="mb-2 flex justify-center">
                                    <div
                                      className="relative w-full max-w-[200px] h-28 overflow-hidden rounded-lg border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() =>
                                        setPreviewImage(
                                          question.answer_image_url
                                        )
                                      }
                                    >
                                      <Image
                                        src={question.answer_image_url}
                                        alt="Answer image"
                                        className="object-contain"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 200px"
                                      />
                                    </div>
                                  </div>
                                )}

                                {question.correct_answer && (
                                  <p
                                    className={`text-sm font-medium ${
                                      question.is_correct
                                        ? "text-green-800"
                                        : "text-red-800"
                                    }`}
                                  >
                                    {question.correct_answer}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Image Preview Modal */}
        <Dialog
          open={!!previewImage}
          onOpenChange={() => setPreviewImage(null)}
        >
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-transparent border-0 animate-fade-in">
            <div className="relative w-full h-[80vh] bg-black bg-opacity-80">
              {previewImage && (
                <Image
                  src={previewImage}
                  alt="Preview"
                  className="object-contain animate-scale-in"
                  fill
                  sizes="100vw"
                  priority
                />
              )}
              <Button
                className="absolute top-2 right-2 bg-white bg-opacity-70 hover:bg-opacity-100 text-gray-800 rounded-full w-8 h-8 p-0 animate-fade-in"
                onClick={() => setPreviewImage(null)}
              >
                ✕
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <GamePageWithLoading 
      animation="fade"
      customLoadingMessage="Memuat hasil permainan..."
    >
      <ResultsPageContent params={params} />
    </GamePageWithLoading>
  );
}
