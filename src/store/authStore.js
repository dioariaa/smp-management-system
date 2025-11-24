// src/store/authStore.js
import { create } from 'zustand'
import { supabase } from '../supabase/supabaseClient'

// Helper untuk ambil profil sesuai role
const fetchProfileByRole = async (role, userId) => {
  if (!role || !userId) return null

  const tableMap = {
    guru: 'gurus',
    siswa: 'siswas',
    ortu: 'ortu',
  }

  const table = tableMap[role]
  if (!table) return null

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    throw error
  }

  return data
}

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  role: null,
  isLoading: true,

  // =========================================
  // LOGIN (email / NIP / NISN)
  // =========================================
  login: async (identifier, password, loginMethod = 'email') => {
    try {
      let email = identifier?.trim()

      if (!identifier || !password) {
        throw new Error('Identifier dan password wajib diisi')
      }

      // Map loginMethod -> email
      if (loginMethod === 'nip') {
        const { data: guru, error } = await supabase
          .from('gurus')
          .select('email')
          .eq('nip', identifier)
          .single()

        if (error || !guru || !guru.email) {
          throw new Error('NIP tidak ditemukan atau belum terhubung dengan akun')
        }
        email = guru.email
      } else if (loginMethod === 'nisn') {
        const { data: siswa, error } = await supabase
          .from('siswas')
          .select('email')
          .eq('nisn', identifier)
          .single()

        if (error || !siswa || !siswa.email) {
          throw new Error('NISN tidak ditemukan atau belum terhubung dengan akun')
        }
        email = siswa.email
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      if (!data.user) {
        throw new Error('Gagal login, akun tidak ditemukan')
      }

      // Ambil data user (role, status, dll)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError || !userData) {
        throw new Error('Data user tidak ditemukan')
      }

      // Ambil profil sesuai role
      const profileData = await fetchProfileByRole(userData.role, data.user.id)

      set({
        user: data.user,
        profile: profileData,
        role: userData.role
      })

      // Log aktivitas login
      await supabase.from('activity_logs').insert({
        user_id: data.user.id,
        action: 'login',
        description: `User logged in as ${userData.role}`
      })

      return {
        success: true,
        needsOnboarding: profileData?.status === 'belum_lengkap'
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  },

  // =========================================
  // REGISTER GURU (pakai NIP)
  // =========================================
  registerGuru: async ({ nip, email, password }) => {
    try {
      if (!nip || !email || !password) {
        throw new Error('NIP, email, dan password wajib diisi')
      }

      // Pastikan guru sudah diinput admin dan belum punya akun
      const { data: guru, error: guruError } = await supabase
        .from('gurus')
        .select('id, user_id')
        .eq('nip', nip)
        .single()

      if (guruError || !guru) {
        throw new Error('Guru dengan NIP tersebut tidak ditemukan. Minta admin untuk mendaftarkan data guru dulu.')
      }

      if (guru.user_id) {
        throw new Error('Akun untuk NIP ini sudah pernah dibuat.')
      }

      // Buat akun auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) throw authError
      if (!authData.user) {
        throw new Error('Gagal membuat akun pengguna.')
      }

      const authUserId = authData.user.id

      // Insert ke tabel users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email,
          role: 'guru',
          status: 'active'
        })

      if (userError) throw userError

      // Update tabel gurus: hubungkan user_id + sync email
      const { error: linkError } = await supabase
        .from('gurus')
        .update({
          user_id: authUserId,
          email
        })
        .eq('id', guru.id)

      if (linkError) throw linkError

      return { success: true }
    } catch (error) {
      console.error('Register guru error:', error)
      return { success: false, error: error.message }
    }
  },

  // =========================================
  // REGISTER SISWA (pakai NISN)
  // =========================================
  registerSiswa: async ({ nisn, email, password }) => {
    try {
      if (!nisn || !email || !password) {
        throw new Error('NISN, email, dan password wajib diisi')
      }

      // Pastikan siswa sudah diinput admin dan belum punya akun
      const { data: siswa, error: siswaError } = await supabase
        .from('siswas')
        .select('id, user_id')
        .eq('nisn', nisn)
        .single()

      if (siswaError || !siswa) {
        throw new Error('Siswa dengan NISN tersebut tidak ditemukan. Minta admin untuk mendaftarkan data siswa dulu.')
      }

      if (siswa.user_id) {
        throw new Error('Akun untuk NISN ini sudah pernah dibuat.')
      }

      // Buat akun auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) throw authError
      if (!authData.user) {
        throw new Error('Gagal membuat akun pengguna.')
      }

      const authUserId = authData.user.id

      // Insert ke tabel users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email,
          role: 'siswa',
          status: 'active'
        })

      if (userError) throw userError

      // Update tabel siswas: hubungkan user_id + sync email
      const { error: linkError } = await supabase
        .from('siswas')
        .update({
          user_id: authUserId,
          email
        })
        .eq('id', siswa.id)

      if (linkError) throw linkError

      return { success: true }
    } catch (error) {
      console.error('Register siswa error:', error)
      return { success: false, error: error.message }
    }
  },

  // =========================================
  // REGISTER ORTU (flow lama, pakai NISN anak)
  // =========================================
  registerOrtu: async (formData) => {
    try {
      // Check if siswa exists with provided NISN
      const { data: siswa, error: siswaError } = await supabase
        .from('siswas')
        .select('id')
        .eq('nisn', formData.nisnAnak)
        .single()

      if (siswaError || !siswa) {
        throw new Error('Siswa dengan NISN tersebut tidak ditemukan')
      }

      // Create auth user (Supabase akan hash password sendiri)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError
      if (!authData.user) {
        throw new Error('Gagal membuat akun pengguna')
      }

      // Create user record TANPA menyimpan password
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          role: 'ortu',
          status: 'active'
        })

      if (userError) throw userError

      // Create ortu profile
      const { error: ortuError } = await supabase
        .from('ortu')
        .insert({
          user_id: authData.user.id,
          siswa_id: siswa.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        })

      if (ortuError) throw ortuError

      return { success: true }
    } catch (error) {
      console.error('Register ortu error:', error)
      return { success: false, error: error.message }
    }
  },

  // =========================================
  // LOGOUT
  // =========================================
  logout: async () => {
    const { user } = get()
    try {
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'logout',
          description: 'User logged out'
        })
      }
    } catch (e) {
      console.error('Log logout error:', e)
    }

    await supabase.auth.signOut()
    set({ user: null, profile: null, role: null })
  },

  // =========================================
  // CHECK AUTH (dipakai App.jsx)
  // =========================================
  checkAuth: async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
      }

      if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError || !userData) {
          console.error('User data not found:', userError)
          set({ isLoading: false })
          return
        }

        const profileData = await fetchProfileByRole(userData.role, session.user.id)

        set({
          user: session.user,
          profile: profileData,
          role: userData.role
        })
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // =========================================
  // COMPLETE ONBOARDING (guru & siswa)
  // =========================================
  completeOnboarding: async (formData) => {
    const { role, user } = get()
    try {
      if (role === 'guru') {
        const { error } = await supabase
          .from('gurus')
          .update({
            ...formData,
            status: 'aktif'
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else if (role === 'siswa') {
        const { error } = await supabase
          .from('siswas')
          .update({
            ...formData,
            status: 'aktif'
          })
          .eq('user_id', user.id)

        if (error) throw error
      }

      // Update user status
      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id)

      set({ profile: { ...get().profile, ...formData, status: 'aktif' } })
      return { success: true }
    } catch (error) {
      console.error('Onboarding error:', error)
      return { success: false, error: error.message }
    }
  }
}))
