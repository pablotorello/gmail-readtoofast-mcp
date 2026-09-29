import { describe, expect, test } from "bun:test";
import { messagePage } from "../src/message-page";

describe("message body pages", () => {
	test("reassembles a long body without dropping its final links", async () => {
		const body = `${"a".repeat(64_000)} https://example.com/final?complete=1`;
		const first = await messagePage(body, 0, 50_000);
		const last = await messagePage(body, first.bodyPage.nextOffset ?? 0, 50_000);
		expect(first.body + last.body).toBe(body);
		expect(last.bodyPage.nextOffset).toBeNull();
		expect(last.bodyPage.sha256).toBe(first.bodyPage.sha256);
		expect(first.bodyPage.totalChars).toBe(body.length);
	});

	test("never splits a Unicode character at a page boundary", async () => {
		const body = `${"a".repeat(255)}\u{1f642}tail`;
		const first = await messagePage(body, 0, 256);
		expect(first.bodyPage.nextOffset).toBe(255);
		const last = await messagePage(body, 255, 256);
		expect(first.body + last.body).toBe(body);
		await expect(messagePage(body, 256, 256)).rejects.toThrow("Unicode");
	});

	test("rejects invalid ranges and keeps response sizes bounded", async () => {
		for (const offset of [-1, 1.5, 4]) {
			await expect(messagePage("abc", offset, 256)).rejects.toThrow("bodyOffset");
		}
		for (const limit of [0, 255, 50_001]) {
			await expect(messagePage("abc", 0, limit)).rejects.toThrow("bodyLimit");
		}
		expect((await messagePage("", 0, 256)).bodyPage.nextOffset).toBeNull();
	});
});
