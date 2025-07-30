import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Ambil data pengguna dari database dengan lokasi mereka
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, country, location, latitude, longitude")
      .not("latitude", "is", null)
      .not("longitude", "is", null);
    
    if (error) {
      console.error("Error fetching users with locations:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in users/locations API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 