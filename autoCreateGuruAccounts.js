// autoCreateGuruAccounts.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in env.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function extractPassword(ttl) {
  if (!ttl) return null
  const m = ttl.match(/(\d{2})-(\d{2})-(\d{4})/)
  if (!m) return null
  return `${m[1]}${m[2]}${m[3]}` // ddmmyyyy
}

function fallbackEmail(nip) {
  return `${nip}@school.local`.toLowerCase()
}

async function findUserIdByEmail(email) {
  // coba cek public.users dulu
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (userRow && userRow.id) return userRow.id

  // kalau belum ada di users table, tidak bisa reliably find auth user via client SDK easily
  return null
}

async function main() {
  const { data: gurus, error } = await supabase
    .from('gurus')
    .select('id, nip, tempat_tgl_lahir, email, user_id')

  if (error) {
    console.error('Gagal ambil gurus:', error)
    process.exit(1)
  }

  for (const g of gurus) {
    try {
      if (g.user_id) {
        console.log(`SKIP ${g.nip} — sudah punya user_id (${g.user_id})`)
        continue
      }

      const email = (g.email || fallbackEmail(g.nip)).trim().toLowerCase()
      const password = extractPassword(g.tempat_tgl_lahir)

      if (!password) {
        console.log(`SKIP ${g.nip} — tidak bisa ekstrak password dari 'tempat_tgl_lahir': ${g.tempat_tgl_lahir}`)
        continue
      }

      console.log(`Mencoba buat akun: NIP=${g.nip} email=${email} pass=${password}`)

      // 1) coba signUp normal (akan gagal jika user sudah terdaftar)
      const { data: authData, error: signupErr } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signupErr) {
        const msg = (signupErr?.message || '').toLowerCase()
        console.warn(`signUp error for ${email}:`, signupErr.message || signupErr)

        // Kalau user sudah ada, coba mencari user id dari table users
        if (msg.includes('user already registered') || msg.includes('already registered') || signupErr?.status === 422) {
          console.log(`User sudah terdaftar di auth: cek table users untuk email ${email}`)
          const existingUserId = await findUserIdByEmail(email)
          if (existingUserId) {
            console.log(`Ditemukan users.id = ${existingUserId} -> linking ke gurus.id=${g.id}`)
            // update gurus.user_id & ensure users row exists
            await supabase
              .from('gurus')
              .update({ user_id: existingUserId, email })
              .eq('id', g.id)
            console.log(`✓ Linked ${g.nip} -> ${existingUserId}`)
            continue
          } else {
            console.log(`Tidak menemukan row di public.users untuk ${email}. Silakan cek pada Supabase Auth dashboard, atau buat user manual, lalu jalankan script lagi.`)
            continue
          }
        } else {
          console.log(`Gagal membuat akun untuk ${g.nip}:`, signupErr.message || signupErr)
          continue
        }
      }

      // Jika signup berhasil, authData.user ada
      const authUserId = authData?.user?.id
      if (!authUserId) {
        console.log(`signUp tidak mengembalikan user id untuk ${email} — skip`)
        continue
      }

      // 2) pastikan ada row di public.users
      const { data: insertedUser, error: insertUserErr } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email,
          role: 'guru',
          status: 'active',
        })
        .select()
        .maybeSingle()

      if (insertUserErr) {
        console.warn('insert into users error:', insertUserErr)
        // jangan crash — lanjut ke linking
      } else {
        console.log('row inserted into public.users:', insertedUser?.id || '(ok)')
      }

      // 3) update gurus
      const { error: linkErr } = await supabase
        .from('gurus')
        .update({ user_id: authUserId, email })
        .eq('id', g.id)

      if (linkErr) {
        console.error('Gagal link gurus -> users:', linkErr)
        continue
      }

      console.log(`✓ Berhasil membuat & link akun untuk NIP ${g.nip} (user_id=${authUserId})`)
    } catch (err) {
      console.error('Fatal error processing', g.nip, err)
    }
  }

  console.log('SELESAI')
  process.exit(0)
}

main()
