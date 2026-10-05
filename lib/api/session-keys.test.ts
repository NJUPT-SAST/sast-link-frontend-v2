import { sessionAccountKey } from "./session-keys";

// Encode as base64url (the JWT wire format: `-`/`_` alphabet, no padding) from
// raw UTF-8 bytes so payloads with non-Latin1 characters round-trip the same
// way a real backend token does.
function base64UrlEncode(value: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fakeJwt(payload: Record<string, unknown>): string {
  return `${base64UrlEncode({ alg: "EdDSA", typ: "JWT" })}.${base64UrlEncode(payload)}.sig`;
}

const SESSION = (token: string) => ({ accessToken: token, expiresAt: 0 });

describe("sessionAccountKey", () => {
  it("uses the JWT sub claim as the account fingerprint", () => {
    expect(sessionAccountKey(SESSION(fakeJwt({ sub: "42" })))).toBe("42");
  });

  it("stringifies a numeric sub", () => {
    expect(sessionAccountKey(SESSION(fakeJwt({ sub: 42 })))).toBe("42");
  });

  it("decodes base64url segments containing `-`/`_` and no padding", () => {
    // This sub forces `+` and `/` into the base64 encoding, i.e. `-` and `_`
    // in the base64url token — the characters the naive atob call mangles.
    const payload = { sub: "~~??~~??" };
    expect(sessionAccountKey(SESSION(fakeJwt(payload)))).toBe("~~??~~??");
  });

  it("decodes non-ASCII subs via UTF-8", () => {
    expect(sessionAccountKey(SESSION(fakeJwt({ sub: "张三" })))).toBe("张三");
  });

  it("falls back to the full token when the payload has no sub", () => {
    const token = fakeJwt({ name: "Alice" });
    expect(sessionAccountKey(SESSION(token))).toBe(token);
  });

  it("falls back to the full token for a non-JWT token", () => {
    expect(sessionAccountKey(SESSION("opaque-token"))).toBe("opaque-token");
    expect(sessionAccountKey(SESSION("not.a-jwt"))).toBe("not.a-jwt");
  });

  it("falls back to the full token when the payload is not JSON", () => {
    const token = `header.${btoa("not-json").replace(/=+$/, "")}.sig`;
    expect(sessionAccountKey(SESSION(token))).toBe(token);
  });

  it("falls back for an empty token", () => {
    expect(sessionAccountKey(SESSION(""))).toBe("");
  });
});
