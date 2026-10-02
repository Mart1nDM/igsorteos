import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateSeed, commitSeed, pickWinners } from "../src/lib/draw";
import { buildEvidence } from "../src/lib/rules";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_USER = {
  email: "demo@igsorteos.app",
  igId: "17841400000000001",
  igUsername: "tu.marca",
  igAccessToken: "demo-token",
};

const PARTICIPANTS = [
  { igUserId: "u1", username: "lu.mendoza", fullName: "Lu Mendoza", answer: "azul", mentions: ["@a.uno", "@a.dos"], liked: true },
  { igUserId: "u2", username: "carla.design", fullName: "Carla Design", answer: "rojo", mentions: ["@b.uno"], liked: true },
  { igUserId: "u3", username: "tomasriv", fullName: "Tomas Riv", answer: "Azul", mentions: ["@c.uno", "@c.dos", "@c.tres"], liked: true },
  { igUserId: "u4", username: "maru.fit", fullName: "Maru Fit", answer: "verde", mentions: [], liked: true },
  { igUserId: "u5", username: "nico.arq", fullName: "Nico Arq", answer: "azul", mentions: ["@d.uno", "@d.dos"], liked: true },
  { igUserId: "u6", username: "sofia.re", fullName: "Sofia Re", answer: "negro", mentions: [], liked: false },
  { igUserId: "u7", username: "julieta.mp", fullName: "Julieta MP", answer: "AZUL", mentions: ["@e.uno", "@e.dos"], liked: true },
  { igUserId: "u8", username: "bauti.g", fullName: "Bauti G", answer: "amarillo", mentions: [], liked: true },
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { igId: DEMO_USER.igId, igUsername: DEMO_USER.igUsername, igAccessToken: DEMO_USER.igAccessToken },
    create: {
      email: DEMO_USER.email,
      name: "Tu Marca",
      image: null,
      igId: DEMO_USER.igId,
      igUsername: DEMO_USER.igUsername,
      igAccessToken: DEMO_USER.igAccessToken,
      igConnectedAt: new Date(),
    },
  });

  const stories = [
    { igId: "story-1", kind: "STORY" as const, caption: "Nuevo drop este viernes 🚀 Respondé con el color y sumá a un amigo etiquetado.", takenAt: new Date(), hasQuestionSticker: true },
    { igId: "story-2", kind: "STORY" as const, caption: "Reglamento simple: seguinos, comentá con tu usuario y etiquetá a 2 personas.", takenAt: new Date(Date.now() - 3600_000), hasQuestionSticker: true },
    { igId: "post-1", kind: "POST" as const, caption: "Nueva colección disponible en la web. Link en la bio 🔗", permalink: "https://instagram.com/p/demo-post-1", takenAt: new Date(Date.now() - 86400_000), hasQuestionSticker: false },
    { igId: "reel-1", kind: "REEL" as const, caption: "Pack en 15 segundos ⏱️", permalink: "https://instagram.com/reel/demo-reel-1", takenAt: new Date(Date.now() - 172800_000), hasQuestionSticker: false },
  ];

  const mediaIds: Record<string, string> = {};
  for (const story of stories) {
    const media = await prisma.mediaItem.upsert({
      where: { userId_igId: { userId: user.id, igId: story.igId } },
      update: {},
      create: {
        userId: user.id,
        igId: story.igId,
        kind: story.kind,
        caption: story.caption,
        permalink: story.permalink ?? null,
        takenAt: story.takenAt,
        hasQuestionSticker: story.hasQuestionSticker,
        expiresAt: story.kind === "STORY" ? new Date(Date.now() + 86400_000) : null,
      },
    });
    mediaIds[story.igId] = media.id;
  }

  await prisma.giveaway.deleteMany({ where: { userId: user.id } });

  const giveaway = await prisma.giveaway.create({
    data: {
      title: "Sorteo de la remera nueva",
      description: "Respondé el sticker de la historia con el color correcto, etiquetá a 2 amigos y reaccioná la historia.",
      status: "ACTIVE",
      winnersCount: 1,
      publicSlug: "sorteo-remera-nueva",
      userId: user.id,
      mediaId: mediaIds["story-1"],
      rules: {
        create: [
          { type: "QUESTION_STICKER", amount: 1, expectedAnswer: "azul" },
          { type: "MENTIONS", amount: 2 },
          { type: "LIKE", amount: 1 },
        ],
      },
    },
  });

  const valid = PARTICIPANTS.filter(
    (p) =>
      p.answer.toLowerCase() === "azul" &&
      p.mentions.length >= 2 &&
      p.liked,
  );

  await prisma.participant.createMany({
    data: valid.map((p) => ({
      giveawayId: giveaway.id,
      username: p.username,
      igUserId: p.igUserId,
      fullName: p.fullName,
      evidence: buildEvidence({
        QUESTION_STICKER: true,
        MENTIONS: true,
        LIKE: true,
      }),
    })),
  });

  const seed = generateSeed();
  const winners = pickWinners(
    valid.map((p) => ({
      id: p.igUserId,
      username: p.username,
      fullName: p.fullName,
      avatarUrl: null,
    })),
    seed,
    1,
  );

  const created = await prisma.participant.findMany({
    where: { giveawayId: giveaway.id },
  });
  const winnerRow = created.find((c) => c.username === winners[0].username)!;

  await prisma.winner.create({
    data: { giveawayId: giveaway.id, participantId: winnerRow.id, rank: 1 },
  });

  await prisma.giveaway.update({
    where: { id: giveaway.id },
    data: {
      status: "CLOSED",
      drawSeed: seed,
      seedCommitment: commitSeed(seed),
      participantsSnapshot: valid.length,
      drawnAt: new Date(),
    },
  });

  console.log(`Seed listo. Sorteo: /sorteos/sorteo-remera-nueva`);
  console.log(`Participantes válidos: ${valid.length}`);
  console.log(`Ganador: @${winners[0].username}`);
}

await main();
