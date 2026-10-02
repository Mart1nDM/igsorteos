import type { InstagramProvider } from "@/lib/instagram";
import type { EngagementCandidate } from "@/lib/rules";

/**
 * Arma la lista unificada de candidatos a partir de las fuentes que expone el
 * provider: respuestas al sticker de preguntas + reacciones/menciones.
 *
 * En el modo real, `isFollowing` no está disponible vía Graph API pública: queda
 * en false y por eso la regla FOLLOW no habilita a nadie. Cuando quieras
 * habilitarlo, conectá un proveedor que resuelva ese dato.
 */
export async function buildCandidates(
  provider: InstagramProvider,
  accessToken: string,
  mediaIgId: string,
  mediaKind: string,
): Promise<EngagementCandidate[]> {
  const isStory = mediaKind === "STORY";

  const [replies, engagement] = await Promise.all([
    provider.listStoryReplies(accessToken, mediaIgId),
    provider.listStoryEngagement(accessToken, mediaIgId),
  ]);

  const merged = new Map<string, EngagementCandidate>();

  for (const reply of replies) {
    merged.set(reply.username, {
      igUserId: reply.igUserId,
      username: reply.username,
      fullName: reply.fullName,
      avatarUrl: reply.avatarUrl,
      mentions: [],
      hasLiked: false,
      hasSaved: false,
      hasCommented: false,
      answer: reply.answer,
      isFollowing: false,
    });
  }

  for (const person of engagement) {
    const existing = merged.get(person.username);
    merged.set(person.username, {
      igUserId: existing?.igUserId ?? person.igUserId,
      username: person.username,
      fullName: existing?.fullName ?? person.fullName,
      avatarUrl: existing?.avatarUrl ?? person.avatarUrl,
      mentions: person.mentions,
      hasLiked: person.hasLiked || (existing?.hasLiked ?? false),
      hasSaved: person.hasSaved || (existing?.hasSaved ?? false),
      hasCommented: isStory ? (existing?.hasCommented ?? false) : true,
      answer: existing?.answer ?? null,
      isFollowing: existing?.isFollowing ?? false,
    });
  }

  return [...merged.values()];
}
