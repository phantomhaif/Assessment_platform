// In-memory store for password reset tokens
// { token -> { email, expiresAt } }
const store = new Map<string, { email: string; expiresAt: number }>()

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export function generateResetToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("")
}

export function storeResetToken(token: string, email: string) {
  // Remove any existing tokens for this email
  for (const [t, v] of store.entries()) {
    if (v.email === email.toLowerCase()) {
      store.delete(t)
    }
  }
  store.set(token, {
    email: email.toLowerCase(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  })
}

export function validateResetToken(token: string): string | null {
  const entry = store.get(token)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(token)
    return null
  }
  return entry.email
}

export function consumeResetToken(token: string): string | null {
  const email = validateResetToken(token)
  if (email) store.delete(token)
  return email
}
