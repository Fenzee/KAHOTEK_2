"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { uploadImage } from "@/lib/upload-image";
import {
  User,
  Mail,
  Camera,
  Loader2,
  Save,
  ArrowLeft,
  Slack,
  Shield,
  Key,
  LogOut,
  Trash2,
  Globe,
  Phone,
  School,
  Calendar,
  MapPin,
  Search
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import flag-icons CSS
import "flag-icons/css/flag-icons.min.css";

// Add import for LocationMap component
import { LocationMap } from "@/components/ui/location-map";
import dynamic from "next/dynamic";

// Dynamically import LocationMap with no SSR to avoid hydration issues
const DynamicLocationMap = dynamic(
  () => import("@/components/ui/location-map").then((mod) => mod.LocationMap),
  { ssr: false }
);

// List of countries for the dropdown
const countries = [
  { value: "none", label: "Pilih Negara", code: "" },
  { value: "ID", label: "Indonesia", code: "id" },
  { value: "MY", label: "Malaysia", code: "my" },
  { value: "SG", label: "Singapura", code: "sg" },
  { value: "US", label: "Amerika Serikat", code: "us" },
  { value: "GB", label: "Inggris", code: "gb" },
  { value: "JP", label: "Jepang", code: "jp" },
  { value: "KR", label: "Korea Selatan", code: "kr" },
  { value: "CN", label: "China", code: "cn" },
  { value: "AU", label: "Australia", code: "au" },
  { value: "DE", label: "Jerman", code: "de" },
  { value: "FR", label: "Prancis", code: "fr" },
  { value: "IT", label: "Italia", code: "it" },
  { value: "ES", label: "Spanyol", code: "es" },
  { value: "NL", label: "Belanda", code: "nl" },
  { value: "BR", label: "Brasil", code: "br" },
  { value: "CA", label: "Kanada", code: "ca" },
  { value: "MX", label: "Meksiko", code: "mx" },
  { value: "AR", label: "Argentina", code: "ar" },
  { value: "IN", label: "India", code: "in" },
  { value: "RU", label: "Rusia", code: "ru" },
  { value: "ZA", label: "Afrika Selatan", code: "za" },
  { value: "NG", label: "Nigeria", code: "ng" },
  { value: "EG", label: "Mesir", code: "eg" },
  { value: "SA", label: "Arab Saudi", code: "sa" },
  { value: "AE", label: "Uni Emirat Arab", code: "ae" },
  { value: "TH", label: "Thailand", code: "th" },
  { value: "VN", label: "Vietnam", code: "vn" },
  { value: "PH", label: "Filipina", code: "ph" },
  { value: "NZ", label: "Selandia Baru", code: "nz" },
];

// Calculate age from birthdate
const calculateAge = (birthdate: string | null): number | null => {
  if (!birthdate) return null;
  
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Add debounce function for search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    username: string;
    fullname: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
    country?: string | null;
    school?: string | null;
    phone?: string | null;
    birthdate?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    country: "none",
    school: "",
    phone: "",
    birthdate: "",
    address: "",
  });

  // Add address search state
  const [addressSearch, setAddressSearch] = useState("");
  const [addressResults, setAddressResults] = useState<Array<{
    formatted: string;
    lat: number;
    lng: number;
  }>>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [showAddressResults, setShowAddressResults] = useState(false);

  // Add map preview state
  const [showMapPreview, setShowMapPreview] = useState(false);

  // Add debounced search term
  const debouncedAddressSearch = useDebounce(addressSearch, 500);

  // Update searchAddress function to be useCallback
  const searchAddress = useCallback(async () => {
    if (!addressSearch.trim() || addressSearch.trim().length < 3) return;
    
    setSearchingAddress(true);
    setAddressResults([]);
    
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(addressSearch)}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setAddressResults(data.results.map((result: any) => ({
          formatted: result.formatted,
          lat: result.geometry.lat,
          lng: result.geometry.lng
        })));
        setShowAddressResults(true);
      } else {
        // Don't show error toast for automatic searches
        if (addressSearch.trim().length > 3) {
          setShowAddressResults(false);
        }
      }
    } catch (error) {
      console.error("Error searching address:", error);
      // Don't show error toast for automatic searches
    } finally {
      setSearchingAddress(false);
    }
  }, [addressSearch]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      fetchUserProfile();
    }
  }, [user, authLoading, router]);

  // Add effect to automatically search when debounced value changes
  useEffect(() => {
    if (debouncedAddressSearch.trim().length >= 3) {
      searchAddress();
    } else {
      setShowAddressResults(false);
    }
  }, [debouncedAddressSearch, searchAddress]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, fullname, email, avatar_url, created_at, country, school, phone, birthdate, address, latitude, longitude")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Gagal memuat profil");
        return;
      }

      setUserProfile(data);
      setFormData({
        username: data.username || "",
        fullname: data.fullname || "",
        country: data.country || "none",
        school: data.school || "",
        phone: data.phone || "",
        birthdate: data.birthdate || "",
        address: data.address || "",
      });
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      toast.error("Terjadi kesalahan saat memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Add selectAddress function
  const selectAddress = (address: string, lat: number, lng: number) => {
    setFormData({
      ...formData,
      address
    });
    setAddressSearch(address);
    setShowAddressResults(false);
    setShowMapPreview(true);
    
    // Store lat/lng in state for saving later
    setUserProfile(prev => prev ? {
      ...prev,
      address,
      latitude: lat,
      longitude: lng
    } : null);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Check if username is already taken (but not by current user)
      if (formData.username !== userProfile?.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", formData.username)
          .neq("id", user.id)
          .single();

        if (existingUser) {
          toast.error("Username sudah digunakan");
          setSaving(false);
          return;
        }
      }

      // Prepare update data
      const updateData = {
        username: formData.username,
        fullname: formData.fullname,
        country: formData.country === "none" ? null : formData.country,
        school: formData.school || null,
        phone: formData.phone || null,
        birthdate: formData.birthdate || null,
        address: formData.address || null,
        latitude: userProfile?.latitude || null,
        longitude: userProfile?.longitude || null,
      };

      // Add updated_at if the column exists in the profiles table
      try {
        const { error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id);

        if (error) {
          console.error("Specific update error:", error);
          throw error;
        }

        toast.success("Profil berhasil diperbarui");
        fetchUserProfile(); // Refresh data
      } catch (updateError: any) {
        console.error("Error in update operation:", updateError);
        
        // If the error is related to updated_at column, try without it
        if (updateError.message && updateError.message.includes("updated_at")) {
          try {
            const { error: retryError } = await supabase
              .from("profiles")
              .update({
                username: formData.username,
                fullname: formData.fullname,
                country: formData.country === "none" ? null : formData.country,
                school: formData.school || null,
                phone: formData.phone || null,
                birthdate: formData.birthdate || null,
                address: formData.address || null,
                latitude: userProfile?.latitude || null,
                longitude: userProfile?.longitude || null,
              })
              .eq("id", user.id);
            
            if (retryError) throw retryError;
            
            toast.success("Profil berhasil diperbarui");
            fetchUserProfile(); // Refresh data
          } catch (finalError: any) {
            console.error("Final error:", finalError);
            toast.error(finalError.message || "Gagal memperbarui profil");
          }
        } else {
          toast.error(updateError.message || "Gagal memperbarui profil");
        }
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploadingImage(true);

    try {
      // Process image before upload to ensure it's square
      const processedFile = await processImageForAvatar(file);
      
      // Upload image to storage
      const imageUrl = await uploadImage(processedFile, `avatars/${user.id}`);

      if (!imageUrl) {
        throw new Error("Gagal mengunggah gambar");
      }

      // Update profile with new avatar URL
      try {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: imageUrl,
          })
          .eq("id", user.id);

        if (updateError) throw updateError;

        toast.success("Foto profil berhasil diperbarui");
        fetchUserProfile(); // Refresh data
      } catch (updateError: any) {
        console.error("Error updating avatar:", updateError);
        toast.error(updateError.message || "Gagal memperbarui foto profil");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Gagal mengunggah gambar");
    } finally {
      setUploadingImage(false);
    }
  };

  // Process image to ensure it's square with proper aspect ratio
  const processImageForAvatar = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Create a square canvas with the minimum dimension
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        
        // Calculate position to crop from center
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        
        // Draw the image on the canvas (cropped to square)
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not create image blob'));
            return;
          }
          
          // Create a new file from the blob
          const processedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          
          resolve(processedFile);
        }, file.type);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Load the image from the file
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Gagal keluar");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center text-blue-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Profil tidak ditemukan
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
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Profil Saya</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto ">
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 ">
              {/* Left side - Avatar and basic info */}
              <div className="flex flex-col items-center md:w-1/3 bg-slate-100 px-7 rounded-xl pt-11 pb-20 h-fit">
                <div className="relative">
                  <div className="rounded-full overflow-hidden w-32 h-32 border-4 border-white shadow-lg">
                    <Avatar className="w-full h-full">
                      <AvatarImage 
                        src={userProfile?.avatar_url || `https://robohash.org/${encodeURIComponent(user?.email || "user")}.png`} 
                        alt={userProfile?.username} 
                        className="object-cover w-full h-full"
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-4xl">
                        {userProfile?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </label>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </div>
                <h2 className="text-2xl font-bold mt-4">{userProfile?.username}</h2>
                <p className="text-gray-600">{userProfile?.email}</p>
                
                {userProfile?.country && userProfile.country !== "none" && (
                  <div className="flex items-center mt-2 text-blue-600">
                    {countries.find(c => c.value === userProfile.country)?.code && (
                      <span className={`fi fi-${countries.find(c => c.value === userProfile.country)?.code} mr-2`} style={{ fontSize: "1.2em" }}></span>
                    )}
                    <span>{countries.find(c => c.value === userProfile.country)?.label}</span>
                  </div>
                )}
                
                {userProfile?.school && (
                  <div className="flex items-center mt-2 text-blue-600">
                    <School className="w-4 h-4 mr-2" />
                    <span>{userProfile.school}</span>
                  </div>
                )}
                
                {userProfile?.birthdate && (
                  <div className="flex items-center mt-2 text-blue-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(userProfile.birthdate).toLocaleDateString()} ({calculateAge(userProfile.birthdate)} tahun)</span>
                  </div>
                )}
                
                <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200">
                  Bergabung {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : ''}
                </Badge>
                
                {userProfile?.latitude && userProfile?.longitude && (
                  <div className="mt-4 w-full">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Lokasi</h3>
                    <DynamicLocationMap 
                      latitude={Number(userProfile.latitude)} 
                      longitude={Number(userProfile.longitude)}
                      address={userProfile.address || undefined}
                      height="200px"
                      zoom={14}
                    />
                  </div>
                )}
              </div>

              {/* Right side - Edit profile form */}
              <div className="md:w-2/3">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-200/50 rounded-lg p-1 shadow-inner mb-6">
                    <TabsTrigger
                      value="profile"
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-200"
                    >
                      Profil
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all duration-200"
                    >
                      Keamanan
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-700 font-medium">
                          Username
                        </Label>
                        <div className="relative">
                          <User className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <Input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="username_anda"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullname" className="text-gray-700 font-medium">
                          Nama Lengkap
                        </Label>
                        <div className="relative">
                          <User className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <Input
                            id="fullname"
                            name="fullname"
                            type="text"
                            placeholder="Nama lengkap anda"
                            value={formData.fullname}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="school" className="text-gray-700 font-medium">
                          Asal Sekolah
                        </Label>
                        <div className="relative">
                          <School className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <Input
                            id="school"
                            name="school"
                            type="text"
                            placeholder="Nama sekolah/institusi anda"
                            value={formData.school}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 font-medium">
                          Nomor Telepon <span className="text-gray-400 text-sm">(Opsional)</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="Nomor telepon anda"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="birthdate" className="text-gray-700 font-medium">
                          Tanggal Lahir
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <Input
                            id="birthdate"
                            name="birthdate"
                            type="date"
                            value={formData.birthdate}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-gray-700 font-medium">
                          Negara
                        </Label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                          <Select
                            value={formData.country}
                            onValueChange={(value) => handleSelectChange("country", value)}
                          >
                            <SelectTrigger className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                              <SelectValue>
                                {formData.country && formData.country !== "none" ? (
                                  <span className="flex items-center">
                                    <span className={`fi fi-${countries.find(c => c.value === formData.country)?.code} mr-2`}></span>
                                    {countries.find(c => c.value === formData.country)?.label}
                                  </span>
                                ) : (
                                  "Pilih negara"
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.value} value={country.value}>
                                  {country.code ? (
                                    <span className="flex items-center">
                                      <span className={`fi fi-${country.code} mr-2`}></span>
                                      {country.label}
                                    </span>
                                  ) : (
                                    <span>{country.label}</span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Display address in profile */}
                      {userProfile?.address && (
                        <div className="flex items-center mt-2 text-blue-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{userProfile.address}</span>
                        </div>
                      )}

                      {/* Add address field to form */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address" className="text-gray-700 font-medium">
                          Alamat
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <Input
                            id="addressSearch"
                            name="addressSearch"
                            type="text"
                            placeholder="Cari alamat anda"
                            value={addressSearch}
                            onChange={(e) => setAddressSearch(e.target.value)}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl w-full"
                          />
                          {searchingAddress && (
                            <div className="absolute right-4 top-4">
                              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                            </div>
                          )}
                          
                          {showAddressResults && addressResults.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {addressResults.map((result, index) => (
                                <div
                                  key={index}
                                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => selectAddress(result.formatted, result.lat, result.lng)}
                                >
                                  {result.formatted}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Ketik untuk mencari alamat atau masukkan secara manual</p>
                      </div>

                      {showMapPreview && userProfile?.latitude && userProfile?.longitude && (
                        <div className="md:col-span-2">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Pratinjau Lokasi</h3>
                          <DynamicLocationMap 
                            latitude={Number(userProfile.latitude)} 
                            longitude={Number(userProfile.longitude)}
                            address={formData.address}
                            height="200px"
                            zoom={14}
                          />
                        </div>
                      )}

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email" className="text-gray-700 font-medium">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={userProfile?.email}
                            className="pl-12 h-12 border-2 border-gray-200 bg-gray-100 rounded-xl"
                            disabled
                          />
                        </div>
                        <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                      </div>

                      <div className="md:col-span-2">
                        <Button
                          onClick={handleSaveProfile}
                          className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-4"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Simpan Perubahan
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-6">
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-5 w-5 text-blue-500" />
                          <CardTitle className="text-lg">Keamanan Akun</CardTitle>
                        </div>
                        <CardDescription>
                          Kelola pengaturan keamanan akun Anda
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button
                          variant="outline"
                          className="w-full justify-start border-gray-200 hover:bg-gray-50"
                          onClick={() => router.push("/auth/reset-password")}
                        >
                          <Key className="w-4 h-4 mr-2 text-gray-500" />
                          Ubah Password
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
                          onClick={handleSignOut}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Keluar
                        </Button>

                        <div className="pt-4 border-t border-gray-200">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Akun
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Menghapus akun akan menghapus semua data Anda secara permanen.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
