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
    
      {!ticket ? (
        
          整理券を発行する
        
      ) : (
