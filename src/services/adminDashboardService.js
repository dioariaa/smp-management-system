import { supabase } from '../supabase/supabaseClient'

// Ambil statistik dasar dashboard admin
export const getDashboardStats = async () => {
  const [{ count: siswa }, { count: guru }, { count: kelas }] = await Promise.all([
    supabase.from('siswas').select('*', { count: 'exact', head: true }),
    supabase.from('gurus').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalSiswa: siswa || 0,
    totalGuru: guru || 0,
    totalKelas: kelas || 0,
  }
}

// Ambil 10 aktivitas terbaru
export const getRecentActivity = async () => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, users:user_id(email)')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Recent activity error:', error)
    return []
  }

  return data || []
}
