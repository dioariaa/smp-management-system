import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Bell,
  TrendingUp
} from 'lucide-react'

const BottomNav = () => {
  const { role } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Definisi menu per-role
  const menuByRole = {
    admin: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { label: 'Guru', icon: Users, path: '/admin/guru' },
      { label: 'Siswa', icon: Users, path: '/admin/siswa' },
      { label: 'Kelas', icon: BookOpen, path: '/admin/kelas' },
      { label: 'Jadwal', icon: Calendar, path: '/admin/jadwal' },
      { label: 'Nilai', icon: FileText, path: '/admin/nilai' },
      { label: 'Info', icon: Bell, path: '/admin/pengumuman' },
    ],
    guru: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/guru' },
      { label: 'Kelas', icon: Users, path: '/guru/kelas' },
      { label: 'Nilai', icon: FileText, path: '/guru/nilai' },
      { label: 'Absensi', icon: Calendar, path: '/guru/absensi' },
      { label: 'Jadwal', icon: Calendar, path: '/guru/jadwal' },
      { label: 'Info', icon: Bell, path: '/guru/pengumuman' },
    ],
    siswa: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/siswa' },
      { label: 'Jadwal', icon: Calendar, path: '/siswa/jadwal' },
      { label: 'Nilai', icon: TrendingUp, path: '/siswa/nilai' },
      { label: 'Absensi', icon: Calendar, path: '/siswa/absensi' },
      { label: 'Info', icon: Bell, path: '/siswa/pengumuman' },
    ],
    ortu: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/ortu' },
      { label: 'Nilai', icon: TrendingUp, path: '/ortu/nilai' },
      { label: 'Absensi', icon: Calendar, path: '/ortu/absensi' },
      { label: 'Info', icon: Bell, path: '/ortu/pengumuman' },
    ],
  }

  const items = menuByRole[role] || []

  if (!items.length) return null

  return (
    <nav className="w-full max-w-full overflow-x-auto">
      <div className="flex justify-between px-2 py-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center flex-1 mx-1 py-1 rounded-lg text-[11px] ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500'
              }`}
            >
              <Icon
                size={18}
                className={isActive ? 'mb-0.5' : 'mb-0.5'}
              />
              <span className="leading-tight">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
