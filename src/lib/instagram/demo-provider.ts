import type {
  InstagramAccount,
  InstagramMedia,
  InstagramProvider,
  MediaEngagement,
  StoryEngagement,
  StoryReply,
} from "./types";

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const DEMO_ACCOUNT: InstagramAccount = {
  igId: "17841400000000001",
  username: "tu.marca",
  fullName: "Tu Marca",
  profilePicUrl: null,
  followersCount: 12840,
  mediaCount: 214,
};

export const DEMO_QUESTION = "¿Cuál es el color de nuestra remera?";

/**
 * Una única fuente de verdad para las historias: cada participante tiene su
 * respuesta al sticker, sus menciones y si reaccionó o no. Así el demo se
 * comporta como el Instagram real, donde todo viene del mismo usuario.
 */
type DemoParticipant = {
  igUserId: string;
  username: string;
  fullName: string;
  answer: string | null;
  mentions: string[];
  hasLiked: boolean;
  hasSaved: boolean;
};

function person(
  igUserId: string,
  username: string,
  fullName: string,
  options: Partial<Omit<DemoParticipant, "igUserId" | "username" | "fullName">> = {},
): DemoParticipant {
  return {
    igUserId,
    username,
    fullName,
    answer: options.answer ?? null,
    mentions: options.mentions ?? [],
    hasLiked: options.hasLiked ?? true,
    hasSaved: options.hasSaved ?? false,
  };
}

const STORY_PARTICIPANTS: Record<string, DemoParticipant[]> = {
  "story-1": [
    person("u01", "lu.mendoza", "Lu Mendoza", { answer: "azul", mentions: ["@amigo.uno", "@amigo.dos"] }),
    person("u02", "carla.design", "Carla Design", { answer: "rojo", mentions: ["@amigo.tres"] }),
    person("u03", "tomasriv", "Tomas Riv", { answer: "Azul", mentions: ["@a.uno"] }),
    person("u04", "maru.fit", "Maru Fit", { answer: "verde", mentions: ["@a.dos", "@a.tres", "@a.cuatro"] }),
    person("u05", "nico.arq", "Nico Arq", { answer: "azul", mentions: ["@b.uno", "@b.dos"] }),
    person("u06", "sofia.re", "Sofia Re", { answer: "negro", mentions: [], hasLiked: false }),
    person("u07", "julieta.mp", "Julieta MP", { answer: "AZUL", mentions: ["@c.uno", "@c.dos"], hasSaved: true }),
    person("u08", "bauti.g", "Bauti G", { answer: "amarillo", mentions: ["@d.uno"] }),
    person("u09", "flor.barrios", "Flor Barrios", { answer: "azul", mentions: ["@e.uno", "@e.dos", "@e.tres"], hasSaved: true }),
    person("u10", "diego.paz", "Diego Paz", { answer: "rosa", mentions: ["@f.uno", "@f.dos"] }),
    person("u11", "mica.23", "Mica 23", { answer: null, mentions: ["@g.uno", "@g.dos"] }),
    person("u12", "fran__s", "Fran S", { answer: "blanco", mentions: [], hasLiked: false }),
    person("u13", "valen.osp", "Valen Osp", { answer: "azul", mentions: ["@h.uno"] }),
    person("u14", "agustina.lm", "Agustina LM", { answer: "azul", mentions: ["@i.uno", "@i.dos"], hasSaved: true }),
  ],
  "story-2": [
    person("u20", "lu.mendoza", "Lu Mendoza", { mentions: ["@amigo.uno", "@amigo.dos"] }),
    person("u21", "tomasriv", "Tomas Riv", { mentions: ["@a.uno", "@a.dos"] }),
    person("u22", "maru.fit", "Maru Fit", { mentions: ["@a.dos"] }),
    person("u23", "nico.arq", "Nico Arq", { mentions: ["@b.uno", "@b.dos", "@b.tres"], hasSaved: true }),
    person("u24", "julieta.mp", "Julieta MP", { mentions: ["@c.uno"] }),
    person("u25", "diego.paz", "Diego Paz", { mentions: ["@f.uno", "@f.dos"], hasLiked: false }),
  ],
  "story-3": [
    person("u30", "carla.design", "Carla Design", { answer: "azul", mentions: ["@z.uno", "@z.dos"] }),
    person("u31", "flor.barrios", "Flor Barrios", { answer: "azul", mentions: ["@e.uno"] }),
    person("u32", "agustina.lm", "Agustina LM", { answer: "AZUL", mentions: ["@i.uno", "@i.dos", "@i.tres"] }),
    person("u33", "valen.osp", "Valen Osp", { answer: "negro", mentions: ["@h.uno", "@h.dos"] }),
    person("u34", "mica.23", "Mica 23", { answer: null, mentions: ["@g.uno"], hasLiked: false }),
  ],
  "story-4": [
    person("u40", "sofia.re", "Sofia Re", { mentions: ["@q.uno", "@q.dos"] }),
    person("u41", "bauti.g", "Bauti G", { mentions: ["@d.uno"] }),
    person("u42", "fran__s", "Fran S", { mentions: [], hasLiked: false }),
  ],
};

const COMMENT_POOL: DemoParticipant[] = [
  person("c01", "paola.n", "Paola N", { mentions: ["@paola.n", "@amigo.uno"] }),
  person("c02", "gaston.p", "Gaston P", { mentions: ["@amigo.dos"] }),
  person("c03", "romina.k", "Romina K", { mentions: [] }),
  person("c04", "santi.v", "Santi V", { mentions: ["@amigo.uno", "@amigo.dos", "@amigo.tres"] }),
  person("c05", "belen.t", "Belen T", { mentions: ["@belen.t"] }),
];

const STORY_CAPTIONS = [
  "Nuevo drop este viernes 🚀 Respondé con el color y sumá a un amigo etiquetado.",
  "Reglamento simple: seguinos, comentá con tu usuario y etiquetá a 2 personas.",
  "Últimas 12 horas del sorteo. Mirá el sticker de preguntas 👇",
  "Repost si llegaste hasta acá 😎",
];

const POST_CAPTIONS = [
  "Nueva colección disponible en la web. Link en la bio 🔗",
  "Behind the scenes del shoot de hoy 📸",
  "Gracias por los 12k, folks. Se viene algo grande.",
  "Video del proceso completo, con música de fondo 🎬",
  "Post collaborative con @otra.marca 🤝",
];

const REEL_CAPTIONS = [
  "Pack en 15 segundos ⏱️",
  "Unboxing del nuevo set 🎁",
  "El tips que nadie te cuenta 👀",
];

function buildMedia(): InstagramMedia[] {
  const media: InstagramMedia[] = [];

  STORY_CAPTIONS.forEach((caption, index) => {
    media.push({
      igId: `story-${index + 1}`,
      kind: "STORY",
      permalink: null,
      thumbnailUrl: null,
      caption,
      takenAt: daysAgo(index),
      expiresAt: daysFromNow(1),
      hasQuestionSticker: index < 3,
    });
  });

  POST_CAPTIONS.forEach((caption, index) => {
    media.push({
      igId: `post-${index + 1}`,
      kind: "POST",
      permalink: `https://instagram.com/p/demo-post-${index + 1}`,
      thumbnailUrl: null,
      caption,
      takenAt: daysAgo(index * 3 + 1),
      expiresAt: null,
      hasQuestionSticker: false,
    });
  });

  REEL_CAPTIONS.forEach((caption, index) => {
    media.push({
      igId: `reel-${index + 1}`,
      kind: "REEL",
      permalink: `https://instagram.com/reel/demo-reel-${index + 1}`,
      thumbnailUrl: null,
      caption,
      takenAt: daysAgo(index * 5 + 2),
      expiresAt: null,
      hasQuestionSticker: false,
    });
  });

  return media;
}

const DEMO_MEDIA = buildMedia();

function participantsFor(mediaIgId: string) {
  return STORY_PARTICIPANTS[mediaIgId] ?? [];
}

export const demoProvider: InstagramProvider = {
  name: "demo",

  async getAccount() {
    return DEMO_ACCOUNT;
  },

  async listMedia() {
    return DEMO_MEDIA;
  },

  async listStoryReplies(
    _accessToken,
    storyIgId,
  ): Promise<StoryReply[]> {
    return participantsFor(storyIgId)
      .filter((participant) => participant.answer !== null)
      .map((participant, index) => ({
        igUserId: participant.igUserId,
        username: participant.username,
        fullName: participant.fullName,
        avatarUrl: null,
        answer: participant.answer,
        repliedAt: daysAgo(index),
      }));
  },

  async listStoryEngagement(
    _accessToken,
    storyIgId,
  ): Promise<StoryEngagement[]> {
    return participantsFor(storyIgId)
      .filter(
        (participant) =>
          participant.hasLiked ||
          participant.hasSaved ||
          participant.mentions.length > 0,
      )
      .map((participant) => ({
        igUserId: participant.igUserId,
        username: participant.username,
        fullName: participant.fullName,
        avatarUrl: null,
        mentions: participant.mentions,
        hasLiked: participant.hasLiked,
        hasSaved: participant.hasSaved,
      }));
  },

  async listMediaEngagement(
    _accessToken,
    mediaIgId,
  ): Promise<MediaEngagement> {
    const isCommentable = !mediaIgId.startsWith("story");

    const pool = isCommentable
      ? COMMENT_POOL
      : participantsFor(mediaIgId).slice(0, 6);

    const likes: StoryEngagement[] = pool
      .filter((participant) => participant.hasLiked)
      .map((participant) => ({
        igUserId: participant.igUserId,
        username: participant.username,
        fullName: participant.fullName,
        avatarUrl: null,
        mentions: [],
        hasLiked: true,
        hasSaved: false,
      }));

    const comments: StoryEngagement[] = isCommentable
      ? pool.map((participant) => ({
          igUserId: participant.igUserId,
          username: participant.username,
          fullName: participant.fullName,
          avatarUrl: null,
          mentions: participant.mentions,
          hasLiked: false,
          hasSaved: false,
        }))
      : [];

    const mentions: StoryEngagement[] = isCommentable
      ? ["tu.marca", "otra.marca"].map((username, index) => ({
          igUserId: `demo-mention-${index}`,
          username,
          fullName: username,
          avatarUrl: null,
          mentions: [username],
          hasLiked: false,
          hasSaved: false,
        }))
      : [];

    return { likes, comments, mentions };
  },
};
