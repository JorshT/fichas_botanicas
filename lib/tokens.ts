// Utilidades de tokens compartidas entre la app y los scripts de administración.
// No importa 'server-only' para poder usarse desde scripts/ con tsx.
import { createHash, randomBytes } from "node:crypto";

// 32 bytes aleatorios → 43 caracteres base64url. Imposible de adivinar.
export function generarToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenConFormatoValido(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
