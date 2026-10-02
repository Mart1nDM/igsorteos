import { createHash, randomBytes } from "node:crypto";

export function generateSeed() {
  return randomBytes(32).toString("hex");
}

/**
 * Compromiso verificable: publicamos el hash de la semilla ANTES de sortear.
 * Cuando se revela la semilla, cualquiera puede recalcular el hash y confirmar
 * que no se cambió después de conocer los participantes.
 */
export function commitSeed(seed: string) {
  return createHash("sha256").update(seed).digest("hex");
}

export type DrawCandidate = {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
};

/**
 * Selección determinística y sin sesgo:
 * 1. Cada candidato genera su propio SHA-256(participante + snapshot + seed).
 * 2. Se ordena por hash ascendente.
 * 3. El índice winnerIndex se deriva del propio seed, así el resultado depende
 *    solamente del compromiso público.
 */
export function pickWinners(
  candidates: DrawCandidate[],
  seed: string,
  winnersCount: number,
) {
  const sorted = [...candidates].sort((a, b) =>
    candidateHash(a.id, seed).localeCompare(candidateHash(b.id, seed)),
  );

  const winnerIndex = Number.parseInt(
    createHash("sha256").update(`winner-index:${seed}`).digest("hex").slice(0, 8),
    16,
  );

  const count = Math.min(winnersCount, sorted.length);
  const start = winnerIndex % Math.max(sorted.length, 1);
  const winners: DrawCandidate[] = [];

  for (let i = 0; i < count; i++) {
    winners.push(sorted[(start + i) % sorted.length]);
  }

  return winners;
}

export function verifySeed(seed: string, commitment: string) {
  return commitSeed(seed) === commitment;
}

function candidateHash(candidateId: string, seed: string) {
  return createHash("sha256").update(`${candidateId}:${seed}`).digest("hex");
}
