"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  X,
  Send,
  ChevronDown,
  Star,
  Bell,
  BellOff,
  AlertCircle,
  CheckCheck,
  MessageSquarePlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ReadReceipt {
  user_id: string;
  nickname: string;
  avatar_url?: string | null;
  read_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string | null;
  nickname: string;
  message: string;
  created_at: string;
  avatar_url?: string | null;
  is_important?: boolean;
  read_by?: ReadReceipt[];
}

interface ChatPanelProps {
  sessionId: string;
  userId: string | null;
  nickname: string;
  avatarUrl?: string | null;
  position?: "right" | "bottom";
  isHost?: boolean;
}

// Template messages for quick responses
const chatTemplates = [
  {
    category: "Game Start",
    templates: [
      "Game akan dimulai dalam 1 menit. Bersiaplah!",
      "Selamat datang di quiz! Aturan: jawab dengan cepat untuk poin lebih tinggi.",
      "Pastikan koneksi internet stabil sebelum kita mulai.",
    ],
  },
  {
    category: "Game Info",
    templates: [
      "Ada total 10 pertanyaan dalam quiz ini.",
      "Perhatikan pertanyaan berikutnya, agak sulit!",
      "Quiz akan berakhir dalam 5 menit.",
    ],
  },
  {
    category: "Support",
    templates: [
      "Jika mengalami masalah teknis, refresh halaman.",
      "Klik tombol next jika tidak melihat pertanyaan berikutnya.",
      "Hubungi host jika ada pertanyaan.",
    ],
  },
];

// Available notification sounds
const notificationSounds = [
  { id: "default", name: "Chime", path: "/sounds/notification.mp3" },
  { id: "chime", name: "Chinese", path: "/sounds/chinese.mp3" },
  { id: "ding", name: "Ding", path: "/sounds/Vine.mp3" },
  { id: "bell", name: "Discord", path: "/sounds/Discord.mp3" },
  { id: "none", name: "Tidak Ada", path: "" },
];

// Fungsi untuk mengecek apakah file ada
const checkFileExists = async (url: string): Promise<boolean> => {
  if (!url) return false;

  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (e) {
    return false;
  }
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ChatPanel({
  sessionId,
  userId,
  nickname,
  avatarUrl,
  position = "right",
  isHost = false,
}: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false); // Default terbuka
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isImportant, setIsImportant] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [selectedSound, setSelectedSound] = useState("default");
  const [soundError, setSoundError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const PAGE_SIZE = 25; // Jumlah pesan yang dimuat per halaman

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null); // Ref untuk panel chat

  // Fungsi untuk menangani tombol chat
  const handleChatToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  // Fungsi untuk menangani tombol close (X)
  const handleCloseChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  // Effect untuk mendeteksi klik di luar panel chat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Periksa apakah klik terjadi pada tombol toggle chat
      const toggleButton = document.querySelector(
        ".fixed.bottom-5.right-5, .fixed.bottom-20.right-5"
      );
      if (toggleButton && toggleButton.contains(event.target as Node)) {
        // Jika klik terjadi pada tombol toggle, jangan lakukan apa-apa
        return;
      }

      if (
        chatPanelRef.current &&
        !chatPanelRef.current.contains(event.target as Node) &&
        !showSoundSettings &&
        !showTemplates
      ) {
        // Jangan tutup jika settings atau template terbuka
        // Klik di luar panel chat
        setIsOpen(false);
      }
    }

    // Tambahkan event listener jika panel terbuka
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      // Cleanup event listener
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, showSoundSettings, showTemplates]); // Tambahkan isOpen sebagai dependency

  // Initialize notification sound
  useEffect(() => {
    if (typeof Audio !== "undefined") {
      try {
        setSoundError(null);
        const soundToUse = notificationSounds.find(
          (sound) => sound.id === selectedSound
        );
        if (soundToUse && soundToUse.path) {
          const audio = new Audio(soundToUse.path);

          // Handle error jika file tidak ada
          audio.addEventListener("error", () => {
            console.warn(
              `Notification sound error: ${soundToUse.path} not found or not supported`
            );
            notificationSoundRef.current = null;
            setSoundError(`File suara '${soundToUse.name}' tidak ditemukan`);
          });

          // Mulai proses loading
          audio.load();
          notificationSoundRef.current = audio;
        } else {
          notificationSoundRef.current = null;
        }
      } catch (err) {
        console.error("Error initializing audio:", err);
        notificationSoundRef.current = null;
        setSoundError("Terjadi kesalahan saat memuat file suara");
      }
    }
  }, [selectedSound]);

  // Load initial messages and set up real-time listener
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error, count } = await supabase
          .from("game_chat_messages")
          .select("*", { count: "exact" })
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

        if (error) throw error;

        // Reverse data agar urutan kronologis (lama ke baru)
        const sortedData = [...(data || [])].reverse();
        setMessages(sortedData);

        // Cek apakah ada lebih banyak pesan
        if (count && count > currentPage * PAGE_SIZE) {
          setHasMoreMessages(true);
        } else {
          setHasMoreMessages(false);
        }

        // Mark all messages as read
        if (userId && data && data.length > 0) {
          const messageIds = data.map((msg) => msg.id);
          await markMessagesAsRead(messageIds);
        }
      } catch (error) {
        console.error("Error loading chat messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadMessages();
      setUnreadCount(0);

      // Set up realtime subscription for messages
      const messageChannel = supabase
        .channel(`chat_messages_${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "game_chat_messages",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages((prev) => [...prev, newMessage]);

            // Mark message as read if panel is open
            if (userId) {
              markMessagesAsRead([newMessage.id]);
            }
          }
        )
        .subscribe();

      // Set up realtime subscription for read receipts
      const readReceiptChannel = supabase
        .channel(`chat_read_receipts_${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "game_chat_read_receipts",
            filter: `session_id=eq.${sessionId}`,
          },
          async () => {
            // Refresh messages to get updated read_by arrays
            const { data } = await supabase
              .from("game_chat_messages")
              .select("*")
              .eq("session_id", sessionId)
              .order("created_at", { ascending: false })
              .range(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE - 1
              );

            if (data) {
              // Reverse data agar urutan kronologis
              const sortedData = [...(data || [])].reverse();
              setMessages(sortedData);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
        supabase.removeChannel(readReceiptChannel);
      };
    } else {
      // When panel is closed, subscribe just to count new messages
      const channel = supabase
        .channel(`chat_count_${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "game_chat_messages",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;

            // Only notify if the message is from someone else
            if (newMessage.user_id !== userId) {
              setUnreadCount((prev) => prev + 1);

              // Play notification sound if enabled
              if (
                notificationsEnabled &&
                notificationSoundRef.current &&
                selectedSound !== "none"
              ) {
                try {
                  // Clone audio untuk memastikan bisa diputar lagi meskipun belum selesai dari pemutaran sebelumnya
                  const soundClone =
                    notificationSoundRef.current.cloneNode() as HTMLAudioElement;
                  soundClone.volume = 0.5; // Set volume 50%
                  soundClone.play().catch((err) => {
                    console.error("Error playing notification:", err);
                  });
                } catch (err) {
                  console.error("Error cloning audio:", err);
                }
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [
    sessionId,
    isOpen,
    userId,
    notificationsEnabled,
    selectedSound,
    currentPage,
    PAGE_SIZE,
  ]);

  // Fungsi untuk memuat lebih banyak pesan
  const loadMoreMessages = async () => {
    if (loadingMoreMessages || !hasMoreMessages) return;

    try {
      setLoadingMoreMessages(true);
      const nextPage = currentPage + 1;

      const { data, error } = await supabase
        .from("game_chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .range((nextPage - 1) * PAGE_SIZE, nextPage * PAGE_SIZE - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        // Reverse untuk mendapatkan urutan kronologis dan gabungkan dengan pesan yang ada
        const olderMessages = [...data].reverse();
        setMessages((prev) => [...olderMessages, ...prev]);
        setCurrentPage(nextPage);

        // Cek apakah masih ada lebih banyak pesan
        const { count } = await supabase
          .from("game_chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("session_id", sessionId);

        setHasMoreMessages(count !== null && count > nextPage * PAGE_SIZE);

        // Mark older messages as read
        if (userId) {
          const messageIds = data.map((msg) => msg.id);
          await markMessagesAsRead(messageIds);
        }
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!userId || !messageIds.length) return;

    try {
      // Create one read receipt for each message
      const receipts = messageIds.map((messageId) => ({
        message_id: messageId,
        session_id: sessionId,
        user_id: userId,
        nickname: nickname,
        avatar_url: avatarUrl,
        read_at: new Date().toISOString(),
      }));

      await supabase.from("game_chat_read_receipts").upsert(receipts);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from("game_chat_messages").insert({
        session_id: sessionId,
        user_id: userId,
        nickname: nickname,
        message: newMessage.trim(),
        avatar_url: avatarUrl,
        is_important: isImportant,
      });

      if (error) throw error;

      setNewMessage("");
      setIsImportant(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const toggleImportant = () => {
    setIsImportant(!isImportant);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const toggleSoundSettings = () => {
    setShowSoundSettings(!showSoundSettings);
  };

  const selectTemplate = (template: string) => {
    setNewMessage(template);
    setShowTemplates(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSoundChange = (value: string) => {
    setSelectedSound(value);
    setSoundError(null);

    // Test the sound
    if (value !== "none") {
      try {
        const sound = notificationSounds.find((s) => s.id === value);
        if (sound && sound.path) {
          const testAudio = new Audio(sound.path);

          testAudio.addEventListener("error", () => {
            console.warn(
              `Test sound error: ${sound.path} not found or not supported`
            );
            setSoundError(`File suara '${sound.name}' tidak ditemukan`);
          });

          testAudio.addEventListener("canplaythrough", () => {
            testAudio.play().catch((err) => {
              console.error("Error playing test sound:", err);
              setSoundError("Tidak dapat memutar suara notifikasi");
            });
          });

          testAudio.load();
        }
      } catch (err) {
        console.error("Error testing sound:", err);
        setSoundError("Terjadi kesalahan saat memuat file suara");
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderReadReceipts = (msg: ChatMessage) => {
    if (!msg.read_by || msg.read_by.length === 0) {
      return <div className="text-xs text-gray-400">Belum dibaca</div>;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="flex items-center">
            <div className="flex items-center gap-0.5">
              <CheckCheck className="h-3 w-3 text-green-500" />
              <span className="text-xs text-gray-400">
                {msg.read_by.length}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="p-2 bg-white rounded-md shadow-md border"
          >
            <div className="text-xs font-semibold mb-1">Dibaca oleh:</div>
            <div className="flex flex-wrap gap-1 max-w-48">
              {msg.read_by.map((reader, i) => (
                <div
                  key={`${reader.user_id || reader.nickname}-${i}`}
                  className="flex items-center gap-1 bg-gray-50 rounded p-1"
                >
                  <div className="h-4 w-4 rounded-full bg-purple-100 overflow-hidden">
                    {reader.avatar_url ? (
                      <img
                        src={reader.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[8px] text-purple-600">
                        {getInitials(reader.nickname)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] truncate max-w-28">
                    {reader.nickname}
                  </span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      {/* Chat Toggle Button with Badge */}
      <Button
        onClick={isOpen ? handleCloseChat : handleChatToggle}
        variant="outline"
        size="icon"
        className={`fixed ${
          position === "right" ? "bottom-5 right-5" : "bottom-20 right-5"
        } z-50 rounded-full w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-lg`}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <MessageCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </Button>

      {/* Overlay untuk mendeteksi klik di luar chat */}
      {isOpen &&
        !showSoundSettings &&
        !showTemplates && ( // Jangan tampilkan overlay jika settings atau template terbuka
          <div className="fixed inset-0 z-30" onClick={handleCloseChat} />
        )}

      {/* Chat Panel */}
      <div
        ref={chatPanelRef}
        className={`fixed ${
          position === "right"
            ? "right-0 top-0 md:h-[calc(100vh-80px)] h-[calc(95vh-80px)] w-80 md:w-96 transition-transform duration-300 ease-in-out shadow-lg z-40 bg-white"
            : "right-0 bottom-0 w-full md:w-96 h-[500px] transition-transform duration-300 ease-in-out shadow-lg z-40 bg-white"
        } ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col border-l`}
        onClick={(e) => e.stopPropagation()} // Mencegah event propagasi ke overlay
      >
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-blue-500 text-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-semibold">Game Chat</h3>
            {isHost && (
              <Badge
                variant="outline"
                className="bg-white/20 text-white border-white/30 text-xs"
              >
                Host
              </Badge>
            )}
          </div>

          <div className="flex items-center">
            {/* Notification Toggle */}
            <Button
              onClick={toggleNotifications}
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-white/10 text-white"
              title={
                notificationsEnabled
                  ? "Matikan notifikasi"
                  : "Aktifkan notifikasi"
              }
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4 opacity-70" />
              )}
            </Button>

            {/* Sound Settings */}
            <Popover
              open={showSoundSettings}
              onOpenChange={setShowSoundSettings}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-white/10 text-white"
                  title="Pengaturan suara"
                >
                  {selectedSound !== "none" ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4 opacity-70" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-64 p-4 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-medium text-sm mb-3">
                  Pilih Suara Notifikasi
                </div>
                <RadioGroup
                  value={selectedSound}
                  onValueChange={handleSoundChange}
                  className="space-y-2"
                >
                  {notificationSounds.map((sound) => (
                    <div
                      key={`sound-option-${sound.id}`}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={sound.id}
                        id={`sound-${sound.id}`}
                      />
                      <Label
                        htmlFor={`sound-${sound.id}`}
                        className="cursor-pointer"
                      >
                        {sound.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {soundError && (
                  <div className="mt-3 text-xs text-red-500 p-2 bg-red-50 rounded border border-red-100">
                    <AlertCircle className="inline-block w-3 h-3 mr-1" />
                    {soundError}
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  Letakkan file suara notifikasi di direktori /public/sounds/
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 bg-gray-50" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Belum ada pesan</p>
              <p className="text-sm">Mulai percakapan sekarang!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Load More Button */}
              {hasMoreMessages && (
                <div className="flex justify-center pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    onClick={loadMoreMessages}
                    disabled={loadingMoreMessages}
                  >
                    {loadingMoreMessages ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1"></div>
                        Memuat...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Muat pesan sebelumnya
                      </>
                    )}
                  </Button>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={`msg-${msg.id}`}
                  className={`flex ${
                    msg.user_id === userId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[90%] ${
                      msg.user_id === userId ? "flex-row-reverse" : "flex-row"
                    } gap-2 items-start`}
                  >
                    <Avatar
                      className={`h-8 w-8 ${
                        msg.user_id === userId ? "ml-2" : "mr-2"
                      } border-2 border-white shadow-sm`}
                    >
                      <AvatarImage
                        src={
                          msg.avatar_url ||
                          `https://robohash.org/${encodeURIComponent(
                            msg.nickname
                          )}.png`
                        }
                        alt={msg.nickname}
                      />
                      <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                        {getInitials(msg.nickname)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div
                        className={`px-4 py-2 rounded-xl ${
                          msg.is_important
                            ? "bg-amber-100 border border-amber-300 text-amber-800"
                            : msg.user_id === userId
                            ? "bg-purple-600 text-white"
                            : "bg-white border border-gray-200 text-gray-800"
                        } shadow-sm`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <p
                            className={`text-xs font-semibold ${
                              msg.is_important
                                ? "text-amber-800"
                                : msg.user_id === userId
                                ? "text-purple-100"
                                : "text-gray-600"
                            }`}
                          >
                            {msg.nickname}
                          </p>
                          {msg.is_important && (
                            <Star className="h-3 w-3 text-amber-600 fill-amber-600" />
                          )}
                        </div>
                        <p className="break-words whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${
                          msg.user_id === userId
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <p className="text-xs text-gray-500">
                          {formatTime(msg.created_at)}
                        </p>
                        {msg.user_id === userId && renderReadReceipts(msg)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Template Messages */}
        {showTemplates && (
          <div
            className="max-h-60 overflow-y-auto border-t"
            onClick={(e) => e.stopPropagation()}
          >
            <Tabs defaultValue="Game Start">
              <TabsList className="w-full justify-start p-2 bg-gray-50">
                {chatTemplates.map((category) => (
                  <TabsTrigger
                    key={`tab-${category.category}`}
                    value={category.category}
                    className="text-xs"
                  >
                    {category.category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {chatTemplates.map((category) => (
                <TabsContent
                  key={`content-${category.category}`}
                  value={category.category}
                  className="p-2 space-y-1"
                >
                  {category.templates.map((template, index) => (
                    <Button
                      key={`template-${category.category}-${index}`}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-2 px-3 text-sm font-normal"
                      onClick={() => selectTemplate(template)}
                    >
                      {template}
                    </Button>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Input */}
        <form
          className="p-3 border-t flex flex-col gap-2 bg-white"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center gap-1">
            {/* Important Message Toggle */}
            {isHost && (
              <Button
                type="button"
                onClick={toggleImportant}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full ${
                  isImportant ? "bg-amber-100 text-amber-700" : ""
                }`}
                title="Mark as important"
              >
                <Star
                  className={`w-4 h-4 ${
                    isImportant ? "fill-amber-500 text-amber-500" : ""
                  }`}
                />
              </Button>
            )}

            {/* Template Messages */}
            {isHost && (
              <Button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full ${
                  showTemplates ? "bg-blue-50" : ""
                }`}
                title="Template messages"
              >
                <MessageSquarePlus
                  className={`w-4 h-4 ${showTemplates ? "text-blue-600" : ""}`}
                />
              </Button>
            )}

            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1"
              maxLength={500}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim()}
              className="h-9 w-9 rounded-full bg-purple-600 text-white hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Important message info */}
          {isImportant && (
            <div className="flex items-center gap-1 text-xs text-amber-600 px-1">
              <AlertCircle className="w-3 h-3" />
              <span>Pesan ini akan ditandai sebagai penting</span>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
