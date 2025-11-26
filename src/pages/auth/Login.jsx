import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, User, BookOpen } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    loginMethod: 'email' // 'email' | 'nip' | 'nisn'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(
        formData.identifier,
        formData.password,
        formData.loginMethod
      )

      if (result.success) {
        if (result.needsOnboarding) {
          // langsung ke onboarding jika backend menandai perlu melengkapi profil
          navigate('/onboarding', { replace: true })
          toast.success('Login berhasil — lengkapi data terlebih dahulu.')
        } else {
          // ke root; App.jsx akan memutuskan redirect final berdasarkan role/profile
          navigate('/', { replace: true })
          toast.success('Login berhasil!')
        }
      } else {
        toast.error(result.error || 'Login gagal')
      }
    } catch (err) {
      console.error('Login submit error:', err)
      toast.error('Terjadi kesalahan saat proses login.')
    } finally {
      setIsLoading(false)
    }
  }

  const setLoginMethod = (method) => {
    setFormData(prev => ({
      ...prev,
      loginMethod: method,
      identifier: '' // reset field biar ga ke-mix antar metode
    }))
  }

  const loginLabel =
    formData.loginMethod === 'email'
      ? 'Email'
      : formData.loginMethod === 'nip'
      ? 'NIP'
      : 'NISN'

  const loginPlaceholder =
    formData.loginMethod === 'email'
      ? 'Masukkan email'
      : formData.loginMethod === 'nip'
      ? 'Masukkan NIP'
      : 'Masukkan NISN'

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistem Sekolah</h1>
          <p className="text-gray-600 mt-2">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Login Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Login
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={
                  'flex items-center justify-center space-x-1 py-2 px-2 rounded-lg border text-xs sm:text-sm ' +
                  (formData.loginMethod === 'email'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
                }
              >
                <Mail size={16} />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('nip')}
                className={
                  'flex items-center justify-center space-x-1 py-2 px-2 rounded-lg border text-xs sm:text-sm ' +
                  (formData.loginMethod === 'nip'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
                }
              >
                <User size={16} />
                <span>NIP</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('nisn')}
                className={
                  'flex items-center justify-center space-x-1 py-2 px-2 rounded-lg border text-xs sm:text-sm ' +
                  (formData.loginMethod === 'nisn'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
                }
              >
                <User size={16} />
                <span>NISN</span>
              </button>
            </div>
          </div>

          {/* Identifier Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {loginLabel}
            </label>
            <input
              type={formData.loginMethod === 'email' ? 'email' : 'text'}
              value={formData.identifier}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, identifier: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={loginPlaceholder}
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>

          <p className="text-center text-gray-600 mt-4 text-sm">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Daftar di sini
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default Login
