// src/services/announcementService.js
import { supabase } from '../supabase/supabaseClient'

export async function fetchAnnouncements(role) {
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, message, created_at') // <-- ga pake content/target/kelas_id dulu
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch announcements error:', error)
    throw error
  }

  return data || []
}
