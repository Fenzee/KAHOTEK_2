"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { 
  Clock, 
  Trophy, 
  BookOpen, 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  Home,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { QuizPageWithLoading } from "@/components/ui/page-with-loading";

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  color: string;
  order_index: number;
  image_url: string | null;
}

interface Question {
  id: string;
  question_text: string;
  time_limit: number;
  points: number;
  order_index: number;
  image_url: string | null;
  answers: Answer[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

interface LearnGameState {
  currentQuestionIndex: number;
  score: number;
  correctAnswers: number;
  timeLeft: number;
  hasAnswered: boolean;
  selectedAnswer: string | null;
  gamePhase: "countdown" | "question" | "answered" | "finished";
  isSkipped: boolean; // Add this flag to track if question was skipped
  countdownValue: number;
}

function LearnModePageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [gameState, setGameState] = useState<LearnGameState>({
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    timeLeft: 0,
    hasAnswered: false,
    selectedAnswer: null,
    gamePhase: "countdown", // Start with countdown phase
    isSkipped: false,
    countdownValue: 10, // Change from 3 to 10 seconds
  });

  useEffect(() => {
    fetchQuiz();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  // Add countdown timer effect
  useEffect(() => {
    if (gameState.gamePhase === "countdown" && gameState.countdownValue > 0) {
      const countdownTimer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          countdownValue: prev.countdownValue - 1
        }));
      }, 1000);
      
      return () => clearTimeout(countdownTimer);
    } else if (gameState.gamePhase === "countdown" && gameState.countdownValue === 0 && quiz) {
      // When countdown reaches 0, start the actual game
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          gamePhase: "question",
          timeLeft: quiz.questions[0].time_limit
        }));
      }, 500); // Small delay before starting the game
    }
  }, [gameState.countdownValue, gameState.gamePhase, quiz]);

  useEffect(() => {
    // Only start timer if we're in question phase, have time left, and quiz is loaded
    if (gameState.gamePhase === "question" && gameState.timeLeft > 0 && quiz) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (
      gameState.gamePhase === "question" &&
      gameState.timeLeft === 0 &&
      quiz
    ) {
      // Time's up - but don't auto advance in learn mode
      handleTimeUp(false); // Pass false to indicate time ran out naturally
    }
  }, [gameState.timeLeft, gameState.gamePhase, quiz]);

  const fetchQuiz = async () => {
    try {
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
            points,
            order_index,
            image_url,
            answers (
              id,
              answer_text,
              is_correct,
              color,
              order_index,
              image_url
            )
          )
        `
        )
        .eq("id", resolvedParams.id)
        .eq("is_public", true)
        .single();

      if (quizError) throw quizError;

      const questions: Question[] = quizData.questions
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          time_limit: q.time_limit,
          points: q.points,
          order_index: q.order_index,
          image_url: q.image_url,
          answers: q.answers.sort(
            (a: any, b: any) => a.order_index - b.order_index
          ),
        }));

      setQuiz({
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        questions,
      });

      // Start with countdown phase instead of directly starting first question
      setGameState((prev) => ({
        ...prev,
        gamePhase: "countdown",
        countdownValue: 10  // Change from 3 to 10 seconds
      }));
      
    } catch (error) {
      console.error("Error fetching quiz:", error);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = (answerId: string) => {
    if (!quiz || gameState.hasAnswered) return;

    const currentQuestion = quiz.questions[gameState.currentQuestionIndex];
    const selectedAnswer = currentQuestion.answers.find(
      (a) => a.id === answerId
    );
    const responseTime =
      (currentQuestion.time_limit - gameState.timeLeft) * 1000;

    let pointsEarned = 0;
    let isCorrect = false;

    if (selectedAnswer?.is_correct) {
      isCorrect = true;
      // Calculate points based on response time
      const timeBonus =
        1 - (responseTime / (currentQuestion.time_limit * 1000)) * 0.5;
      pointsEarned = Math.max(
        Math.floor(currentQuestion.points * 0.5),
        Math.floor(currentQuestion.points * timeBonus)
      );
    }

    setGameState((prev) => ({
      ...prev,
      hasAnswered: true,
      selectedAnswer: answerId,
      score: prev.score + pointsEarned,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      gamePhase: "answered",
    }));
  };

  const handleTimeUp = (isManualSkip = true) => {
    setGameState((prev) => ({
      ...prev,
      hasAnswered: true,
      selectedAnswer: null,
      gamePhase: "answered",
      isSkipped: isManualSkip // Only set isSkipped to true if manually skipped
    }));
  };

  const nextQuestion = () => {
    if (!quiz) return;

    const nextIndex = gameState.currentQuestionIndex + 1;

    if (nextIndex >= quiz.questions.length) {
      // Game finished
      setGameState((prev) => ({ ...prev, gamePhase: "finished" }));
      return;
    }

    // Move to next question
    setGameState((prev) => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      timeLeft: quiz.questions[nextIndex].time_limit,
      hasAnswered: false,
      selectedAnswer: null,
      gamePhase: "question",
      isSkipped: false,
    }));
  };

  const restartQuiz = () => {
    if (!quiz) return;

    setGameState({
      currentQuestionIndex: 0,
      score: 0,
      correctAnswers: 0,
      timeLeft: 0,
      hasAnswered: false,
      selectedAnswer: null,
      gamePhase: "countdown", // Change to countdown first
      isSkipped: false,
      countdownValue: 10,  // Change from 3 to 10 seconds
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Memuat materi pembelajaran...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <Card className="bg-white/95 backdrop-blur-sm max-w-md mx-4 shadow-xl">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Materi tidak ditemukan
            </h2>
            <p className="text-gray-600 mb-4">
              Materi pembelajaran tidak tersedia atau tidak publik.
            </p>
            <Link href="/dashboard">
              <Button className="bg-purple-600 hover:bg-purple-700">Kembali ke Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState.gamePhase === "countdown") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center overflow-hidden">
        <div className="relative z-10">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </div>

          <Card className="bg-white/95 backdrop-blur-sm w-80 md:w-96 shadow-2xl border-0 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2"></div>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bersiap!
              </h2>
              <p className="text-gray-600 mb-8">
                Kuis akan dimulai dalam...
              </p>
              
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                <span className="text-5xl font-bold text-white animate-bounce-slight">
                  {gameState.countdownValue}
                </span>
              </div>
              
              <div className="text-sm text-gray-500">
                {quiz.title}
                <div className="mt-2 font-medium text-purple-600">{quiz.questions.length} Pertanyaan</div>
              </div>
              
              <div className="mt-8">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full bg-transparent border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl flex items-center justify-center">
                    <Home className="w-4 h-4 mr-2" />
                    Kembali ke Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState.gamePhase === "finished") {
    const accuracy =
      quiz.questions.length > 0
        ? (gameState.correctAnswers / quiz.questions.length) * 100
        : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4 py-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-[10%] w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-[60%] right-[10%] w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-[30%] w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          
          {/* Confetti effect */}
          <div className="absolute -top-10 left-1/4 w-4 h-4 bg-yellow-500 rounded-full animate-confetti-fall-slow"></div>
          <div className="absolute -top-10 left-1/3 w-3 h-3 bg-purple-500 rounded-full animate-confetti-fall-medium"></div>
          <div className="absolute -top-10 left-1/2 w-5 h-5 bg-blue-500 rounded-full animate-confetti-fall-fast"></div>
          <div className="absolute -top-10 left-2/3 w-4 h-4 bg-green-500 rounded-full animate-confetti-fall-slow"></div>
          <div className="absolute -top-10 left-3/4 w-3 h-3 bg-red-500 rounded-full animate-confetti-fall-medium"></div>
          <div className="absolute -top-10 left-10 w-2 h-2 bg-pink-500 rounded-full animate-confetti-fall-fast"></div>
          <div className="absolute -top-10 right-10 w-6 h-6 bg-indigo-500 rounded-full animate-confetti-fall-slow"></div>
        </div>
        
        <div className="container mx-auto max-w-2xl relative z-10">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2"></div>
            <CardHeader className="text-center pt-8">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-once">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Pembelajaran Selesai!</CardTitle>
              <p className="text-gray-600 mt-2">Berikut adalah hasil belajar Anda</p>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {quiz.title}
                </h2>
                {quiz.description && (
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{quiz.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center shadow-lg border border-purple-200 transform hover:scale-105 transition-all">
                  <div className="text-3xl font-bold text-purple-600 animate-number-pop">
                    {gameState.score.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Poin</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center shadow-lg border border-green-200 transform hover:scale-105 transition-all">
                  <div className="text-3xl font-bold text-green-600 animate-number-pop">
                    {accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Akurasi</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    Jawaban Benar
                  </span>
                  <span className="font-bold text-gray-800">
                    {gameState.correctAnswers} dari {quiz.questions.length}
                  </span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                    style={{ width: `${accuracy}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={restartQuiz}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-6 py-6 h-auto rounded-xl shadow-lg transform hover:scale-105 transition-all"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Pelajari Lagi
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent border-purple-300 text-purple-700 hover:bg-purple-50 text-lg px-6 py-6 h-auto rounded-xl shadow-md transform hover:scale-105 transition-all">
                    <Home className="w-5 h-5 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[gameState.currentQuestionIndex];
  const progress =
    ((gameState.currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const adjustColor = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    const newHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return newHex;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4 py-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-[10%] w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[60%] right-[10%] w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-[30%] w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 text-white gap-4">
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/10">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold">Mode Belajar</span>
              <p className="text-xs text-white/70">{quiz.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/10 transform hover:scale-105 transition-transform">
              <div className="text-lg font-bold">
                {gameState.score.toLocaleString()}
              </div>
              <div className="text-xs opacity-80">Poin</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/10 transform hover:scale-105 transition-transform">
              <div className="text-lg font-bold">
                {gameState.correctAnswers}
              </div>
              <div className="text-xs opacity-80">Benar</div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-xl border border-white/10 shadow-md flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-white mb-2">
            <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-xl text-sm shadow-lg border border-white/10">
              Pertanyaan {gameState.currentQuestionIndex + 1} dari{" "}
              {quiz.questions.length}
            </span>
            {gameState.gamePhase === "question" && (
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-xl shadow-lg border border-white/10">
                <Clock className="w-4 h-4" />
                <span className="font-bold">{gameState.timeLeft}s</span>
              </div>
            )}
          </div>
          <div className="relative">
            <Progress value={progress} className="bg-white/20 h-2 rounded-full overflow-hidden" />
            <div 
              className="absolute top-0 left-0 h-2 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 animate-shimmer" 
              style={{
                width: `${progress}%`,
                backgroundSize: '200% 100%',
              }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <Card className="bg-white/95 backdrop-blur-sm mb-6 shadow-2xl border-0 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2"></div>
          <CardHeader className="pt-8">
            <CardTitle className="text-2xl text-center font-bold">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Image */}
            {currentQuestion.image_url && (
              <div className="flex justify-center mb-4">
                <div 
                  className="relative w-full max-w-md h-64 overflow-hidden rounded-xl border border-gray-100 cursor-pointer hover:opacity-90 transition-all hover:shadow-lg transform hover:scale-[1.01]"
                  onClick={() => setPreviewImage(currentQuestion.image_url)}
                >
                  <Image 
                    src={currentQuestion.image_url} 
                    alt="Question image"
                    className="object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
            )}

            {gameState.gamePhase === "question" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.answers.map((answer) => (
                  <Button
                    key={answer.id}
                    onClick={() => submitAnswer(answer.id)}
                    className="h-auto min-h-20 text-lg font-semibold text-white hover:scale-105 transition-all p-4 flex flex-col items-center justify-center rounded-xl shadow-lg border border-white/20"
                    style={{ 
                      background: `linear-gradient(135deg, ${answer.color}, ${adjustColor(answer.color, -30)})`,
                    }}
                  >
                    {answer.image_url && (
                      <div className="relative w-full h-32 mb-3">
                        <Image
                          src={answer.image_url}
                          alt="Answer image"
                          className="object-contain rounded-lg"
                          fill
                          sizes="(max-width: 768px) 100vw, 200px"
                        />
                      </div>
                    )}
                    <span className="text-center">{answer.answer_text}</span>
                  </Button>
                ))}
              </div>
            )}

            {gameState.gamePhase === "answered" && (
              <div className="text-center py-4">
                <div className="space-y-4">
                  {gameState.selectedAnswer ? (
                    <>
                      <div className={`w-20 h-20 ${currentQuestion.answers.find(
                          (a) => a.id === gameState.selectedAnswer
                        )?.is_correct ? "bg-gradient-to-br from-green-400 to-green-500" : "bg-gradient-to-br from-red-400 to-red-500"} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-once`}>
                        {currentQuestion.answers.find(
                          (a) => a.id === gameState.selectedAnswer
                        )?.is_correct ? (
                          <CheckCircle className="w-10 h-10 text-white" />
                        ) : (
                          <XCircle className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <h3 className={`text-2xl font-bold ${currentQuestion.answers.find(
                          (a) => a.id === gameState.selectedAnswer
                        )?.is_correct ? "text-green-600" : "text-red-600"}`}>
                        {currentQuestion.answers.find(
                          (a) => a.id === gameState.selectedAnswer
                        )?.is_correct
                          ? "Jawaban Benar!"
                          : "Jawaban Salah!"}
                      </h3>
                      <div className="space-y-3 mt-6">
                        {currentQuestion.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className={`p-4 rounded-xl flex items-center justify-between transition-all ${
                              answer.is_correct
                                ? "bg-green-50 border-2 border-green-500 shadow-md"
                                : answer.id === gameState.selectedAnswer
                                ? "bg-red-50 border-2 border-red-500 shadow-md"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-6 h-6 rounded-full flex-shrink-0 shadow-inner"
                                style={{ 
                                  background: `linear-gradient(135deg, ${answer.color}, ${adjustColor(answer.color, -30)})`,
                                }}
                              />
                              <div className="flex flex-col">
                                {answer.image_url && (
                                  <div 
                                    className="relative w-20 h-20 mb-2 cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-all hover:shadow-md"
                                    onClick={() => setPreviewImage(answer.image_url)}
                                  >
                                    <Image
                                      src={answer.image_url}
                                      alt="Answer image"
                                      className="object-contain"
                                      fill
                                      sizes="80px"
                                    />
                                  </div>
                                )}
                                <span className="font-medium">{answer.answer_text}</span>
                              </div>
                            </div>
                            {answer.is_correct && (
                              <Badge className="bg-green-100 text-green-800 ml-2 flex-shrink-0 px-3 py-1">
                                <CheckCircle className="w-4 h-4 mr-1" /> Jawaban Benar
                              </Badge>
                            )}
                            {answer.id === gameState.selectedAnswer &&
                              !answer.is_correct && (
                                <Badge className="bg-red-100 text-red-800 ml-2 flex-shrink-0 px-3 py-1">
                                  <XCircle className="w-4 h-4 mr-1" /> Pilihan Anda
                                </Badge>
                              )}
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        onClick={nextQuestion}
                        className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-6 py-6 h-auto rounded-xl shadow-lg transform hover:scale-105 transition-all"
                      >
                        {gameState.currentQuestionIndex === quiz.questions.length - 1 ? (
                          <>
                            Selesai
                            <Trophy className="w-5 h-5 ml-2" />
                          </>
                        ) : (
                          <>
                            Lanjutkan
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse ${
                        gameState.isSkipped 
                          ? "bg-gradient-to-br from-purple-400 to-purple-500" 
                          : "bg-gradient-to-br from-amber-400 to-amber-500"
                      }`}>
                        {gameState.isSkipped ? (
                          <ArrowRight className="w-10 h-10 text-white" />
                        ) : (
                          <Clock className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <h3 className={`text-2xl font-bold ${gameState.isSkipped ? "text-purple-600" : "text-amber-600"}`}>
                        {gameState.isSkipped ? "Soal Dilewati" : "Waktu Habis!"}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {gameState.isSkipped 
                          ? "Anda melewati soal ini. Berikut jawaban yang benar:" 
                          : "Jawaban yang benar:"}
                      </p>
                      <div className="space-y-3">
                        {currentQuestion.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className={`p-4 rounded-xl flex items-center justify-between transition-all ${
                              answer.is_correct
                                ? "bg-green-50 border-2 border-green-500 shadow-md"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-6 h-6 rounded-full flex-shrink-0 shadow-inner"
                                style={{ 
                                  background: `linear-gradient(135deg, ${answer.color}, ${adjustColor(answer.color, -30)})`,
                                }}
                              />
                              <div className="flex flex-col">
                                {answer.image_url && (
                                  <div 
                                    className="relative w-20 h-20 mb-2 cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-all hover:shadow-md"
                                    onClick={() => setPreviewImage(answer.image_url)}
                                  >
                                    <Image
                                      src={answer.image_url}
                                      alt="Answer image"
                                      className="object-contain"
                                      fill
                                      sizes="80px"
                                    />
                                  </div>
                                )}
                                <span className="font-medium">{answer.answer_text}</span>
                              </div>
                            </div>
                            {answer.is_correct && (
                              <Badge className="bg-green-100 text-green-800 ml-2 flex-shrink-0 px-3 py-1">
                                <CheckCircle className="w-4 h-4 mr-1" /> Jawaban Benar
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        onClick={nextQuestion}
                        className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-6 py-6 h-auto rounded-xl shadow-lg transform hover:scale-105 transition-all"
                      >
                        {gameState.currentQuestionIndex === quiz.questions.length - 1 ? (
                          <>
                            Selesai
                            <Trophy className="w-5 h-5 ml-2" />
                          </>
                        ) : (
                          <>
                            Lanjutkan
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timer Progress */}
        {gameState.gamePhase === "question" && (
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-1"></div>
            <CardContent className="p-4">
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <Progress
                  value={
                    ((currentQuestion.time_limit - gameState.timeLeft) /
                      currentQuestion.time_limit) *
                    100
                  }
                  className="h-3 absolute top-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-600"
                />
              </div>
              <div className="flex justify-end mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-purple-600 border-purple-200 hover:bg-purple-50 rounded-xl flex items-center"
                  onClick={() => handleTimeUp(true)}
                >
                  Lewati <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
          <div className="relative w-full max-w-4xl h-[80vh]">
            <Image
              src={previewImage}
              alt="Preview"
              className="object-contain animate-scale-in"
              fill
              sizes="100vw"
              priority
            />
            <Button 
              className="absolute top-4 right-4 bg-white bg-opacity-70 hover:bg-opacity-100 text-gray-800 rounded-full w-10 h-10 p-0 shadow-lg" 
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearnModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <QuizPageWithLoading 
      animation="fade"
      customLoadingMessage="Memuat mode belajar..."
    >
      <LearnModePageContent params={params} />
    </QuizPageWithLoading>
  );
}
