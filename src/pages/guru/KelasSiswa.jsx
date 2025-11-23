import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'

const KelasSiswa = () => {
  const { user } = useAuthStore()
  const [guru, setGuru] = useState(null)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedClass, setSelectedClass] = useState('all')

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 1. Ambil data guru berdasarkan user_id
        const { data: guruRow, error: guruError } = await supabase
          .from('gurus')
          .select('id, first_name, last_name')
          .eq('user_id', user.id)
          .single()

        if (guruError || !guruRow) {
          throw new Error('Data guru tidak ditemukan')
        }

        setGuru(guruRow)

        // 2. Ambil kelas di mana dia wali kelas
        const { data: waliClasses, error: waliError } = await supabase
          .from('classes')
          .select('id, nama, wali_guru_id')
          .eq('wali_guru_id', guruRow.id)

        if (waliError) {
          console.error('Wali kelas error:', waliError)
        }

        const waliKelasIds =
          (waliClasses || []).map((k) => k.id).filter(Boolean)

        // 3. Ambil kelas dari jadwal (guru mapel)
        const { data: jadwalData, error: jadwalError } = await supabase
          .from('jadwal')
          .select('kelas_id')
          .eq('guru_id', guruRow.id)

        if (jadwalError) {
          console.error('Jadwal guru error:', jadwalError)
        }

        const jadwalKelasIds = Array.from(
          new Set(
            (jadwalData || [])
              .map((j) => j.kelas_id)
              .filter(Boolean)
          )
        )

        // 4. Gabungkan semua kelas yang terkait guru ini
        const allKelasIds = Array.from(
          new Set([...waliKelasIds, ...jadwalKelasIds])
        )

        if (allKelasIds.length === 0) {
          setClasses([])
          setStudents([])
          return
        }

        // 5. Ambil data kelas
        const { data: kelasRows, error: kelasError } = await supabase
          .from('classes')
          .select('id, nama, wali_guru_id')
          .in('id', allKelasIds)

        if (kelasError) throw kelasError

        setClasses(kelasRows || [])

        // 6. Ambil semua siswa di kelas-kelas tersebut
        const { data: siswaRows, error: siswaError } = await supabase
          .from('siswas')
          .select('id, first_name, last_name, nisn, kelas_id')
          .in('kelas_id', allKelasIds)
          .order('first_name', { ascending: true })

        if (siswaError) throw siswaError

        setStudents(siswaRows || [])
      } catch (err) {
        console.error('Kelas & Siswa guru error:', err)
        setError(err.message || 'Gagal memuat data kelas & siswa.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const classMap = useMemo(() => {
    const map = new Map()
    classes.forEach((k) => {
      map.set(k.id, k.nama || `Kelas ${k.id?.slice(0, 4)}`)
    })
    return map
  }, [classes])

  const groupedByClass = useMemo(() => {
    const group = {}
    classes.forEach((k) => {
      group[k.id] = []
    })
    students.forEach((s) => {
      if (!s.kelas_id) return
      if (!group[s.kelas_id]) group[s.kelas_id] = []
      group[s.kelas_id].push(s)
    })
    return group
  }, [classes, students])

  const visibleClasses =
    selectedClass === 'all'
      ? classes
      : classes.filter((k) => k.id === selectedClass)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelas & Siswa</h1>
          <p className="text-gray-600 mt-1">
            Kelas di mana Anda menjadi wali kelas atau pengajar mapel
          </p>
          {guru && (
            <p className="text-xs text-gray-500 mt-1">
              Guru: {guru.first_name} {guru.last_name || ''}
            </p>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filter kelas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kelas
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Semua Kelas Terkait</option>
          {classes.map((k) => (
            <option key={k.id} value={k.id}>
              {classMap.get(k.id)}
            </option>
          ))}
        </select>
      </motion.div>

      {/* List kelas + siswa */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {visibleClasses.length === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada kelas yang terhubung dengan guru ini (sebagai wali kelas atau pengajar).
          </p>
        ) : (
          visibleClasses.map((k) => {
            const list = groupedByClass[k.id] || []
            return (
              <div
                key={k.id}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <h2 className="text-sm font-semibold text-gray-800 mb-2">
                  {classMap.get(k.id)} ({list.length} siswa)
                </h2>
                {list.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Belum ada siswa terdaftar di kelas ini.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs md:text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-3">Nama</th>
                          <th className="text-left py-2 px-3">NISN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((s) => (
                          <tr
                            key={s.id}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 px-3">
                              {s.first_name} {s.last_name || ''}
                            </td>
                            <td className="py-2 px-3">
                              {s.nisn || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}

export default KelasSiswa
