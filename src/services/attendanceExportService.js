// src/services/attendanceExportService.js
import { supabase } from '../supabase/supabaseClient'

// Ambil data absensi harian untuk guru tertentu (opsional filter kelas)
export async function fetchDailyAttendance({ guruId, date, kelasId = null }) {
  if (!guruId || !date) {
    throw new Error('guruId dan date wajib diisi')
  }

  let query = supabase
    .from('attendance')
    .select(`
      id,
      date,
      status,
      kelas:kelas_id (
        id,
        nama
      ),
      siswa:siswa_id (
        id,
        first_name,
        last_name,
        nisn
      )
    `)
    .eq('guru_id', guruId)
    .eq('date', date)

  if (kelasId) {
    query = query.eq('kelas_id', kelasId)
  }

  const { data, error } = await query
    .order('kelas_id', { ascending: true })
    .order('siswa_id', { ascending: true })

  if (error) {
    console.error('fetchDailyAttendance error:', error)
    throw error
  }

  return data || []
}

// Konversi ke CSV dan trigger download di browser
export function downloadAttendanceAsCsv({ rows, date, kelasName = 'semua_kelas' }) {
  if (!rows || rows.length === 0) {
    throw new Error('Tidak ada data absensi untuk diekspor')
  }

  const safeDate = (date || '').replace(/:/g, '-')
  const safeKelas = (kelasName || 'semua_kelas').replace(/\s+/g, '_')

  const header = [
    'Tanggal',
    'Kelas',
    'NISN',
    'Nama Siswa',
    'Status'
  ]

  const lines = [header.join(',')]

  for (const row of rows) {
    const tanggal = row.date || ''
    const kelas = row.kelas?.nama || ''
    const nisn = row.siswa?.nisn || ''
    const nama = `${row.siswa?.first_name || ''} ${row.siswa?.last_name || ''}`.trim()
    const status = row.status || ''

    const line = [
      tanggal,
      kelas,
      nisn,
      `"${nama.replace(/"/g, '""')}"`,
      status
    ].join(',')

    lines.push(line)
  }

  const csvContent = lines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `absensi_${safeDate}_${safeKelas}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
