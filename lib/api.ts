import { supabase } from './supabase';

// Session helpers
export async function createSession(potValue: number) {
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ pot_value: potValue, start_time: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('start_time', { ascending: false });
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
    .eq('session_id', sessionId);
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