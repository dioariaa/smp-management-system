// src/security/permissions.js

export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',

  // Manajemen data (khusus admin)
  MANAGE_GURU: 'manage_guru',
  MANAGE_SISWA: 'manage_siswa',
  MANAGE_KELAS: 'manage_kelas',
  MANAGE_JADWAL: 'manage_jadwal',

  // Nilai
  VIEW_GRADES: 'view_grades',
  EDIT_GRADES: 'edit_grades',

  // Absensi
  VIEW_ATTENDANCE: 'view_attendance',
  EDIT_ATTENDANCE: 'edit_attendance',

  // Jadwal
  VIEW_SCHEDULE: 'view_schedule',

  // Pengumuman
  VIEW_ANNOUNCEMENTS: 'view_announcements',
  EDIT_ANNOUNCEMENTS: 'edit_announcements',
}
