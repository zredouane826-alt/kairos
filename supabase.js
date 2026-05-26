import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = "https://rghjgyzpdadapmktislv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnaGpneXpwZGFkYXBta3Rpc2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTc0ODMsImV4cCI6MjA5NDU5MzQ4M30.x4YQcle2f87bSUsP6PTK3bT24pZBqdwFP6iYg0qFmE4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
