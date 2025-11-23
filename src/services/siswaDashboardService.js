// src/services/siswaDashboardService.js
import { supabase } from '../supabase/supabaseClient'

// Profil siswa + nama kelas
export const fetchSiswaProfile = async (userId) => {
  if (!userId) return null

  const { data, error } = await supabase
    .from('siswas')
    .select(`
      id,
      first_name,
      last_name,
      nisn,
      status,
      kelas_id,
      kelas:kelas_id ( id, nama )
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('fetchSiswaProfile error:', error)
    throw error
  }

  return data
}

// Kehadiran 7 hari terakhir
export const fetchWeeklyAttendance = async (siswaId) => {
  if (!siswaId) return []

  const since = new Date()
  since.setDate(since.getDate() - 6)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('attendance')
    .select('date, status')
    .eq('siswa_id', siswaId)
    .gte('date', sinceStr)
    .order('date', { ascending: true })

  if (error) {
    console.error('fetchWeeklyAttendance error:', error)
    return []
  }

  return data || []
}

// Nilai per mapel (rata-rata)
export const fetchGradesBySubject = async (siswaId) => {
  if (!siswaId) return []

  const { data, error } = await supabase
    .from('grades')
    .select('mapel, nilai')
    .eq('siswa_id', siswaId)

  if (error) {
    console.error('fetchGradesBySubject error:', error)
    return []
  }

  if (!data) return []

  const map = {}
  data.forEach((row) => {
    if (!row.mapel) return
    if (!map[row.mapel]) {
      map[row.mapel] = { total: 0, count: 0 }
    }
    map[row.mapel].total += Number(row.nilai || 0)
    map[row.mapel].count += 1
  })

  return Object.entries(map).map(([mapel, { total, count }]) => ({
    mapel,
    rata: count ? total / count : 0,
  }))
}

// Pengumuman (kelas + umum)
export const fetchSiswaAnnouncements = async (kelasId) => {
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, message, created_at, kelas_id')
    .or(
      `kelas_id.is.null${kelasId ? `,kelas_id.eq.${kelasId}` : ''}`
    )
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('fetchSiswaAnnouncements error:', error)
    return []
  }

  return data || []
}
