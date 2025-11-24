import React from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Calendar, Bell, TrendingUp } from 'lucide-react'
import StatCard from '../../components/StatCard'
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements'
import GradeChart from '../../components/GradeChart'
import { useAdminDashboard } from '../../hooks/useAdminDashboard'

const DashboardAdmin = () => {
  const { stats, activity } = useAdminDashboard()

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-2">Selamat datang di sistem manajemen sekolah</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <StatCard title="Total Siswa" value={stats.totalSiswa} icon={Users} color="blue" />
        <StatCard title="Total Guru" value={stats.totalGuru} icon={Users} color="green" />
        <StatCard title="Total Kelas" value={stats.totalKelas} icon={BookOpen} color="purple" />
        <StatCard title="Event Aktif" value={stats.activeEvents} icon={Calendar} color="orange" />
      </motion.div>

      {/* Charts + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-xl shadow-sm p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Jumlah Siswa per Kelas</h2>
            <TrendingUp className="text-gray-400" size={20} />
          </div>
          <GradeChart />
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow-sm p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Pengumuman Terbaru</h2>
            <Bell className="text-gray-400" size={20} />
          </div>
          <RealtimeAnnouncements />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        className="bg-white rounded-xl shadow-sm p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Riwayat Aktivitas</h2>

        <div className="space-y-4">
          {activity.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.description}</p>
                <p className="text-xs text-gray-500">{item.users?.email}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(item.created_at).toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default DashboardAdmin
