import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const InputNilai = () => {
  const { user } = useAuthStore()

  const [guru, setGuru] = useState(null)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [jadwal, setJadwal] = useState([])

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedMapel, setSelectedMapel] = useState('')
  const [nilai, setNilai] = useState('')
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 1. Ambil data guru dari user_id
        const { data: guruRow, error: guruError } = await supabase
          .from('gurus')
          .select('id, first_name, last_name')
          .eq('user_id', user.id)
          .single()

        if (guruError || !guruRow) {
          throw new Error('Data guru tidak ditemukan')
        }

        setGuru(guruRow)

        // 2. Ambil jadwal mengajar guru ini
        const { data: jadwalData, error: jadwalError } = await supabase
          .from('jadwal')
          .select('id, kelas_id, mapel')
          .eq('guru_id', guruRow.id)

        if (jadwalError) {
          throw jadwalError
        }

        setJadwal(jadwalData || [])

        const kelasIds = Array.from(
          new Set(
            (jadwalData || [])
              .map((j) => j.kelas_id)
              .filter(Boolean)
          )
        )

        if (kelasIds.length === 0) {
          setClasses([])
          setStudents([])
          return
        }

        // 3. Ambil data kelas
        const { data: kelasRows, error: kelasError } = await supabase
          .from('classes')
          .select('id, nama')
          .in('id', kelasIds)

        if (kelasError) {
          throw kelasError
        }

        setClasses(kelasRows || [])

        // 4. Ambil siswa di kelas-kelas tersebut
        const { data: siswaRows, error: siswaError } = await supabase
          .from('siswas')
          .select('id, first_name, last_name, nisn, kelas_id')
          .in('kelas_id', kelasIds)
          .order('first_name', { ascending: true })

        if (siswaError) {
          throw siswaError
        }

        setStudents(siswaRows || [])
      } catch (err) {
        console.error('Input nilai guru error:', err)
        setError(err.message || 'Gagal memuat data awal.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  // Map kelas id -> nama
  const classMap = useMemo(() => {
    const map = new Map()
    classes.forEach((k) => {
      map.set(k.id, k.nama || `Kelas ${k.id?.slice(0, 4)}`)
    })
    return map
  }, [classes])

  // Siswa di kelas terpilih
  const studentsInClass = useMemo(() => {
    if (!selectedClass) return []
    return students.filter((s) => s.kelas_id === selectedClass)
  }, [students, selectedClass])

  // Mapel dropdown berdasarkan jadwal guru (dan kelas kalau dipilih)
  const mapelOptions = useMemo(() => {
    const set = new Set()
    jadwal.forEach((j) => {
      if (!j.mapel) return
      if (selectedClass && j.kelas_id !== selectedClass) return
      set.add(j.mapel)
    })
    return Array.from(set)
  }, [jadwal, selectedClass])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!guru || !selectedClass || !selectedStudent || !selectedMapel || !nilai) {
      toast.error('Lengkapi semua field terlebih dahulu.')
      return
    }

    const n = Number(nilai)
    if (Number.isNaN(n) || n < 0 || n > 100) {
      toast.error('Nilai harus antara 0 - 100.')
      return
    }

    try {
      setSaving(true)

      const { error: insertError } = await supabase.from('grades').insert({
        siswa_id: selectedStudent,
        kelas_id: selectedClass,
        guru_id: guru.id,
        mapel: selectedMapel,
        nilai: n,
        tanggal: tanggal,
      })

      if (insertError) {
        throw insertError
      }

      toast.success('Nilai berhasil disimpan.')
      setNilai('')
    } catch (err) {
      console.error('Simpan nilai error:', err)
      toast.error('Gagal menyimpan nilai.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Input Nilai</h1>
          <p className="text-gray-600 mt-1">
            Input nilai berdasarkan kelas, siswa, dan mata pelajaran yang Anda ampu.
          </p>
          {guru && (
            <p className="text-xs text-gray-500 mt-1">
              Guru: {guru.first_name} {guru.last_name || ''}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-4 space-y-4"
      >
        {/* Kelas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kelas
          </label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value)
              setSelectedStudent('')
              setSelectedMapel('')
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Pilih Kelas</option>
            {classes.map((k) => (
              <option key={k.id} value={k.id}>
                {classMap.get(k.id)}
              </option>
            ))}
          </select>
        </div>

        {/* Siswa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Siswa
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            disabled={!selectedClass}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option value="">
              {selectedClass ? 'Pilih Siswa' : 'Pilih kelas terlebih dahulu'}
            </option>
            {studentsInClass.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name || ''}{' '}
                {s.nisn ? `(${s.nisn})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Mapel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mata Pelajaran
          </label>
          <select
            value={selectedMapel}
            onChange={(e) => setSelectedMapel(e.target.value)}
            disabled={!selectedClass}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option value="">
              {selectedClass ? 'Pilih Mapel' : 'Pilih kelas terlebih dahulu'}
            </option>
            {mapelOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {!mapelOptions.length && selectedClass && (
            <p className="text-xs text-gray-500 mt-1">
              Belum ada jadwal untuk kelas ini / mapel belum diatur di jadwal.
            </p>
          )}
        </div>

        {/* Nilai & Tanggal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nilai
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="0 - 100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Nilai'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InputNilai
