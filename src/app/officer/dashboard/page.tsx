'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OfficerDashboard() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const fetchPending = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/officer/login')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/verification/review/pending?status=PENDING&page=${page}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setItems(data.items || [])
      setError('')
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const decide = async (id: number, decision: 'APPROVE' | 'REJECT') => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/officer/login')
      return
    }
    try {
      const res = await fetch(`/api/verification/review/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision }),
      })
      if (!res.ok) throw new Error('Decision failed')
      await fetchPending()
    } catch (e: any) {
      alert(e.message || 'Decision failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-oyoGreen">Verification Officer Dashboard</h1>
        <p className="mt-2 text-gray-600">Review pending pensioner verifications.</p>

        {error && <div className="mt-4 bg-red-50 text-red-700 p-3 rounded">{error}</div>}

        <div className="mt-6 bg-white rounded shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-semibold">Pending Reviews</div>
            <div className="text-sm text-gray-500">Page {page}</div>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-gray-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">No pending items.</div>
          ) : (
            <div className="divide-y">
              {items.map((it) => (
                <div key={it.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={it.capturedPhoto} alt="Captured" className="w-16 h-16 rounded object-cover border" />
                    <div>
                      <div className="font-medium">{it.pensioner?.fullName} <span className="text-xs text-gray-500">({it.pensioner?.pensionId})</span></div>
                      <div className="text-xs text-gray-600">Review ID: {it.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => decide(it.id, 'APPROVE')} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
                    <button onClick={() => decide(it.id, 'REJECT')} className="px-3 py-2 bg-red-600 text-white rounded">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-4 border-t flex items-center justify-between">
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} className="px-3 py-2 bg-gray-200 rounded">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}



