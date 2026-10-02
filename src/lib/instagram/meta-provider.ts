import "server-only";

import type {
  InstagramAccount,
  InstagramEngagementResponse,
  InstagramMedia,
  InstagramProvider,
  MediaEngagement,
  StoryEngagement,
  StoryReply,
} from "./types";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v23.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class MetaGraphError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
  ) {
    super(message);
    this.name = "MetaGraphError";
  }
}

async function graphFetch<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}/${path.replace(/^\/+/, "")}`);
  url.searchParams.set("access_token", accessToken);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok || (payload as { error?: unknown }).error) {
    const error = (payload as { error?: { message?: string; code?: number } }).error;
    throw new MetaGraphError(
      error?.message ?? `Meta Graph API respondió ${response.status}`,
      response.status,
      error?.code,
    );
  }

  return payload as T;
}

type GraphProfile = {
  id: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  media_count?: number;
};

type GraphMediaNode = {
  id: string;
  media_type?: string;
  media_product_type?: string;
  permalink?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp?: string;
  expires_at?: number;
};

type GraphMediaList = { data?: GraphMediaNode[] };

type GraphMedia = GraphMediaNode & {
  username?: string;
  comments?: {
    data?: Array<{
      id: string;
      text: string;
      username: string;
      timestamp: string;
      from?: { id: string; username: string };
    }>;
  };
  like_count?: number;
};

type GraphStoryMention = {
  id: string;
  username: string;
  user?: { id: string; username: string };
};

type GraphInsights = {
  data?: Array<{
    name: string;
    values?: Array<{ value?: string; id?: string }>;
  }>;
};

function toKind(node: GraphMediaNode): "STORY" | "REEL" | "POST" {
  if (node.media_type === "STORY") return "STORY";
  if (node.media_product_type === "REELS") return "REEL";
  return "POST";
}

function mapMedia(node: GraphMediaNode): InstagramMedia {
  return {
    igId: node.id,
    kind: toKind(node),
    permalink: node.permalink ?? null,
    thumbnailUrl: node.thumbnail_url ?? null,
    caption: node.caption ?? null,
    takenAt: node.timestamp ? new Date(node.timestamp) : null,
    expiresAt: node.expires_at ? new Date(node.expires_at * 1000) : null,
    hasQuestionSticker: false,
  };
}

export const metaGraphProvider: InstagramProvider = {
  name: "meta",

  async getAccount(accessToken): Promise<InstagramAccount> {
    const profile = await graphFetch<GraphProfile>("me", accessToken, {
      fields: "id,username,name,profile_picture_url,followers_count,media_count",
    });

    if (!profile.username) {
      throw new MetaGraphError(
        "La cuenta de Instagram no está vinculada a una Facebook Page. Vinculá una cuenta Business o Creator en la configuración de la app de Meta.",
        400,
      );
    }

    return {
      igId: profile.id,
      username: profile.username,
      fullName: profile.name ?? profile.username,
      profilePicUrl: profile.profile_picture_url ?? null,
      followersCount: profile.followers_count ?? null,
      mediaCount: profile.media_count ?? null,
    };
  },

  async listMedia(accessToken, igId): Promise<InstagramMedia[]> {
    const result = await graphFetch<GraphMediaList>(`${igId}/media`, accessToken, {
      fields: "id,media_type,media_product_type,permalink,thumbnail_url,caption,timestamp,expires_at",
      limit: "50",
    });

    return (result.data ?? []).map(mapMedia);
  },

  async listStoryReplies(accessToken, storyIgId): Promise<StoryReply[]> {
    const story = await graphFetch<GraphMedia>(storyIgId, accessToken, {
      fields: "username",
    });

    const insights = await graphFetch<GraphInsights>(
      `${storyIgId}/insights`,
      accessToken,
      { metric: "story_sticker_responses" },
    );

    const values = insights.data?.find((d) => d.name === "story_sticker_responses")
      ?.values?.[0];

    if (!values?.value) return [];

    let responses: InstagramEngagementResponse[] = [];
    try {
      responses = JSON.parse(values.value) as InstagramEngagementResponse[];
    } catch {
      return [];
    }

    return responses
      .filter((response) => response.type === "question")
      .map((response) => {
        const user = response.user ?? { id: "0", username: "desconocido" };
        const username = (story.username && user.username) || user.username;
        return {
          igUserId: user.id,
          username,
          fullName: username,
          avatarUrl: null,
          answer: response.text ?? null,
          repliedAt: null,
        };
      });
  },

  async listStoryEngagement(
    accessToken,
    storyIgId,
  ): Promise<StoryEngagement[]> {
    const results = await Promise.all([
      this.listMediaEngagement(accessToken, storyIgId),
      graphFetch<{ data?: GraphStoryMention[] }>(
        `${storyIgId}/mentions`,
        accessToken,
      ).catch(() => ({ data: [] })),
    ]);

    const engagement = results[0];
    const mentions = results[1].data ?? [];

    const merged = new Map<string, StoryEngagement>();

    for (const like of engagement.likes) {
      merged.set(like.username, { ...like, mentions: [] });
    }
    for (const mention of mentions) {
      const username = mention.user?.username ?? mention.username;
      if (!username) continue;
      const existing = merged.get(username);
      merged.set(username, {
        igUserId: mention.user?.id ?? mention.id,
        username,
        fullName: username,
        avatarUrl: existing?.avatarUrl ?? null,
        mentions: [...(existing?.mentions ?? []), username],
        hasLiked: existing?.hasLiked ?? false,
        hasSaved: existing?.hasSaved ?? false,
      });
    }

    return [...merged.values()];
  },

  async listMediaEngagement(
    accessToken,
    mediaIgId,
  ): Promise<MediaEngagement> {
    const media = await graphFetch<GraphMedia>(mediaIgId, accessToken, {
      fields: "username,comments{id,text,username,timestamp,from}",
    });

    const comments = (media.comments?.data ?? []).map((comment) => ({
      igUserId: comment.from?.id ?? comment.id,
      username: comment.from?.username ?? comment.username,
      fullName: comment.from?.username ?? comment.username,
      avatarUrl: null,
      mentions: extractMentions(comment.text),
      hasLiked: false,
      hasSaved: false,
    }));

    const likers = await fetchLikers(accessToken, mediaIgId);
    const likes = likers.map((username) => ({
      igUserId: username,
      username,
      fullName: username,
      avatarUrl: null,
      mentions: [],
      hasLiked: true,
      hasSaved: false,
    }));

    const mentionsFromCaption = extractMentions(media.caption ?? "");
    const mentions = mentionsFromCaption.map((username) => ({
      igUserId: username,
      username,
      fullName: username,
      avatarUrl: null,
      mentions: [username],
      hasLiked: false,
      hasSaved: false,
    }));

    return { likes, comments, mentions };
  },
};

async function fetchLikers(
  accessToken: string,
  mediaIgId: string,
): Promise<string[]> {
  try {
    const result = await graphFetch<{ data?: Array<{ id: string; username: string }> }>(
      `${mediaIgId}/likes`,
      accessToken,
      { limit: "100" },
    );
    return (result.data ?? []).map((user) => user.username);
  } catch {
    return [];
  }
}

function extractMentions(text: string): string[] {
  return [...text.matchAll(/@([A-Za-z0-9._]+)/g)].map((match) => match[1]);
}
