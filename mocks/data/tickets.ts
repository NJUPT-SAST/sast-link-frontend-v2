export interface CodeEntry {
  email: string;
  code: string;
  registerTicket?: string;
}

export const codes = new Map<string, CodeEntry>();
export const loginCodes = new Map<string, number>([["mock-login-code", 1]]);
export const bindTickets = new Map<string, string>();

export function sendCode(email: string) {
  codes.set(email, { email, code: "123456" });
}

export function verifyCode(email: string, code: string) {
  const entry = codes.get(email);
  if (!entry || entry.code !== code) return null;
  entry.registerTicket = `reg-${email}`;
  return entry.registerTicket;
}

export function emailForTicket(ticket: string) {
  return [...codes.values()].find((entry) => entry.registerTicket === ticket)?.email;
}

export function resetTickets() {
  codes.clear();
  bindTickets.clear();
  loginCodes.clear();
  loginCodes.set("mock-login-code", 1);
}
