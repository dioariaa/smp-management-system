import { supabase } from '../../supabase/supabaseClient'

/**
 * Get grades with role-based filtering.
 * Admin   → semua siswa
 * Guru    → siswa yang dia ajar / kelas dia
 * Siswa   → hanya dirinya sendiri
 * Ortu    → hanya anaknya
 */
export const getGrades = async ({ role, userId }) => {

  let query = supabase
    .from('grades')
    .select(`
      id, nilai, created_at,
      siswa:siswa_id(first_name, last_name, nisn),
      mapel:mapel_id(nama),
      kelas:kelas_id(nama)
    `)

  // ROLE FILTERS
  switch (role) {
    case 'guru':
      query = query.eq('guru_id', userId)
      break

    case 'siswa':
      query = query.eq('siswa_id', userId)
      break

    case 'ortu':
      // Ambil siswa_id terkait ortu
      const { data: relation } = await supabase
        .from('ortu')
        .select('siswa_id')
        .eq('user_id', userId)
        .single()

      if (!relation) return []
      query = query.eq('siswa_id', relation.siswa_id)
      break

    case 'admin':
    default:
      break // full access
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('getGrades error:', error)
    return []
  }

  return data || []
}


/**
 * Insert/update grade (only admin + guru)
 */
export const saveGrade = async ({ role, payload }) => {
  if (!['admin', 'guru'].includes(role)) {
    throw new Error('You do not have permission to modify grades.')
  }

  const { data, error } = await supabase
    .from('grades')
    .upsert(payload)
    .select()

  if (error) throw error
  return data
}
