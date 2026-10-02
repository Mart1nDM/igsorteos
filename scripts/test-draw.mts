import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { demoProvider } from "../src/lib/instagram/demo-provider";
import { buildCandidates } from "../src/lib/candidates";
import { buildEvidence, evaluateRules } from "../src/lib/rules";
import { commitSeed, generateSeed, pickWinners, verifySeed } from "../src/lib/draw";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const user = await prisma.user.findUnique({ where: { email: "demo@igsorteos.app" } });
const story = await prisma.mediaItem.findFirst({
  where: { userId: user!.id, igId: "story-1" },
});

console.log("Historia:", story!.igId);

const candidates = await buildCandidates(
  demoProvider,
  "demo-token",
  story!.igId,
  story!.kind,
);
console.log(`Candidatos unificados: ${candidates.length}`);

const rules = [
  { type: "QUESTION_STICKER" as const, enabled: true, amount: 1, expectedAnswer: "azul" },
  { type: "MENTIONS" as const, enabled: true, amount: 2, expectedAnswer: null },
];

const evaluated = candidates.map((c) => ({ c, r: evaluateRules(c, rules) }));
const valid = evaluated.filter((x) => x.r.valid);

console.log(`\nResultados (${evaluated.length} candidatos):`);
for (const { c, r } of evaluated) {
  const flags = Object.entries(r.checks)
    .map(([k, v]) => `${k.replace("QUESTION_STICKER", "sticker").replace("MENTIONS", "menciones")}=${v ? "si" : "no"}`)
    .join(" ");
  console.log(`  @${c.username.padEnd(16)} ${flags} -> ${r.valid ? "VALIDO" : "descartado"}`);
}
console.log(`\nValidos: ${valid.length}`);

const seed = generateSeed();
const commitment = commitSeed(seed);
const pool = valid.map((v) => ({ id: v.c.igUserId, username: v.c.username, fullName: v.c.fullName, avatarUrl: null }));
const winners = pickWinners(pool, seed, 2);

console.log(`Semilla: ${seed.slice(0, 20)}...`);
console.log(`Compromiso: ${commitment.slice(0, 20)}...`);
console.log(`Ganadores: ${winners.map((w) => "@" + w.username).join(", ")}`);
console.log(`Verificacion hash: ${verifySeed(seed, commitment) ? "OK" : "FALLA"}`);

// Determinismo: misma semilla -> mismos ganadores
const again = pickWinners(pool, seed, 2);
const same = JSON.stringify(again.map((w) => w.username)) === JSON.stringify(winners.map((w) => w.username));
console.log(`Determinismo: ${same ? "OK" : "FALLA"}`);

// Distribucion: la semilla cambia el ganador
let distintos = 0;
for (let i = 0; i < 200; i++) {
  if (pickWinners(pool, generateSeed(), 1)[0].username !== winners[0].username) distintos++;
}
console.log(`Variacion con 200 semillas distintas: ${distintos}/200`);

console.log(`Evidencia ejemplo: ${JSON.stringify(buildEvidence(valid[0].r.checks))}`);
