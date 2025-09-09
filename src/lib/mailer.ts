import nodemailer from 'nodemailer';

type MailOptions = {
	to: string;
	subject: string;
	html: string;
};

export function createTransport() {
	const host = process.env.SMTP_HOST;
	const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;

	if (!host || !user || !pass) {
		throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS');
	}

	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass },
	});
}

export async function sendMail(options: MailOptions) {
	const from = process.env.MAIL_FROM || options.to;
	const transporter = createTransport();
	await transporter.sendMail({
		from,
		to: options.to,
		subject: options.subject,
		html: options.html,
	});
}


