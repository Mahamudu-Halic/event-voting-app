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
  const { data: session, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
      },
    },
  });
  console.error(session, error);
};

export const signout = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
};
