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
