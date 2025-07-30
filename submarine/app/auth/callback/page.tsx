"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageWithLoading } from "@/components/ui/page-with-loading";

function AuthCallbackPageContent() {
  const router = useRouter();
  const [status, setStatus] = useState("Memproses login...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Proses callback OAuth dari provider
    const handleAuthCallback = async () => {
      try {
        setStatus("Memverifikasi session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error auth callback:", error);
          setStatus("Gagal memverifikasi session");
          setIsError(true);
          setTimeout(() => {
            router.push("/auth/login?error=Authentication failed");
          }, 2000);
          return;
        }
        
        if (data.session) {
          setStatus("Menyiapkan profil...");
          // Cek apakah user sudah memiliki profil
          await ensureUserProfile(data.session.user);
          
          setStatus("Berhasil! Mengarahkan ke dashboard...");
          // Berhasil login, redirect ke dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        } else {
          setStatus("Session tidak ditemukan");
          setIsError(true);
          // Tidak ada session, kembali ke login
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        setStatus("Terjadi kesalahan saat memproses login");
        setIsError(true);
        setTimeout(() => {
          router.push("/auth/login?error=Callback processing failed");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  // Fungsi untuk memastikan user memiliki profil
  const ensureUserProfile = async (user: any) => {
    if (!user) return;
    
    try {
      // Cek apakah profil sudah ada
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
      
      // Jika profil tidak ditemukan, buat profil baru
      if (profileError && profileError.code === "PGRST116") {
        console.log("Creating new profile for OAuth user");
        
        // Ekstrak username dari email
        let username = "";
        if (user.email) {
          username = user.email.split('@')[0];
          
          // Tambahkan angka random jika username sudah ada
          const { data: usernameExists } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", username)
            .single();
            
          if (usernameExists) {
            username = `${username}${Math.floor(Math.random() * 1000)}`;
          }
        } else {
          username = `user_${Math.floor(Math.random() * 10000)}`;
        }
        
        // Buat profil baru dengan semua field yang diperlukan
        const profileData: any = {
          id: user.id,
          username: username,
          email: user.email || "",
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString()
        };

        // Add fullname if it exists in user metadata
        const fullname = user.user_metadata?.full_name || user.user_metadata?.name || username;
        if (fullname) {
          profileData.fullname = fullname;
        }
        
        const { error: insertError } = await supabase
          .from("profiles")
          .insert(profileData);
          
        // If error due to missing column, try without fullname
        if (insertError && insertError.message?.includes('fullname')) {
          console.log("Retrying profile creation without fullname field...");
          const { fullname, ...profileDataWithoutFullname } = profileData;
          
          const { error: retryError } = await supabase
            .from("profiles")
            .insert(profileDataWithoutFullname);
            
          if (retryError) {
            console.error("Error creating profile (retry):", retryError);
            throw retryError;
          } else {
            console.log("Profile created successfully without fullname field");
          }
        } else if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        } else {
          console.log("Profile created successfully for user:", user.id);
        }
      } else if (profileError) {
        console.error("Error checking existing profile:", profileError);
        throw profileError;
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        {!isError ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <p className={`${isError ? 'text-red-600' : 'text-blue-600'} font-medium`}>
          {status}
        </p>
        {isError && (
          <p className="text-gray-500 text-sm mt-2">
            Anda akan diarahkan kembali dalam beberapa detik...
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memproses autentikasi...</p>
        </div>
      </div>
    }>
      <PageWithLoading 
        animation="fade"
        customLoadingMessage="Memproses autentikasi..."
        customLoadingVariant="default"
      >
        <AuthCallbackPageContent />
      </PageWithLoading>
    </Suspense>
  );
}