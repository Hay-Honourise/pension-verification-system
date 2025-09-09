"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const subjects = ["Complaint", "Enquiry", "Support", "Others"] as const;

type Subject = typeof subjects[number];

type FormState = {
	fullName: string;
	email: string;
	phone: string;
	subject: Subject;
	message: string;
};

export default function ContactPage() {
	const [form, setForm] = useState<FormState>({
		fullName: "",
		email: "",
		phone: "",
		subject: "Enquiry",
		message: "",
	});
	const [loading, setLoading] = useState(false);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setSuccessMsg(null);
		setErrorMsg(null);
		try {
			if (!form.fullName || !form.email || !form.subject || !form.message) {
				setErrorMsg("Please fill in all required fields.");
				return;
			}

			const res = await fetch("/api/enquiry", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fullName: form.fullName,
					email: form.email,
					phone: form.phone || null,
					subject: form.subject,
					message: form.message,
				}),
			});
			const data = await res.json();
			if (!res.ok || !data?.success) {
				throw new Error(data?.error || "Failed to submit enquiry");
			}
			setSuccessMsg(`Your enquiry has been submitted successfully. Tracking ID: ${data.trackingId}`);
			setForm({ fullName: "", email: "", phone: "", subject: "Enquiry", message: "" });
		} catch (err: any) {
			setErrorMsg(err?.message || "Failed to submit enquiry");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-white">
			<section className="bg-gradient-to-r from-green-600 to-orange-500 text-white py-16">
				<div className="max-w-6xl mx-auto px-4">
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="text-3xl md:text-5xl font-bold"
					>
						Contact Us
					</motion.h1>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.15 }}
						className="mt-4 max-w-3xl text-white/90"
					>
						We’re here to assist you. Reach out to the Oyo State Pensions Board for inquiries, complaints, or support.
					</motion.p>
				</div>
			</section>

			<section className="max-w-6xl mx-auto px-4 py-12">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-10">
					{/* Contact Info */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="space-y-6"
					>
						<h2 className="text-2xl font-semibold text-gray-900">Contact Information</h2>
						<ul className="space-y-4 text-gray-700">
							<li className="flex items-start gap-3">
								<span aria-hidden className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">📍</span>
								<div>
									<p className="font-medium">Address</p>
									<p>Oyo State Pensions Board Secretariat, Agodi, Ibadan, Oyo State, Nigeria</p>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<span aria-hidden className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">✉️</span>
								<div>
									<p className="font-medium">Email</p>
									<p>pensionboard@oyostate.gov.ng</p>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<span aria-hidden className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">📞</span>
								<div>
									<p className="font-medium">Phone</p>
									<p>+234 802 xxx xxxx, +234 701 xxx xxxx</p>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<span aria-hidden className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">⏰</span>
								<div>
									<p className="font-medium">Office Hours</p>
									<p>Mon–Fri, 8:00am – 4:00pm</p>
								</div>
							</li>
						</ul>
					</motion.div>

					{/* Enquiry Form */}
					<motion.form
						initial={{ opacity: 0, x: 20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						onSubmit={handleSubmit}
						className="bg-white rounded-lg shadow p-6 space-y-4 border border-gray-100"
					>
						<div>
							<label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
							<input
								id="fullName"
								name="fullName"
								type="text"
								required
								value={form.fullName}
								onChange={(e) => setForm({ ...form, fullName: e.target.value })}
								className="mt-1 w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600"
							/>
						</div>
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								value={form.email}
								onChange={(e) => setForm({ ...form, email: e.target.value })}
								className="mt-1 w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600"
							/>
						</div>
						<div>
							<label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number (optional)</label>
							<input
								id="phone"
								name="phone"
								type="tel"
								value={form.phone}
								onChange={(e) => setForm({ ...form, phone: e.target.value })}
								className="mt-1 w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600"
							/>
						</div>
						<div>
							<label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
							<select
								id="subject"
								name="subject"
								required
								value={form.subject}
								onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })}
								className="mt-1 w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600"
								aria-label="Select enquiry subject"
							>
								{subjects.map((s) => (
									<option key={s} value={s}>{s}</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
							<textarea
								id="message"
								name="message"
								required
								rows={6}
								value={form.message}
								onChange={(e) => setForm({ ...form, message: e.target.value })}
								className="mt-1 w-full rounded-md border-gray-300 focus:border-green-600 focus:ring-green-600"
							/>
						</div>
						<div className="flex items-center gap-3">
							<button
								type="submit"
								className="inline-flex items-center justify-center rounded-md bg-green-600 px-5 py-2.5 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-70"
								aria-label="Submit enquiry"
								disabled={loading}
							>
								{loading && (
									<svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden>
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
									</svg>
								)}
								Submit
							</button>
							{successMsg && <p className="text-sm text-green-700">{successMsg}</p>}
							{errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
						</div>
					</motion.form>
				</div>

				{/* Google Map */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="mt-12"
				>
					<div className="aspect-video w-full overflow-hidden rounded-lg shadow">
						<iframe
							title="Oyo State Pensions Board Secretariat Location"
							src="https://www.google.com/maps?q=Oyo%20State%20Pensions%20Board%20Secretariat%2C%20Agodi%2C%20Ibadan&output=embed"
							width="100%"
							height="100%"
							style={{ border: 0 }}
							allowFullScreen
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
						></iframe>
					</div>
				</motion.div>
			</section>
		</div>
	);
}
