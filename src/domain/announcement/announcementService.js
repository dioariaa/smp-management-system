import { supabase } from '../../supabase/supabaseClient'

/**
 * Fetch announcements with role-based filtering.
 */
export const getAnnouncements = async ({ role, userId }) => {
  let query = supabase
    .from('announcements')
    .select(`
      id, title, message, created_at,
      kelas:kelas_id(nama),
      user:user_id(email)
    `)

  switch (role) {
    case 'guru':
      // Guru hanya lihat pengumuman untuk kelas yang dia ajar atau yang dia buat.
      query = query.or(`guru_id.eq.${userId}, user_id.eq.${userId}`)
      break

    case 'siswa':
      // Siswa hanya pengumuman kelas dia
      const { data: siswa } = await supabase
        .from('siswas')
        .select('kelas_id')
        .eq('user_id', userId)
        .single()

      if (siswa?.kelas_id) {
        query = query.eq('kelas_id', siswa.kelas_id)
      } else {
        return []
      }
      break

    case 'ortu':
      // Ortu → kelas anak
      const { data: relation } = await supabase
        .from('ortu')
        .select('siswa_id')
        .eq('user_id', userId)
        .single()

      if (!relation) return []

      const { data: siswaClass } = await supabase
        .from('siswas')
        .select('kelas_id')
        .eq('id', relation.siswa_id)
        .single()

      if (siswaClass?.kelas_id) {
        query = query.eq('kelas_id', siswaClass.kelas_id)
      } else {
        return []
      }
      break

    case 'admin':
    default:
      break // admin see all
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('getAnnouncements error:', error)
    return []
  }

  return data || []
}

/**
 * Only admin and guru can create announcements.
 */
export const saveAnnouncement = async ({ role, payload }) => {
  if (!['admin', 'guru'].includes(role)) {
    throw new Error('Anda tidak memiliki izin untuk membuat pengumuman.')
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert(payload)
    .select()

  if (error) throw error
  return data
}

/**
 * Only the creator (guru) OR admin can delete.
 */
export const deleteAnnouncement = async ({ role, userId, id }) => {
  if (role === 'admin') {
    return await supabase.from('announcements').delete().eq('id', id)
  }

  if (role === 'guru') {
    return await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
  }

  throw new Error('Anda tidak punya izin menghapus pengumuman ini.')
}
