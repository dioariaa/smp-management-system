import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, ClipboardList, User } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useGuruDashboard } from '../../hooks/useGuruDashboard'

const DashboardGuru = () => {
  const { guru, jadwal, absensi, loading } = useGuruDashboard()

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900">
          Selamat Datang, {guru?.first_name}
        </h1>
        <p className="text-gray-600 mt-1">Dashboard Guru</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <motion.div className="p-6 bg-white shadow rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <User size={18} className="text-blue-600" />
            <h2 className="font-semibold">Profil</h2>
          </div>
          <p><strong>NIP:</strong> {guru?.nip}</p>
          <p><strong>Status:</strong> {guru?.status}</p>
          <p><strong>Wali Kelas:</strong> {guru?.classes?.[0]?.nama || '-'}</p>
        </motion.div>

        <motion.div className="p-6 bg-white shadow rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Calendar size={18} className="text-green-600" />
            <h2 className="font-semibold">Jadwal Mengajar</h2>
          </div>
          {jadwal.length === 0 ? (
            <p className="text-gray-600 text-sm">Tidak ada jadwal.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {jadwal.map((j) => (
                <li key={j.id} className="border-b pb-2">
                  {j.hari} • {j.jam_mulai} - {j.jam_selesai} • {j.kelas?.nama}
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div className="p-6 bg-white shadow rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <ClipboardList size={18} className="text-orange-600" />
            <h2 className="font-semibold">Riwayat Absensi</h2>
          </div>
          {absensi.length === 0 ? (
            <p className="text-gray-600 text-sm">Belum ada data absensi.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {absensi.map((a) => (
                <li key={a.id}>
                  {a.tanggal} • {a.kelas?.nama} • {a.status}
                </li>
              ))}
            </ul>
          )}
        </motion.div>

      </div>
    </div>
  )
}

export default DashboardGuru