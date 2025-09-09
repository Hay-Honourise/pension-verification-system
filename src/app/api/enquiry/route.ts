import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { sendMail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
	try {
		// Basic per-IP rate limiting: 5 requests per 5 minutes
		const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'unknown';
		const rl = rateLimit(`enquiry:${ip}`, 5, 5 * 60 * 1000);
		if (!rl.ok) {
			return NextResponse.json(
				{ success: false, error: 'Too many requests. Please try again later.' },
				{ status: 429 }
			);
		}

		let payload: any;
		try {
			payload = await req.json();
		} catch (e: any) {
			return NextResponse.json(
				{ success: false, error: 'Invalid JSON body' },
				{ status: 400 }
			);
		}

		const { fullName, email, phone, subject, message, hcaptchaToken } = payload as {
			fullName?: string;
			email?: string;
			phone?: string | null;
			subject?: string;
			message?: string;
			hcaptchaToken?: string;
		};

		if (!fullName || !email || !subject || !message) {
			return NextResponse.json(
				{ success: false, error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Optional hCaptcha verification if configured
		if (process.env.HCAPTCHA_SECRET) {
			if (!hcaptchaToken) {
				return NextResponse.json(
					{ success: false, error: 'Captcha required' },
					{ status: 400 }
				);
			}
			try {
				const verifyRes = await fetch('https://hcaptcha.com/siteverify', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						secret: process.env.HCAPTCHA_SECRET,
						response: hcaptchaToken,
						remoteip: ip,
					}).toString(),
				});
				const verifyJson = (await verifyRes.json()) as { success: boolean };
				if (!verifyJson.success) {
					return NextResponse.json(
						{ success: false, error: 'Captcha verification failed' },
						{ status: 400 }
					);
				}
			} catch {
				return NextResponse.json(
					{ success: false, error: 'Captcha verification failed' },
					{ status: 400 }
				);
			}
		}

		const trackingId = `ENQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

		await prisma.enquiry.create({
			data: { fullName, email, phone: phone || null, subject, message, trackingId },
		});

		// Send notification email if SMTP configured
		try {
			if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
				const to = process.env.MAIL_TO || 'pensionboard@oyostate.gov.ng';
				await sendMail({
					to,
					subject: `New Enquiry (${subject}) - ${trackingId}`,
					html: `
						<h2>New Enquiry</h2>
						<p><strong>Tracking ID:</strong> ${trackingId}</p>
						<p><strong>Full Name:</strong> ${fullName}</p>
						<p><strong>Email:</strong> ${email}</p>
						<p><strong>Phone:</strong> ${phone || 'N/A'}</p>
						<p><strong>Subject:</strong> ${subject}</p>
						<p><strong>Message:</strong></p>
						<p>${(message || '').replace(/\n/g, '<br/>')}</p>
					`,
				});
			}
		} catch (e) {
			// Do not fail request on email error; log and continue
			console.error('Failed to send enquiry email:', e);
		}

		return NextResponse.json({ success: true, trackingId, message: 'Enquiry submitted successfully' });
	} catch (err: any) {
		console.error('Enquiry submission failed:', err);
		return NextResponse.json(
			{ success: false, error: 'Failed to submit enquiry' },
			{ status: 500 }
		);
	}
}
