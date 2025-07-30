"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  ArrowLeft,
  Slack,
  Clock,
  Trophy,
  Users,
  Calendar,
  BarChart2,
  Loader2,
  Search,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface GameHistory {
  id: string;
  session_id: string;
  score: number;
  rank?: number;
  total_players?: number;
  played_at: string;
  game_type: 'solo' | 'multiplayer';
  quiz: {
    id: string;
    title: string;
    creator?: {
      username: string;
      avatar_url: string | null;
    }
  };
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [soloHistory, setSoloHistory] = useState<GameHistory[]>([]);
  const [multiplayerHistory, setMultiplayerHistory] = useState<GameHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      fetchGameHistory();
    }
  }, [user, authLoading, router]);

  const fetchGameHistory = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch solo game history
      const { data: soloData, error: soloError } = await supabase
        .from("solo_scores")
        .select(`
          id,
          quiz_id,
          score,
          total_questions,
          completed_at
        `)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (soloError) {
        console.error("Error fetching solo history:", soloError);
        toast.error("Gagal memuat riwayat permainan solo");
        setSoloHistory([]);
      } else {
        // Fetch quiz details for each solo score
        const formattedSoloData = await Promise.all((soloData || []).map(async (item) => {
          // Get quiz details
          const { data: quizData } = await supabase
            .from("quizzes")
            .select(`
              id, 
              title, 
              creator_id
            `)
            .eq("id", item.quiz_id)
            .single();

          let creator;
          if (quizData?.creator_id) {
            // Get creator details
            const { data: creatorData } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", quizData.creator_id)
              .single();

            if (creatorData) {
              creator = {
                username: creatorData.username,
                avatar_url: creatorData.avatar_url
              };
            }
          }

          return {
            id: item.id,
            session_id: item.quiz_id,
            score: item.score,
            total_questions: item.total_questions,
            played_at: item.completed_at,
            game_type: 'solo' as const,
            quiz: {
              id: quizData?.id || item.quiz_id,
              title: quizData?.title || "Quiz tidak ditemukan",
              creator: creator || undefined
            }
          };
        }));

        setSoloHistory(formattedSoloData);
      }

      // Fetch multiplayer game history
      const { data: participantData, error: participantError } = await supabase
        .from("game_participants")
        .select(`
          id,
          session_id,
          nickname,
          score,
          joined_at
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (participantError) {
        console.error("Error fetching multiplayer history:", participantError);
        toast.error("Gagal memuat riwayat permainan multiplayer");
        setMultiplayerHistory([]);
      } else {
        // For each session, get additional data
        const formattedMultiplayerData = await Promise.all((participantData || []).map(async (item) => {
          // Get session details to find quiz_id
          const { data: sessionData } = await supabase
            .from("game_sessions")
            .select("quiz_id")
            .eq("id", item.session_id)
            .single();

          // Get quiz details
          let quizData = null;
          let creator = null;
          
          if (sessionData?.quiz_id) {
            const { data: quiz } = await supabase
              .from("quizzes")
              .select("id, title, creator_id")
              .eq("id", sessionData.quiz_id)
              .single();
            
            quizData = quiz;
            
            // Get creator details
            if (quiz?.creator_id) {
              const { data: creatorData } = await supabase
                .from("profiles")
                .select("username, avatar_url")
                .eq("id", quiz.creator_id)
                .single();
                
              if (creatorData) {
                creator = {
                  username: creatorData.username,
                  avatar_url: creatorData.avatar_url
                };
              }
            }
          }

          // Get all participants in this session to calculate rank
          let rank = 1;
          let totalPlayers = 1;
          
          const { data: participants } = await supabase
            .from("game_participants")
            .select("id, score")
            .eq("session_id", item.session_id)
            .order("score", { ascending: false });
          
          if (participants && participants.length > 0) {
            rank = participants.findIndex(p => p.id === item.id) + 1;
            totalPlayers = participants.length;
          }

          return {
            id: item.id,
            session_id: item.session_id,
            score: item.score,
            rank,
            total_players: totalPlayers,
            played_at: item.joined_at,
            game_type: 'multiplayer' as const,
            quiz: {
              id: quizData?.id || "",
              title: quizData?.title || "Quiz tidak ditemukan",
              creator: creator || undefined
            }
          };
        }));

        setMultiplayerHistory(formattedMultiplayerData);
      }
    } catch (error) {
      console.error("Error fetching game history:", error);
      toast.error("Terjadi kesalahan saat memuat riwayat permainan");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort history based on search term and sort order
  const filterHistory = (history: GameHistory[]) => {
    return history
      .filter(item => 
        item.quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.quiz.creator?.username && item.quiz.creator.username.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        const dateA = new Date(a.played_at).getTime();
        const dateB = new Date(b.played_at).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  };

  const filteredSoloHistory = filterHistory(soloHistory);
  const filteredMultiplayerHistory = filterHistory(multiplayerHistory);
  const allHistory = filterHistory([...soloHistory, ...multiplayerHistory]);

  // Calculate stats
  const totalGames = soloHistory.length + multiplayerHistory.length;
  const averageScore = totalGames > 0 
    ? Math.round(([...soloHistory, ...multiplayerHistory].reduce((sum, game) => sum + game.score, 0) / totalGames))
    : 0;
  const bestRank = multiplayerHistory.length > 0
    ? Math.min(...multiplayerHistory.map(game => game.rank || Infinity))
    : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center text-blue-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Memuat riwayat permainan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Riwayat tidak ditemukan
            </h2>
            <p className="text-gray-600 mb-4">Silakan login terlebih dahulu</p>
            <Button 
              onClick={() => router.push("/auth/login")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Login
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="border-2 border-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Slack className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Riwayat Permainan</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
              <Card className="bg-white/90 border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Permainan</CardTitle>
                  <Calendar className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalGames}</div>
                  <p className="text-xs text-muted-foreground">
                    Solo: {soloHistory.length} | Multiplayer: {multiplayerHistory.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/90 border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Skor Rata-rata</CardTitle>
                  <BarChart2 className="h-5 w-5 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{averageScore}</div>
                  <p className="text-xs text-muted-foreground">Dari semua permainan</p>
                </CardContent>
              </Card>
              <Card className="bg-white/90 border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Peringkat Terbaik</CardTitle>
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {bestRank > 0 ? `#${bestRank}` : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground">Dalam permainan multiplayer</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Daftar Riwayat</h2>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari berdasarkan judul atau pembuat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/70 border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="border-gray-300"
                  title={sortOrder === "desc" ? "Terlama dulu" : "Terbaru dulu"}
                >
                  {sortOrder === "desc" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Game History Tabs */}
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-gray-200/50 rounded-lg p-1 shadow-inner">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-200"
                >
                  Semua
                </TabsTrigger>
                <TabsTrigger
                  value="solo"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-200"
                >
                  Solo
                </TabsTrigger>
                <TabsTrigger
                  value="multiplayer"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-200"
                >
                  Multiplayer
                </TabsTrigger>
              </TabsList>

              {/* All Games Tab */}
              <TabsContent value="all" className="space-y-4">
                {allHistory.length === 0 ? (
                  <Card className="bg-white/90 border-none shadow-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm ? "Tidak ada riwayat yang cocok" : "Belum ada riwayat permainan"}
                      </h3>
                      <p className="text-gray-600 text-center mb-4">
                        {searchTerm ? "Coba kata kunci lain" : "Mainkan beberapa kuis untuk melihat riwayat di sini!"}
                      </p>
                      {!searchTerm && (
                        <Button 
                          onClick={() => router.push("/dashboard")} 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg"
                        >
                          Jelajahi Kuis
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {allHistory.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <HistoryCard game={game} formatDate={formatDate} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Solo Games Tab */}
              <TabsContent value="solo" className="space-y-4">
                {filteredSoloHistory.length === 0 ? (
                  <Card className="bg-white/90 border-none shadow-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm ? "Tidak ada riwayat solo yang cocok" : "Belum ada riwayat permainan solo"}
                      </h3>
                      <p className="text-gray-600 text-center mb-4">
                        {searchTerm ? "Coba kata kunci lain" : "Mainkan beberapa kuis solo untuk melihat riwayat di sini!"}
                      </p>
                      {!searchTerm && (
                        <Button 
                          onClick={() => router.push("/dashboard")} 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg"
                        >
                          Jelajahi Kuis Solo
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredSoloHistory.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <HistoryCard game={game} formatDate={formatDate} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Multiplayer Games Tab */}
              <TabsContent value="multiplayer" className="space-y-4">
                {filteredMultiplayerHistory.length === 0 ? (
                  <Card className="bg-white/90 border-none shadow-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm ? "Tidak ada riwayat multiplayer yang cocok" : "Belum ada riwayat permainan multiplayer"}
                      </h3>
                      <p className="text-gray-600 text-center mb-4">
                        {searchTerm ? "Coba kata kunci lain" : "Mainkan beberapa kuis multiplayer untuk melihat riwayat di sini!"}
                      </p>
                      {!searchTerm && (
                        <Button 
                          onClick={() => router.push("/join")} 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg"
                        >
                          Gabung Game
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredMultiplayerHistory.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <HistoryCard game={game} formatDate={formatDate} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

// History Card Component
function HistoryCard({ game, formatDate }: { game: GameHistory, formatDate: (date: string) => string }) {
  return (
    <Card className="bg-white/90 border-none shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4">
            {/* Game Type Badge */}
            <div className={`rounded-full p-2 ${
              game.game_type === 'solo' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-purple-100 text-purple-600'
            }`}>
              {game.game_type === 'solo' ? (
                <Users className="w-5 h-5" />
              ) : (
                <Trophy className="w-5 h-5" />
              )}
            </div>

            {/* Quiz Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{game.quiz.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                {/* Creator info if available */}
                {game.quiz.creator && (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={game.quiz.creator.avatar_url || undefined} className="object-cover w-full h-full"/>
                      <AvatarFallback className="text-xs">
                        {game.quiz.creator.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{game.quiz.creator.username}</span>
                  </div>
                )}
                
                {/* Date */}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(game.played_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score and Rank */}
          <div className="flex items-center gap-4">
            {/* Score */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{game.score}</div>
              <div className="text-xs text-gray-500">Skor</div>
            </div>

            {/* Rank for multiplayer games */}
            {game.game_type === 'multiplayer' && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  game.rank === 1 
                    ? 'text-yellow-500' 
                    : game.rank === 2 
                      ? 'text-gray-500' 
                      : game.rank === 3 
                        ? 'text-amber-700' 
                        : 'text-gray-600'
                }`}>
                  #{game.rank}
                </div>
                <div className="text-xs text-gray-500">
                  dari {game.total_players} pemain
                </div>
              </div>
            )}

            {/* Game Type Badge */}
            <Badge className={`${
              game.game_type === 'solo' 
                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                : 'bg-purple-100 text-purple-700 border-purple-200'
            }`}>
              {game.game_type === 'solo' ? 'Solo' : 'Multiplayer'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
