const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
	const now = Date.now();
	const entry = requests.get(key);
	if (!entry || entry.resetAt < now) {
		requests.set(key, { count: 1, resetAt: now + windowMs });
		return { ok: true } as const;
	}
	entry.count += 1;
	if (entry.count > limit) {
		return { ok: false, retryAfterMs: entry.resetAt - now } as const;
	}
	return { ok: true } as const;
}


