// src/services/guruGradeService.js
import { supabase } from '../supabase/supabaseClient'

// ambil semua kelas (bisa difilter ke kelas yang diajar guru nanti)
export const fetchGuruClasses = async () => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama')
    .order('nama', { ascending: true })

  if (error) {
    console.error('fetchGuruClasses error:', error)
    throw error
  }

  return data || []
}

// ambil siswa per kelas
export const fetchStudentsByClass = async (kelasId) => {
  if (!kelasId) return []
  const { data, error } = await supabase
    .from('siswas')
    .select('id, first_name, last_name, nisn')
    .eq('kelas_id', kelasId)
    .order('first_name', { ascending: true })

  if (error) {
    console.error('fetchStudentsByClass error:', error)
    throw error
  }

  return data || []
}

// ambil nilai yang sudah ada untuk kelas + mapel + tanggal
export const fetchGradesByClassMapelDate = async (kelasId, mapel, tanggal) => {
  if (!kelasId || !mapel || !tanggal) return []

  const { data, error } = await supabase
    .from('grades')
    .select('id, siswa_id, nilai')
    .eq('kelas_id', kelasId)
    .eq('mapel', mapel)
    .eq('tanggal', tanggal)

  if (error) {
    console.error('fetchGradesByClassMapelDate error:', error)
    throw error
  }

  return data || []
}

// simpan nilai per siswa (insert/update)
export const saveGradesForClass = async ({ userId, kelasId, mapel, tanggal, items }) => {
  if (!userId || !kelasId || !mapel || !tanggal || !Array.isArray(items)) {
    throw new Error('Parameter nilai tidak lengkap')
  }

  // ambil guru_id dari user_id
  const { data: guruRow, error: guruError } = await supabase
    .from('gurus')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (guruError || !guruRow) {
    console.error('saveGradesForClass guruError:', guruError)
    throw new Error('Data guru tidak ditemukan')
  }

  const guruId = guruRow.id

  for (const item of items) {
    if (!item.siswa_id) continue

    // nilai boleh kosong → skip
    if (item.nilai === '' || item.nilai === null || item.nilai === undefined) {
      continue
    }

    const numericNilai = Number(item.nilai)
    if (Number.isNaN(numericNilai)) continue

    // cek apakah sudah ada record sebelumnya
    const { data: existing, error: existingError } = await supabase
      .from('grades')
      .select('id')
      .eq('siswa_id', item.siswa_id)
      .eq('kelas_id', kelasId)
      .eq('mapel', mapel)
      .eq('tanggal', tanggal)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('check existing grade error:', existingError)
      continue
    }

    if (existing) {
      // update
      const { error: updateError } = await supabase
        .from('grades')
        .update({
          nilai: numericNilai,
          guru_id: guruId,
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('update grade error:', updateError)
      }
    } else {
      // insert baru
      const { error: insertError } = await supabase
        .from('grades')
        .insert({
          siswa_id: item.siswa_id,
          kelas_id: kelasId,
          guru_id: guruId,
          mapel,
          nilai: numericNilai,
          tanggal,
        })

      if (insertError) {
        console.error('insert grade error:', insertError)
      }
    }
  }
}
