import "server-only";

import { prisma } from "@/lib/prisma";
import { getInstagramProvider } from "@/lib/instagram";
import type { InstagramMedia } from "@/lib/instagram";
import type { MediaKind } from "@/generated/prisma/enums";

export type AccountWithToken = {
  id: string;
  igId: string | null;
  igAccessToken: string | null;
};

export async function syncAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.igAccessToken || !user.igId) {
    throw new Error("La cuenta no está conectada a Instagram");
  }

  const provider = await getInstagramProvider();
  const accessToken = user.igAccessToken;

  const account = await provider.getAccount(accessToken);

  await prisma.user.update({
    where: { id: userId },
    data: {
      igUsername: account.username,
      name: account.fullName,
      igProfilePic: account.profilePicUrl,
      igId: account.igId,
    },
  });

  const media = await provider.listMedia(accessToken, account.igId);

  for (const item of media) {
    await prisma.mediaItem.upsert({
      where: { userId_igId: { userId, igId: item.igId } },
      update: {
        kind: item.kind as MediaKind,
        permalink: item.permalink,
        thumbnailUrl: item.thumbnailUrl,
        caption: item.caption,
        takenAt: item.takenAt,
        expiresAt: item.expiresAt,
        hasQuestionSticker: item.hasQuestionSticker,
      },
      create: {
        userId,
        igId: item.igId,
        kind: item.kind as MediaKind,
        permalink: item.permalink,
        thumbnailUrl: item.thumbnailUrl,
        caption: item.caption,
        takenAt: item.takenAt,
        expiresAt: item.expiresAt,
        hasQuestionSticker: item.hasQuestionSticker,
      },
    });
  }

  const total = await prisma.mediaItem.count({ where: { userId } });

  return { account, synced: media.length, total };
}

export function toMediaKind(kind: string): MediaKind {
  return kind === "STORY" ? "STORY" : kind === "REEL" ? "REEL" : "POST";
}

export type MediaForDisplay = {
  id: string;
  kind: MediaKind;
  caption: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  takenAt: Date | null;
  hasQuestionSticker: boolean;
  giveawayCount: number;
};

export async function listMediaForDisplay(
  userId: string,
  filter?: MediaKind,
): Promise<MediaForDisplay[]> {
  const items = await prisma.mediaItem.findMany({
    where: { userId, ...(filter ? { kind: filter } : {}) },
    orderBy: { takenAt: "desc" },
    include: { _count: { select: { giveaways: true } } },
  });

  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    caption: item.caption,
    permalink: item.permalink,
    thumbnailUrl: item.thumbnailUrl,
    takenAt: item.takenAt,
    hasQuestionSticker: item.hasQuestionSticker,
    giveawayCount: item._count.giveaways,
  }));
}

export function groupByKind(items: MediaForDisplay[]) {
  return {
    stories: items.filter((item) => item.kind === "STORY"),
    posts: items.filter((item) => item.kind === "POST"),
    reels: items.filter((item) => item.kind === "REEL"),
  };
}

export function mediaSummary(media: InstagramMedia[]) {
  return media.reduce<Record<string, number>>((acc, item) => {
    acc[item.kind] = (acc[item.kind] ?? 0) + 1;
    return acc;
  }, {});
}
