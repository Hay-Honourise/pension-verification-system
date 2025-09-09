"use client";

import { useEffect, useState } from 'react';

type Enquiry = {
	id: number;
	fullName: string;
	email: string;
	phone: string | null;
	subject: string;
	message: string;
	trackingId: string;
	createdAt: string;
};

export default function AdminEnquiriesPage() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [rows, setRows] = useState<Enquiry[]>([]);
	const [subject, setSubject] = useState<string>("");
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
				if (subject) params.set('subject', subject);
				const res = await fetch(`/api/enquiry/list?${params.toString()}`);
				const data = await res.json();
				if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to load');
				if (!active) return;
				setRows(data.rows);
				setTotal(data.total || 0);
			} catch (e: any) {
				if (!active) return;
				setError(e?.message || 'Failed to load');
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false };
	}, [page, pageSize, subject]);

	return (
		<div className="max-w-6xl mx-auto px-4 py-8">
			<h1 className="text-2xl font-semibold mb-4">Enquiries</h1>
			<div className="flex items-center gap-3 mb-4">
				<select value={subject} onChange={(e) => { setPage(1); setSubject(e.target.value) }} className="rounded border-gray-300">
					<option value="">All Subjects</option>
					<option value="Complaint">Complaint</option>
					<option value="Enquiry">Enquiry</option>
					<option value="Support">Support</option>
					<option value="Others">Others</option>
				</select>
			</div>
			{error && <p className="text-red-600 mb-4">{error}</p>}
			<div className="bg-white rounded shadow overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-4 py-2 text-left">Date</th>
							<th className="px-4 py-2 text-left">Tracking ID</th>
							<th className="px-4 py-2 text-left">Subject</th>
							<th className="px-4 py-2 text-left">Full Name</th>
							<th className="px-4 py-2 text-left">Email</th>
							<th className="px-4 py-2 text-left">Phone</th>
							<th className="px-4 py-2 text-left">Message</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.id} className="border-t">
								<td className="px-4 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
								<td className="px-4 py-2 whitespace-nowrap">{r.trackingId}</td>
								<td className="px-4 py-2 whitespace-nowrap">{r.subject}</td>
								<td className="px-4 py-2 whitespace-nowrap">{r.fullName}</td>
								<td className="px-4 py-2 whitespace-nowrap">{r.email}</td>
								<td className="px-4 py-2 whitespace-nowrap">{r.phone || '-'}</td>
								<td className="px-4 py-2 max-w-md">{r.message}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="flex items-center justify-between mt-4">
				<p className="text-sm text-gray-600">Total: {total}</p>
				<div className="flex items-center gap-2">
					<button className="px-3 py-1 rounded border" disabled={page===1} onClick={() => setPage((p) => Math.max(1, p-1))}>Prev</button>
					<span className="text-sm">Page {page}</span>
					<button className="px-3 py-1 rounded border" onClick={() => setPage((p) => p+1)} disabled={rows.length < pageSize}>Next</button>
				</div>
			</div>
		</div>
	);
}
