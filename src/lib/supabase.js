import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const saveUserProgress = async (userId, progress) => {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({ user_id: userId, ...progress });
  return { data, error };
};

export const fetchUserProgress = async (userId) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
};
