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

  // Files modal state
  const [filesOpen, setFilesOpen] = useState(false)
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState<string>('')
  const [pensionerFiles, setPensionerFiles] = useState<Array<{ id: string; fileType: string; fileUrl: string; originalName: string; createdAt: string }>>([])
  const [currentPensioner, setCurrentPensioner] = useState<{ id: number; fullName?: string; pensionId?: string } | null>(null)

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

  const openFilesModal = async (pensioner: { id: number; fullName?: string; pensionId?: string }) => {
    setCurrentPensioner(pensioner)
    setFilesOpen(true)
    setFilesLoading(true)
    setFilesError('')
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`/api/files/list?pensionerId=${pensioner.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load files')
      const data = await res.json()
      setPensionerFiles(data.files || [])
    } catch (e: any) {
      setFilesError(e?.message || 'Failed to load files')
    } finally {
      setFilesLoading(false)
    }
  }

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

  return (<>
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
                    <button onClick={() => openFilesModal({ id: it.pensioner?.id, fullName: it.pensioner?.fullName, pensionId: it.pensioner?.pensionId })} className="px-3 py-2 bg-blue-600 text-white rounded">View Documents</button>
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

    {/* Files Modal */}
    {filesOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold">Pensioner Documents</div>
              {currentPensioner && (
                <div className="text-xs text-gray-600 mt-0.5">{currentPensioner.fullName} <span className="text-gray-400">({currentPensioner.pensionId})</span></div>
              )}
            </div>
            <button onClick={() => setFilesOpen(false)} className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">Close</button>
          </div>
          <div className="p-6">
            {filesError && <div className="mb-3 bg-red-50 text-red-700 p-2 rounded text-sm">{filesError}</div>}
            <div className="border rounded">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filesLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-sm text-gray-600">Loading…</td>
                      </tr>
                    ) : pensionerFiles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-sm text-gray-600">No files available.</td>
                      </tr>
                    ) : (
                      pensionerFiles.map((f) => (
                        <tr key={f.id}>
                          <td className="px-4 py-2 text-sm text-gray-900 break-all">{f.originalName}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{f.fileType}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{new Date(f.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right">
                            <button
                              type="button"
                              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
                              onClick={() => window.open(f.fileUrl, '_blank')}
                            >
                              {f.fileType.startsWith('image') ? 'Preview' : 'Download'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>)
}



