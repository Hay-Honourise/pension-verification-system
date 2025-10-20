"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [token, setToken] = useState<string>('')
  const [pensionerId, setPensionerId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [files, setFiles] = useState<Array<{ id: string; fileType: string; fileUrl: string; originalName: string; createdAt: string }>>([])
  const [opId, setOpId] = useState<string | null>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    const t = localStorage.getItem('token') || ''
    if (!u || !t) {
      router.push('/admin/login')
      return
    }
    try {
      const parsed = JSON.parse(u)
      if (parsed?.role === 'ADMIN') {
        setAuthorized(true)
        setToken(t)
      } else {
        router.push('/admin/login')
      }
    } catch {
      router.push('/admin/login')
    }
  }, [router])

  const fetchFiles = async (pid: string) => {
    if (!pid) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/files/list?pensionerId=${encodeURIComponent(pid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load files')
      const data = await res.json()
      setFiles(data.files || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-oyoGreen">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage documents and staff accounts.</p>

        <div className="mt-6 bg-white rounded shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Enquiries</h2>
            <button onClick={()=>fetchFiles(pensionerId)} className="hidden" aria-hidden="true" />
          </div>
          <AdminEnquiries />
        </div>

        <div className="mt-6 bg-white rounded shadow p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Pensioner ID</label>
              <input value={pensionerId} onChange={(e)=>setPensionerId(e.target.value)} placeholder="Enter numeric pensioner id" className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange" />
            </div>
            <button onClick={()=>fetchFiles(pensionerId)} className="h-10 px-4 rounded bg-oyoGreen text-white">Load Files</button>
          </div>

          {error && <div className="mt-3 bg-red-50 text-red-700 p-2 rounded text-sm">{error}</div>}

          <div className="mt-4 border rounded">
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
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-sm text-gray-600">Loading…</td>
                    </tr>
                  ) : files.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-sm text-gray-600">No files.</td>
                    </tr>
                  ) : (
                    files.map((f) => (
                      <tr key={f.id}>
                        <td className="px-4 py-2 text-sm text-gray-900 break-all">{f.originalName}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{f.fileType}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{new Date(f.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-right space-x-2">
                          <button type="button" className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-800" onClick={()=>window.open(f.fileUrl, '_blank')}>
                            {f.fileType.startsWith('image') ? 'Preview' : 'Download'}
                          </button>
                          <button type="button" className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60" disabled={opId===f.id} onClick={()=>{ setReplaceTargetId(f.id); replaceInputRef.current?.click(); }}>
                            {opId===f.id && replaceTargetId===f.id ? 'Replacing…' : 'Replace'}
                          </button>
                          <button type="button" className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60" disabled={opId===f.id} onClick={async()=>{
                            if(!confirm('Delete this file?')) return;
                            try{
                              setOpId(f.id)
                              const res = await fetch('/api/files/delete',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ fileId: f.id }) })
                              if(!res.ok) throw new Error('Delete failed')
                              await fetchFiles(pensionerId)
                            }catch(e:any){
                              setError(e?.message||'Delete failed')
                            }finally{
                              setOpId(null)
                            }
                          }}>
                            {opId===f.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <input ref={replaceInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async(e)=>{
            const nf = e.target.files?.[0]
            const tid = replaceTargetId
            setReplaceTargetId(null)
            if(!nf || !tid) return
            try{
              setOpId(tid)
              const del = await fetch('/api/files/delete',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ fileId: tid }) })
              if(!del.ok) throw new Error('Failed to delete old file')
              const form = new FormData()
              form.append('pensionerId', pensionerId)
              const label = nf.type.startsWith('image') ? 'image' : nf.type === 'application/pdf' ? 'pdf' : 'file'
              form.append('fileType', label)
              form.append('file', nf)
              const up = await fetch('/api/files/upload',{ method:'POST', headers:{ Authorization:`Bearer ${token}` }, body: form })
              if(!up.ok) throw new Error('Upload failed')
              await fetchFiles(pensionerId)
            }catch(err:any){
              setError(err?.message||'Replace failed')
            }finally{
              setOpId(null)
              if(replaceInputRef.current) replaceInputRef.current.value=''
            }
          }} />
        </div>

        <div className="mt-6 bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Staff Management</h2>
          <p className="text-sm text-gray-600">Use the staff registration route to add admins or verification officers.</p>
        </div>
      </div>
    </div>
  )
}

function AdminEnquiries() {
  const [rows, setRows] = useState<Array<{ id: number; fullName: string; email: string; phone?: string; subject: string; message: string; createdAt: string }>>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`/api/enquiry/list?page=${page}&pageSize=${pageSize}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to load enquiries')
      setRows(data.rows || [])
      setTotal(data.total || 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to load enquiries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      {error && <div className="mb-3 bg-red-50 text-red-700 p-2 rounded text-sm">{error}</div>}
      <div className="border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-gray-600">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-gray-600">No enquiries.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{r.fullName}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.email}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.subject}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 max-w-md truncate" title={r.message}>{r.message}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 flex items-center justify-between border-t">
          <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
          <div className="text-xs text-gray-600">Page {page} of {totalPages}</div>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )
}



