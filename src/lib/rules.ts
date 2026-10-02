import type { RuleType } from "@/generated/prisma/enums";

export const RULE_LABELS: Record<RuleType, string> = {
  QUESTION_STICKER: "Sticker de preguntas",
  MENTIONS: "Etiquetar cuentas",
  FOLLOW: "Seguir la cuenta",
  LIKE: "Reaccionar la historia",
  SAVED: "Guardar la publicación",
  COMMENT: "Comentar en la publicación",
};

export const RULE_HINTS: Record<RuleType, string> = {
  QUESTION_STICKER: "La respuesta debe coincidir con la correcta",
  MENTIONS: "Cantidad mínima de cuentas etiquetadas",
  FOLLOW: "Debe seguir la cuenta owner's",
  LIKE: "Debe haber reacted la historia",
  SAVED: "Debe haber guardado la publicación",
  COMMENT: "Debe haber comentado con su usuario",
};

export type RuleDefinition = {
  type: RuleType;
  enabled: boolean;
  amount: number;
  expectedAnswer?: string | null;
};

export type EngagementCandidate = {
  igUserId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  mentions: string[];
  hasLiked: boolean;
  hasSaved: boolean;
  hasCommented: boolean;
  answer: string | null;
  isFollowing: boolean;
};

export type RuleEvaluation = {
  username: string;
  checks: Record<string, boolean>;
  valid: boolean;
};

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function answerMatches(
  answer: string | null | undefined,
  expected: string | null | undefined,
) {
  if (!expected) return true;
  if (!answer) return false;
  return normalize(answer) === normalize(expected);
}

export function evaluateRules(
  candidate: EngagementCandidate,
  rules: RuleDefinition[],
): RuleEvaluation {
  const checks: Record<string, boolean> = {};
  let valid = true;

  for (const rule of rules) {
    if (!rule.enabled) continue;

    switch (rule.type) {
      case "QUESTION_STICKER":
        checks[rule.type] = answerMatches(candidate.answer, rule.expectedAnswer);
        break;
      case "MENTIONS":
        checks[rule.type] = candidate.mentions.length >= rule.amount;
        break;
      case "FOLLOW":
        checks[rule.type] = candidate.isFollowing;
        break;
      case "LIKE":
        checks[rule.type] = candidate.hasLiked;
        break;
      case "SAVED":
        checks[rule.type] = candidate.hasSaved;
        break;
      case "COMMENT":
        checks[rule.type] = candidate.hasCommented;
        break;
    }

    if (!checks[rule.type]) valid = false;
  }

  return { username: candidate.username, checks, valid };
}

export function buildEvidence(checks: Record<string, boolean>) {
  return Object.entries(checks).map(([rule, passed]) => ({
    rule: rule as RuleType,
    passed,
  }));
}
