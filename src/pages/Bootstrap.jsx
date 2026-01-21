// pages/Bootstrap.jsx
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Bootstrap() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabase() // ✅ 여기서 생성

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login')
        return
      }

      // 1️⃣ profile 조회
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // 2️⃣ profile 없으면 생성 (재가입 방어)
      if (!profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          role: 'pending',
          onboarding: false,
        })

        navigate('/role-select')
        return
      }

      // 3️⃣ role 기준 분기
      if (profile.role === 'pending') {
        navigate('/role-select')
        return
      }

      if (profile.role === 'owner') {
        navigate('/owner')
        return
      }

      if (profile.role === 'barista') {
        navigate('/barista')
        return
      }

      // ❌ 알 수 없는 상태 (방어)
      navigate('/login')
    }

    run().finally(() => setLoading(false))
  }, [navigate])

  if (loading) return <div>로딩중...</div>

  return null
}
