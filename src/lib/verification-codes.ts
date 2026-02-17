// In-memory store for email verification codes
// { email -> { code, expiresAt } }
const store = new Map<string, { code: string; expiresAt: number }>()

const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function storeCode(email: string, code: string) {
  store.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
  })
}

export function validateCode(email: string, code: string): boolean {
  const entry = store.get(email.toLowerCase())
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase())
    return false
  }
  if (entry.code !== code) return false
  store.delete(email.toLowerCase())
  return true
}
