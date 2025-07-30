"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { MapPin, User, ArrowLeft, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";

// Import flag-icons CSS
import "flag-icons/css/flag-icons.min.css";

// Dynamically import Indonesia Map with no SSR
const IndonesiaMap = dynamic(() => import("@/components/ui/indonesia-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

// Data struktur untuk pengguna dengan lokasi
interface UserWithLocation {
  id: string;
  username: string;
  fullname?: string | null;
  avatar_url: string | null;
  country: string | null;
  location?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
}

// Daftar provinsi Indonesia
const INDONESIAN_PROVINCES = [
  { value: "all", label: "Semua Provinsi" },
  { value: "Aceh", label: "Aceh" },
  { value: "Sumatera Utara", label: "Sumatera Utara" },
  { value: "Sumatera Barat", label: "Sumatera Barat" },
  { value: "Riau", label: "Riau" },
  { value: "Kepulauan Riau", label: "Kepulauan Riau" },
  { value: "Jambi", label: "Jambi" },
  { value: "Sumatera Selatan", label: "Sumatera Selatan" },
  { value: "Bangka Belitung", label: "Bangka Belitung" },
  { value: "Bengkulu", label: "Bengkulu" },
  { value: "Lampung", label: "Lampung" },
  { value: "DKI Jakarta", label: "DKI Jakarta" },
  { value: "Jawa Barat", label: "Jawa Barat" },
  { value: "Banten", label: "Banten" },
  { value: "Jawa Tengah", label: "Jawa Tengah" },
  { value: "DI Yogyakarta", label: "DI Yogyakarta" },
  { value: "Jawa Timur", label: "Jawa Timur" },
  { value: "Bali", label: "Bali" },
  { value: "Nusa Tenggara Barat", label: "Nusa Tenggara Barat" },
  { value: "Nusa Tenggara Timur", label: "Nusa Tenggara Timur" },
  { value: "Kalimantan Barat", label: "Kalimantan Barat" },
  { value: "Kalimantan Tengah", label: "Kalimantan Tengah" },
  { value: "Kalimantan Selatan", label: "Kalimantan Selatan" },
  { value: "Kalimantan Timur", label: "Kalimantan Timur" },
  { value: "Kalimantan Utara", label: "Kalimantan Utara" },
  { value: "Sulawesi Utara", label: "Sulawesi Utara" },
  { value: "Gorontalo", label: "Gorontalo" },
  { value: "Sulawesi Tengah", label: "Sulawesi Tengah" },
  { value: "Sulawesi Barat", label: "Sulawesi Barat" },
  { value: "Sulawesi Selatan", label: "Sulawesi Selatan" },
  { value: "Sulawesi Tenggara", label: "Sulawesi Tenggara" },
  { value: "Maluku", label: "Maluku" },
  { value: "Maluku Utara", label: "Maluku Utara" },
  { value: "Papua", label: "Papua" },
  { value: "Papua Barat", label: "Papua Barat" },
  { value: "Papua Selatan", label: "Papua Selatan" },
  { value: "Papua Tengah", label: "Papua Tengah" },
  { value: "Papua Pegunungan", label: "Papua Pegunungan" },
  { value: "Papua Barat Daya", label: "Papua Barat Daya" }
];

export default function MapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithLocation[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      fetchUsersWithLocation();
    }
  }, [user, loading, router]);

  const fetchUsersWithLocation = async () => {
    try {
      setLoadingUsers(true);
      
      // Fetch users with location data
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, fullname, avatar_url, country, address, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      
      if (error) {
        console.error("Error fetching users with location:", error);
        return;
      }

      setUsers(data as UserWithLocation[]);
    } catch (error) {
      console.error("Error in fetchUsersWithLocation:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search term and province filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm ? 
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.address?.toLowerCase().includes(searchTerm.toLowerCase())) : true;
       
    // Implementasi filter provinsi akan memerlukan data tambahan yang memetakan koordinat ke provinsi
    // Untuk demonstrasi, kita gunakan alamat untuk filter sederhana
    const matchesProvince = provinceFilter !== "all" ? 
      user.address?.includes(provinceFilter) : true;
      
    return matchesSearch && matchesProvince;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 text-gray-900">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-6000"></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Button 
          variant="ghost" 
          className="bg-white/20 backdrop-blur-sm text-white mb-6 hover:bg-white/30"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>
        
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <MapPin className="h-6 w-6 mr-2 text-blue-600" />
                Peta Pengguna Indonesia
              </h1>
              <p className="text-gray-600">
                Lihat sebaran pengguna GolekQuiz di seluruh Indonesia
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Cari berdasarkan nama atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={provinceFilter}
                onValueChange={(value) => setProvinceFilter(value)}
              >
                <SelectTrigger className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {INDONESIAN_PROVINCES.map((province) => (
                    <SelectItem key={province.value} value={province.value}>
                      {province.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Map and User List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Container */}
            <Card className="lg:col-span-2 bg-white/90 border-none shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[500px] w-full">
                  <IndonesiaMap height="500px" />
                </div>
              </CardContent>
            </Card>

            {/* User List */}
            <Card className="bg-white/90 border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  Daftar Pengguna ({filteredUsers.length})
                </CardTitle>
                <CardDescription>
                  Pengguna dengan data lokasi
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto pr-2">
                {loadingUsers ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10">
                    <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Tidak ada pengguna ditemukan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <div 
                        key={user.id} 
                        className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={user.avatar_url || `https://robohash.org/${user.username}.png`} 
                            alt={user.username}
                          />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-800 truncate">{user.username}</h3>
                            {user.country && user.country !== "none" && (
                              <span 
                                className={`fi fi-${user.country.toLowerCase()} rounded-sm w-4 h-3 overflow-hidden shadow-sm border border-gray-200`}
                              ></span>
                            )}
                          </div>
                          {user.address && (
                            <p className="text-xs text-gray-500 truncate">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              {user.address}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 