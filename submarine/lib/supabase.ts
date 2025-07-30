import { createClient } from "@supabase/supabase-js"

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

if (supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder-key") {
  console.warn("⚠️ Supabase credentials not configured. Using placeholder values.")
  console.warn("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          created_at: string
          fullname: string
        }
        Insert: {
          id: string
          username: string
          email: string
          created_at?: string
          fullname: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          created_at?: string
          fullname: string
        }
      }
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          creator_id: string
          is_public: boolean
          created_at: string
          category: string
          language: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          creator_id: string
          is_public?: boolean
          created_at?: string
          category?: string
          language?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          creator_id?: string
          is_public?: boolean
          created_at?: string
          category?: string
          language?: string
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          time_limit: number
          points: number
          order_index: number
          created_at: string
          image_url: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          time_limit: number
          points: number
          order_index: number
          created_at?: string
          image_url?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          time_limit?: number
          points?: number
          order_index?: number
          created_at?: string
          image_url?: string | null
        }
      }
      answers: {
        Row: {
          id: string
          question_id: string
          answer_text: string
          is_correct: boolean
          color: string
          order_index: number
          created_at: string
          image_url: string | null
        }
        Insert: {
          id?: string
          question_id: string
          answer_text: string
          is_correct: boolean
          color: string
          order_index: number
          created_at?: string
          image_url?: string | null
        }
        Update: {
          id?: string
          question_id?: string
          answer_text?: string
          is_correct?: boolean
          color?: string
          order_index?: number
          created_at?: string
          image_url?: string | null
        }
      }
      game_sessions: {
        Row: {
          id: string
          quiz_id: string
          host_id: string
          game_pin: string
          status: string
          current_question: number
          created_at: string
          started_at: string | null
          ended_at: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          host_id: string
          game_pin: string
          status?: string
          current_question?: number
          created_at?: string
          started_at?: string | null
          ended_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          host_id?: string
          game_pin?: string
          status?: string
          current_question?: number
          created_at?: string
          started_at?: string | null
          ended_at?: string | null
        }
      }
      game_participants: {
        Row: {
          id: string
          session_id: string
          nickname: string
          score: number
          joined_at: string
        }
        Insert: {
          id?: string
          session_id: string
          nickname: string
          score?: number
          joined_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          nickname?: string
          score?: number
          joined_at?: string
        }
      }
      game_responses: {
        Row: {
          id: string
          session_id: string
          participant_id: string
          question_id: string
          answer_id: string
          response_time: number
          points_earned: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          participant_id: string
          question_id: string
          answer_id: string
          response_time: number
          points_earned?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          participant_id?: string
          question_id?: string
          answer_id?: string
          response_time?: number
          points_earned?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_game_pin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_participant_score: {
        Args: {
          participant_id: string
          points_to_add: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
