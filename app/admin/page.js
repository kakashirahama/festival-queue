'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [waitingList, setWaitingList] = useState([])

  // 待ち状態のチケット一覧を取得
  const fetchTickets = async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'waiting')
      .order('id', { ascending: true })
    if (data) setWaitingList(data)
  }

  useEffect(() => {
    fetchTickets()

    // 新しい発券や状態変更をリアルタイムでリストに反映
    const channel = supabase
      .channel('admin-listen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // 呼び出しボタンを押したときの処理
  const handleCall = async (id) => {
    await supabase.from('tickets').update({ status: 'called' }).eq('id', id)
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>受付・管理画面</h1>
      <h3>現在の待ち人数: {waitingList.length} 組</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {waitingList.map((item) => (
          <div key={item.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No. {item.id}</span>
            <button onClick={() => handleCall(item.id)} style={{ padding: '0.5rem 1rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              呼び出す
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
