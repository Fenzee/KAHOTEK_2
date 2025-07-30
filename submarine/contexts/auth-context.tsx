"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, fullname: string, country?: string | null, phone?: string | null) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true) // Add this

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      setInitialLoad(false) // Add this
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (!initialLoad) {
        // Only set loading false after initial load
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (
    email: string, 
    password: string, 
    username: string, 
    fullname: string, 
    country?: string | null, 
    phone?: string | null
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error

    if (data.user) {
      // Create profile with all required fields
      const profileData = {
        id: data.user.id,
        username,
        email,
        country: country || null,
        phone: phone || null,
        avatar_url: null,
        created_at: new Date().toISOString()
      };

      // Add fullname if provided
      if (fullname) {
        profileData.fullname = fullname;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert(profileData);
        
      // If error due to missing fullname column, try without it
      if (profileError && profileError.message?.includes('fullname')) {
        console.log("Retrying profile creation without fullname field...");
        const { fullname, ...profileDataWithoutFullname } = profileData;
        
        const { error: retryError } = await supabase
          .from("profiles")
          .insert(profileDataWithoutFullname);
          
        if (retryError) {
          console.error("Error creating profile (retry):", retryError);
          throw retryError;
        }
      } else if (profileError) {
        console.error("Error creating profile:", profileError);
        throw profileError;
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Remove the force redirect - let the component handle navigation
    // window.location.href = "/"
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
