'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function UserPage() {
  const [ticket, setTicket] = useState(null)
  const [aheadCount, setAheadCount] = useState(0)

  // 整理券の発行
  const issueTicket = async () => {
    const { data } = await supabase.from('tickets').insert([{ status: 'waiting' }]).select().single()
    if (data) setTicket(data)
  }

  // 状態の監視と「あと何組」の計算
  useEffect(() => {
    if (!ticket) return

    const updateStatus = async () => {
      // 自分の状態（呼び出されたか）を確認
      const { data: current } = await supabase.from('tickets').select('status').eq('id', ticket.id).single()
      if (current) setTicket(prev => ({ ...prev, status: current.status }))

      // 自分より前に並んでいる人数（待ち状態の件数）を取得
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting')
        .lt('id', ticket.id)

      setAheadCount(count || 0)
    }

    updateStatus()

    // データベースに変更があったら画面を更新
    const channel = supabase
      .channel('user-listen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, updateStatus)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ticket])

  return (
    <main style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      {!ticket ? (
        <button onClick={issueTicket} style={{ padding: '1rem 2rem', fontSize: '1.2rem', cursor: 'pointer' }}>
          整理券を発行する
        </button>
      ) : (
        <div>
          <h2>整理券番号: No. {ticket.id}</h2>
          {ticket.status === 'called' ? (
            <div style={{ background: '#ff4d4f', color: '#fff', padding: '2rem', borderRadius: '12px', fontSize: '1.5rem', fontWeight: 'bold' }}>
              🔔 お呼び出し中！<br />スタッフのところへお越しください！
            </div>
          ) : (
            <div style={{ background: '#f0f0f0', padding: '2rem', borderRadius: '12px' }}>
              <p style={{ fontSize: '1.5rem' }}>お呼び出しまで あと <strong>{aheadCount}</strong> 組</p>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>※この画面を開いたままお待ちください</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
