"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncAccount } from "@/lib/media";
import { buildEvidence, evaluateRules } from "@/lib/rules";
import {
  commitSeed,
  generateSeed,
  pickWinners,
  verifySeed,
} from "@/lib/draw";
import { getInstagramProvider } from "@/lib/instagram";
import type { EngagementCandidate } from "@/lib/rules";
import { buildCandidates } from "@/lib/candidates";
import { slugify } from "@/lib/slug";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function syncInstagramAction() {
  const userId = await requireUser();
  await syncAccount(userId);
  revalidatePath("/dashboard");
}

export async function createGiveawayAction(formData: FormData) {
  const userId = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const mediaId = String(formData.get("mediaId") ?? "");
  const winnersCount = Math.max(1, Number(formData.get("winnersCount") ?? 1));
  const slug = slugify(title);

  if (!title) {
    throw new Error("El título es obligatorio");
  }

  const rawRules = formData.getAll("rules");
  const rules = (Array.isArray(rawRules) ? rawRules : [rawRules])
    .map((value) => String(value))
    .filter(Boolean)
    .map((type) => ({
      type: type as never,
      enabled: true,
      amount: Number(formData.get(`amount-${type}`) ?? 1),
      expectedAnswer: String(formData.get(`answer-${type}`) ?? "") || null,
    }));

  if (rules.length === 0) {
    throw new Error("Elegí al menos una regla");
  }

  const media = mediaId
    ? await prisma.mediaItem.findFirst({ where: { id: mediaId, userId } })
    : null;

  const giveaway = await prisma.giveaway.create({
    data: {
      title,
      description: description || null,
      status: "ACTIVE",
      winnersCount,
      publicSlug: `${slug}-${Date.now().toString(36)}`,
      userId,
      mediaId: media?.id ?? null,
      rules: { create: rules },
    },
  });

  redirect(`/sorteos/${giveaway.publicSlug}`);
}

export async function toggleGiveawayStatusAction(formData: FormData) {
  const userId = await requireUser();
  const slug = String(formData.get("slug"));
  const nextStatus = String(formData.get("status"));

  await prisma.giveaway.updateMany({
    where: { publicSlug: slug, userId },
    data: { status: nextStatus as never },
  });

  revalidatePath(`/sorteos/${slug}`);
}

export async function drawAction(formData: FormData) {
  const userId = await requireUser();
  const slug = String(formData.get("slug"));

  const giveaway = await prisma.giveaway.findFirst({
    where: { publicSlug: slug, userId },
    include: { rules: true, media: true, user: true },
  });

  if (!giveaway) throw new Error("Sorteo no encontrado");
  if (!giveaway.media) throw new Error("El sorteo no tiene publicación o historia asociada");

  const user = giveaway.user;
  if (!user.igAccessToken || !user.igId) {
    throw new Error("La cuenta no está conectada a Instagram");
  }

  const provider = await getInstagramProvider();
  const candidates: EngagementCandidate[] = await buildCandidates(
    provider,
    user.igAccessToken,
    giveaway.media.igId,
    giveaway.media.kind,
  );

  const rules = giveaway.rules.map((rule) => ({
    type: rule.type,
    enabled: rule.enabled,
    amount: rule.amount,
    expectedAnswer: rule.expectedAnswer,
  }));

  const evaluated = candidates.map((candidate) => ({
    candidate,
    result: evaluateRules(candidate, rules),
  }));

  const valid = evaluated.filter((item) => item.result.valid);

  if (valid.length === 0) {
    throw new Error("Ningún participante cumple todas las reglas");
  }

  const seed = giveaway.drawSeed ?? generateSeed();
  const commitment = giveaway.seedCommitment ?? commitSeed(seed);
  const snapshot = valid.length;

  const pool = valid.map((item) => ({
    id: item.candidate.igUserId,
    username: item.candidate.username,
    fullName: item.candidate.fullName,
    avatarUrl: item.candidate.avatarUrl,
  }));

  const winners = pickWinners(pool, seed, giveaway.winnersCount);

  await prisma.$transaction(async (tx) => {
    await tx.participant.deleteMany({ where: { giveawayId: giveaway.id } });
    await tx.winner.deleteMany({ where: { giveawayId: giveaway.id } });

    await tx.participant.createMany({
      data: valid.map((item) => ({
        giveawayId: giveaway.id,
        username: item.candidate.username,
        igUserId: item.candidate.igUserId,
        fullName: item.candidate.fullName,
        avatarUrl: item.candidate.avatarUrl,
        evidence: buildEvidence(item.result.checks),
      })),
    });

    const created = await tx.participant.findMany({
      where: { giveawayId: giveaway.id },
    });
    const byUsername = new Map(created.map((p) => [p.username, p]));

    await tx.winner.createMany({
      data: winners.flatMap((winner, index) => {
        const participant = byUsername.get(winner.username);
        if (!participant) return [];
        return [
          {
            giveawayId: giveaway.id,
            participantId: participant.id,
            rank: index + 1,
          },
        ];
      }),
    });

    await tx.giveaway.update({
      where: { id: giveaway.id },
      data: {
        status: "CLOSED",
        drawSeed: seed,
        seedCommitment: commitment,
        participantsSnapshot: snapshot,
        drawnAt: new Date(),
      },
    });
  });

  revalidatePath(`/sorteos/${slug}`);
}

export async function revealSeedAction(formData: FormData) {
  const userId = await requireUser();
  const slug = String(formData.get("slug"));

  const giveaway = await prisma.giveaway.findFirst({
    where: { publicSlug: slug, userId, drawnAt: { not: null } },
  });

  if (!giveaway?.drawSeed || !giveaway.seedCommitment) {
    throw new Error("Todavía no se sorteó");
  }

  const valid = verifySeed(giveaway.drawSeed, giveaway.seedCommitment);
  if (!valid) {
    throw new Error("La semilla no coincide con el compromiso publicado");
  }

  revalidatePath(`/sorteos/${slug}`);
}
