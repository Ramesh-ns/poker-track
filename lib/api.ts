import { supabase } from './supabase';

// Session helpers
export async function createSession(sessionName: string, potValue: number, potMode: 'fixed' | 'direct' = 'fixed') {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User must be authenticated to create a session');
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert([{ 
      session_name: sessionName, 
      pot_value: potValue, 
      pot_mode: potMode, 
      start_time: new Date().toISOString(),
      user_id: user.id 
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSessions() {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User must be authenticated to fetch sessions');
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false });
  if (error) throw error;
  return data;
}

export async function endSession(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ is_active: false, end_time: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Player helpers
export async function addPlayer(sessionId: string, name: string) {
  const { data, error } = await supabase
    .from('players')
    .insert([{ session_id: sessionId, name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPlayers(sessionId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// Update player pots taken
export async function updatePotsTaken(playerId: string, potsTaken: number) {
  const { data, error } = await supabase
    .from('players')
    .update({ pots_taken: potsTaken })
    .eq('id', playerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update player pots returned
export async function updatePotsReturned(playerId: string, potsReturned: number) {
  const { data, error } = await supabase
    .from('players')
    .update({ pots_returned: potsReturned })
    .eq('id', playerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete player
export async function deletePlayer(playerId: string) {
  const { data, error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId)
    .select();
  if (error) {
    throw error;
  }
  return { success: true, deletedRows: data?.length || 0 };
} 