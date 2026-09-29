// Offsets use JavaScript's UTF-16 units. Hashes cover the complete UTF-8 body,
// so a client can detect missing pages or a changed message before marking it done.
export async function messagePage(body: string, offset: number, limit: number) {
	if (!Number.isSafeInteger(offset) || offset < 0 || offset > body.length) {
		throw new Error("bodyOffset is outside the message body");
	}
	if (!Number.isSafeInteger(limit) || limit < 256 || limit > 50_000) {
		throw new Error("bodyLimit must be between 256 and 50000");
	}
	const splitsPair = (at: number) =>
		body.charCodeAt(at - 1) >= 0xd800 &&
		body.charCodeAt(at - 1) <= 0xdbff &&
		body.charCodeAt(at) >= 0xdc00 &&
		body.charCodeAt(at) <= 0xdfff;
	if (splitsPair(offset)) throw new Error("bodyOffset splits a Unicode character");
	let end = Math.min(body.length, offset + limit);
	if (splitsPair(end)) end--;
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
	return {
		body: body.slice(offset, end),
		bodyPage: {
			offset,
			nextOffset: end < body.length ? end : null,
			totalChars: body.length,
			offsetUnit: "utf16",
			sha256: Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""),
		},
	};
}
