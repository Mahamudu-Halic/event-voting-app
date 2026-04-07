"use server"

import { createClient } from "@/lib/supabase/server";

export const login = async (data: { email: string; password: string }) => {
  const supabase = await createClient();
  const { data: session, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  return { session, error };
};

export const signup = async (data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}) => {
  const supabase = await createClient();
  const { data: user, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        role: 'organizer', // Default role for new users
      },
    },
  });
  return { user, error };
};

export const signout = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Forgot password - send reset email
export const forgotPassword = async (email: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });
  return { data, error };
};

// Reset password with token
export const resetPassword = async (newPassword: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
};
