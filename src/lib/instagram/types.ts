export type MediaKind = "STORY" | "REEL" | "POST";

export type InstagramAccount = {
  igId: string;
  username: string;
  fullName: string;
  profilePicUrl: string | null;
  followersCount: number | null;
  mediaCount: number | null;
};

export type InstagramMedia = {
  igId: string;
  kind: MediaKind;
  permalink: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  takenAt: Date | null;
  expiresAt: Date | null;
  hasQuestionSticker: boolean;
};

export type StoryReply = {
  igUserId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  answer: string | null;
  repliedAt: Date | null;
};

export type StoryEngagement = {
  igUserId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  mentions: string[];
  hasLiked: boolean;
  hasSaved: boolean;
};

export type MediaEngagement = {
  likes: StoryEngagement[];
  comments: StoryEngagement[];
  mentions: StoryEngagement[];
};

export type InstagramEngagementResponse = {
  type?: "question" | "question_repost" | string;
  text?: string;
  user?: { id: string; username: string };
};

export interface InstagramProvider {
  readonly name: "demo" | "meta";

  getAccount(accessToken: string): Promise<InstagramAccount>;
  listMedia(
    accessToken: string,
    igId: string,
  ): Promise<InstagramMedia[]>;
  listStoryReplies(
    accessToken: string,
    storyIgId: string,
  ): Promise<StoryReply[]>;
  listStoryEngagement(
    accessToken: string,
    storyIgId: string,
  ): Promise<StoryEngagement[]>;
  listMediaEngagement(
    accessToken: string,
    mediaIgId: string,
  ): Promise<MediaEngagement>;
}
