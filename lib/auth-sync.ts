import { supabase } from './supabase';

export async function createSupabaseUser(clerkUserId: string, email: string) {
  // Create a custom JWT or use Supabase's signUp with a custom provider
  const { data, error } = await supabase.auth.signUp({
    email,
    password: crypto.randomUUID(), // Random password since Clerk handles auth
    options: {
      data: {
        clerk_user_id: clerkUserId
      }
    }
  });
  
  return { data, error };
}