import { create } from 'zustand'
import { supabase } from '../supabase/supabaseClient'

// Helper: ambil profile berdasarkan role
const fetchProfileByRole = async (role, userId) => {
  if (!role || !userId) return null

  const tableMap = {
    admin: null,     // admin sengaja gak punya tabel profile khusus
    guru: 'gurus',
    siswa: 'siswas',
    ortu: 'ortu',
  }

  const table = tableMap[role]
  if (!table) {
    return null
  }

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

  // LOGIN (email / NIP / NISN)
  login: async (identifier, password, loginMethod) => {
    try {
      let email = identifier

      // Login pakai NIP (guru)
      if (loginMethod === 'nip') {
        const { data: guru, error } = await supabase
          .from('gurus')
          .select('email')
          .eq('nip', identifier)
          .single()

        if (error || !guru) {
          throw new Error('NIP tidak ditemukan atau belum terdaftar')
        }
        email = guru.email
      }

      // Login pakai NISN (siswa)
      else if (loginMethod === 'nisn') {
        const { data: siswa, error } = await supabase
          .from('siswas')
          .select('email')
          .eq('nisn', identifier)
          .single()

        if (error || !siswa) {
          throw new Error('NISN tidak ditemukan atau belum terdaftar')
        }
        email = siswa.email
      }

      // Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      if (!data.user) {
        throw new Error('Gagal login, akun tidak ditemukan')
      }

      // Ambil record user (role, status, dll)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError || !userData) {
        throw new Error('Data user tidak ditemukan')
      }

      // Ambil profile berdasarkan role
      const profileData = await fetchProfileByRole(userData.role, data.user.id)

      set({
        user: data.user,
        profile: profileData,
        role: userData.role,
      })

      // Log activity login
      await supabase.from('activity_logs').insert({
        user_id: data.user.id,
        action: 'login',
        description: `User logged in as ${userData.role}`,
      })

      return {
        success: true,
        needsOnboarding: profileData?.status === 'belum_lengkap',
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  },

  // REGISTER ORTU
  registerOrtu: async (formData) => {
    try {
      // Cek apakah siswa dengan NISN itu ada
      const { data: siswa, error: siswaError } = await supabase
        .from('siswas')
        .select('id')
        .eq('nisn', formData.nisnAnak)
        .single()

      if (siswaError || !siswa) {
        throw new Error('Siswa dengan NISN tersebut tidak ditemukan')
      }

      // Buat user auth di Supabase (password di-hash oleh Supabase)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError
      if (!authData.user) {
        throw new Error('Gagal membuat akun pengguna')
      }

      // Insert ke tabel users (tanpa password)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          role: 'ortu',
          status: 'active', // sesuaikan sama konvensi status lo
        })

      if (userError) throw userError

      // Insert ke tabel ortu (profile)
      const { error: ortuError } = await supabase
        .from('ortu')
        .insert({
          user_id: authData.user.id,
          siswa_id: siswa.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        })

      if (ortuError) throw ortuError

      return { success: true }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: error.message }
    }
  },

  // LOGOUT
  logout: async () => {
    const { user } = get()

    try {
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'logout',
          description: 'User logged out',
        })
      }

      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({
        user: null,
        profile: null,
        role: null,
        isLoading: false,
      })
    }
  },

  // CEK SESSION / AUTO LOGIN
  checkAuth: async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
      }

      // Tidak ada session → clear state
      if (!session?.user) {
        set({
          user: null,
          profile: null,
          role: null,
          isLoading: false,
        })
        return
      }

      // Ambil data user dari tabel users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError || !userData) {
        console.error('User data not found:', userError)
        set({
          user: null,
          profile: null,
          role: null,
          isLoading: false,
        })
        return
      }

      const profileData = await fetchProfileByRole(
        userData.role,
        session.user.id
      )

      set({
        user: session.user,
        profile: profileData,
        role: userData.role,
        isLoading: false,
      })
    } catch (error) {
      console.error('Auth check error:', error)
      set({
        user: null,
        profile: null,
        role: null,
        isLoading: false,
      })
    }
  },

  // ONBOARDING GURU / SISWA
  completeOnboarding: async (formData) => {
    const { role, user, profile } = get()

    try {
      if (!user || !role) {
        throw new Error('User tidak valid')
      }

      if (role === 'guru') {
        const { error } = await supabase
          .from('gurus')
          .update({
            ...formData,
            status: 'aktif',
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else if (role === 'siswa') {
        const { error } = await supabase
          .from('siswas')
          .update({
            ...formData,
            status: 'aktif',
          })
          .eq('user_id', user.id)

        if (error) throw error
      }

      // Update status user global
      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id)

      set({
        profile: {
          ...(profile || {}),
          ...formData,
          status: 'aktif',
        },
      })

      return { success: true }
    } catch (error) {
      console.error('Onboarding error:', error)
      return { success: false, error: error.message }
    }
  },
}))
