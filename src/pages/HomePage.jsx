// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const HeroCard = ({ img = '/img/logo.png', title, subtitle }) => (
  <div className="flex flex-col items-center justify-center h-[45vh]">
    <img
      src={img}
      alt="logo"
      className="w-28 h-28 rounded-full border-2 border-gray-200 object-cover mb-4"
    />
    <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">{title}</h1>
    <p className="text-sm md:text-base text-gray-500 mt-2 text-center max-w-xl">
      {subtitle}
    </p>
  </div>
)

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
)

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState('home') // home|profil|struktur|guru|fasilitas|galeri|kontak|login
  const [lightboxSrc, setLightboxSrc] = useState(null)

  useEffect(() => {
    // inject Inter font (only once)
    const id = 'google-font-inter'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'
      document.head.appendChild(link)
      document.documentElement.style.fontFamily = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
    }
  }, [])

  const go = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
    window.scrollTo(0, 0)
  }

  // simple content blocks (converted from your HTML)
  const pages = {
    home: (
      <section>
        <HeroCard
          img="data:image/png;base64,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"
          title="SMP PGRI 35 Serpong"
          subtitle="Sekolah unggulan modern & berkarakter."
        />

        <div className="text-center my-8">
          <h2 className="text-2xl font-bold mb-3">Sambutan Kepala Sekolah</h2>
          
          <p className="mx-auto max-w-3xl text-gray-600 leading-relaxed">
            “Selamat datang di website resmi <strong>SMP PGRI 35 Serpong</strong>. Website ini hadir
            sebagai sarana informasi dan komunikasi untuk mendukung kegiatan pendidikan.”
          </p>
        </div>
      </section>
    ),
    profil: (
      <section>
        <h1 className="text-3xl font-bold mb-6 text-center">Profil Sekolah</h1>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          

          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold mb-3">Identitas Sekolah</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="text-gray-400">Nama Sekolah:</span> SMP PGRI 35 Serpong</div>
                <div><span className="text-gray-400">NPSN:</span> -</div>
                <div><span className="text-gray-400">Status:</span> Swasta</div>
                <div><span className="text-gray-400">Akreditasi:</span> A</div>
                <div><span className="text-gray-400">Alamat:</span> Serpong, Tangerang Selatan</div>
                <div><span className="text-gray-400">Email:</span> official@smp35serpong.sch.id</div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-2">Sejarah Singkat</h3>
              <p className="text-gray-600">SMP PGRI 35 Serpong terus berkembang dalam mutu pendidikan dan karakter siswa.</p>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <h3 className="font-semibold">Visi</h3>
            <p className="text-gray-600"><em>“Terwujudnya peserta didik yang berprestasi, berkarakter dan berbudaya.”</em></p>
          </Card>
          <Card>
            <h3 className="font-semibold">Misi</h3>
            <ul className="text-gray-600 list-disc list-inside space-y-1">
              <li>Meningkatkan kualitas akademik.</li>
              <li>Menumbuhkan karakter disiplin.</li>
              <li>Mengembangkan kreativitas siswa.</li>
            </ul>
          </Card>
          
        </div>
      </section>
    ),
    struktur: (
      <section>
        <h1 className="text-3xl font-bold mb-6 text-center">Struktur Organisasi</h1>
        <div className="flex flex-col items-center gap-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border w-full md:w-96 text-center">
            <b>Kepala Sekolah</b>
          </div>

          <div className="w-full md:w-[720px] grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center bg-white p-4 rounded-xl shadow-sm border">Waka Kurikulum<br/><small className="text-gray-500">Putra Rizki NN</small></div>
            <div className="text-center bg-white p-4 rounded-xl shadow-sm border">Waka Kesiswaan<br/><small className="text-gray-500">M. Fahmi</small></div>
            <div className="text-center bg-white p-4 rounded-xl shadow-sm border">Waka Sarpras<br/><small className="text-gray-500">Nursoso</small></div>
            <div className="text-center bg-white p-4 rounded-xl shadow-sm border">Waka Humas<br/><small className="text-gray-500">Dra. Komariah</small></div>
          </div>
        </div>
      </section>
    ),
    guru: (
      <section>
        <h1 className="text-3xl font-bold mb-6 text-center">Daftar Guru</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <img src="/img/guru1.jpg" alt="guru1" className="w-24 h-24 mx-auto rounded-full object-cover mb-3" />
            <h3 className="font-semibold">Guru A</h3>
            <p className="text-gray-500">Matematika</p>
          </Card>
          <Card className="text-center">
            <img src="/img/guru2.jpg" alt="guru2" className="w-24 h-24 mx-auto rounded-full object-cover mb-3" />
            <h3 className="font-semibold">Guru B</h3>
            <p className="text-gray-500">Bahasa Indonesia</p>
          </Card>
          <Card className="text-center">
            <img src="/img/guru3.jpg" alt="guru3" className="w-24 h-24 mx-auto rounded-full object-cover mb-3" />
            <h3 className="font-semibold">Guru C</h3>
            <p className="text-gray-500">IPA</p>
          </Card>
        </div>
      </section>
    ),
    fasilitas: (
      <section>
        <h1 className="text-3xl font-bold mb-6 text-center">Fasilitas Sekolah</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>Ruang Kelas Modern</Card>
          <Card>Laboratorium Komputer</Card>
          <Card>Perpustakaan Digital</Card>
        </div>
      </section>
    ),
    galeri: (
      <section>
        <h1 className="text-3xl font-bold mb-6 text-center">Galeri Foto</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="overflow-hidden rounded-2xl">
            <img src="/img/galeri1.jpg" alt="g1" className="w-full h-48 object-cover rounded-2xl cursor-pointer" onClick={() => setLightboxSrc('/img/galeri1.jpg')} />
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img src="/img/galeri2.jpg" alt="g2" className="w-full h-48 object-cover rounded-2xl cursor-pointer" onClick={() => setLightboxSrc('/img/galeri2.jpg')} />
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img src="/img/galeri3.jpg" alt="g3" className="w-full h-48 object-cover rounded-2xl cursor-pointer" onClick={() => setLightboxSrc('/img/galeri3.jpg')} />
          </div>
        </div>
      </section>
    ),
    kontak: (
      <section>
        <h1 className="text-3xl font-bold mb-6 text-center">Kontak Sekolah</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <p><strong>Alamat:</strong> Serpong, Tangerang Selatan</p>
            <p className="mt-2"><strong>Email:</strong>     </p>
            <p className="mt-2"><strong>Telepon:</strong> 0812-3456-7890</p>
          </Card>
          <Card className="p-0">
            <iframe
              title="map"
              src="https://www.google.com/maps/embed?pb="
              className="w-full h-56 border-0"
              allowFullScreen
            />
          </Card>
        </div>
      </section>
    ),
    login: (
      <section>
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        <Card className="max-w-md mx-auto">
          <input className="w-full mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200" placeholder="Email / Username" />
          <input className="w-full mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200" type="password" placeholder="Password" />
          <select className="w-full mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <option>Admin</option>
            <option>Guru</option>
            <option>Siswa</option>
          </select>
          <button className="w-full py-3 rounded-lg bg-blue-600 text-white">Masuk</button>
        </Card>
      </section>
    ),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="data:image/png;base64,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" alt="logo" className="w-11 h-11 rounded-full object-cover" />
            <h2 className="text-lg font-semibold">SMP PGRI 35 Serpong</h2>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-4">
              <button onClick={() => go('home')} className={`text-sm ${activePage === 'home' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>Home</button>
              <button onClick={() => go('profil')} className={`text-sm ${activePage === 'profil' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>Profil</button>
              
            </nav>

            <div className="hidden md:block">
              <Link to="/login" className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg">Login</Link>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-xl"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label="toggle sidebar"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar (mobile) */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform`}>
        <div className="p-4">
          <div className="text-right mb-4">
            <button onClick={() => setSidebarOpen(false)} className="text-xl">✖</button>
          </div>

          <nav className="space-y-2">
            <button onClick={() => go('home')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50">Home</button>
            <button onClick={() => go('profil')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50">Profil</button>
            <button onClick={() => go('struktur')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50">Struktur</button>
            <button onClick={() => go('guru')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50">Guru</button>
            <button onClick={() => go('fasilitas')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50">Fasilitas</button>
            <button onClick={() => go('galeri')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50">Galeri</button>
            <button onClick={() => go('kontak')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50">Kontak</button>
            <Link to="/login" className="block px-3 py-2 rounded-md bg-blue-600 text-white text-center mt-3">Login</Link>
          </nav>
        </div>
      </aside>

      {/* PAGE CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-12">
        <div className="space-y-8">
          {pages[activePage]}
        </div>
      </main>

      {/* LIGHTBOX */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-60 bg-black bg-opacity-80 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="preview" className="max-w-full max-h-[90vh] rounded-xl" />
        </div>
      )}

      <footer className="text-center py-6 border-t border-gray-100 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 text-sm text-gray-500">© 2025 SMP PGRI 35 Serpong — Website Resmi</div>
      </footer>
    </div>
  )
}
