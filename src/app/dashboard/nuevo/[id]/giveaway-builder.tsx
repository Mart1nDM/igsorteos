"use client";

import { useState } from "react";
import {
  AtSign,
  Heart,
  MessageCircle,
  Bookmark,
  UserPlus,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";

import { createGiveawayAction } from "@/app/actions/giveaways";
import { RULE_LABELS } from "@/lib/rules";
import type { RuleType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { Badge, Button, Card } from "@/components/ui";

const ICONS: Record<RuleType, React.ComponentType<{ className?: string }>> = {
  QUESTION_STICKER: HelpCircle,
  MENTIONS: AtSign,
  FOLLOW: UserPlus,
  LIKE: Heart,
  SAVED: Bookmark,
  COMMENT: MessageCircle,
};

const DEFAULT_RULES: RuleType[] = ["QUESTION_STICKER", "MENTIONS"];

const MEDIA_LABELS: Record<string, string> = {
  STORY: "Historia",
  POST: "Publicación",
  REEL: "Reel",
};

export function GiveawayBuilder({
  media,
}: {
  media: {
    id: string;
    kind: string;
    caption: string | null;
    hasQuestionSticker: boolean;
    permalink: string | null;
  };
}) {
  const [rules, setRules] = useState<RuleType[]>(() => {
    const available = (Object.keys(RULE_LABELS) as RuleType[]).filter((type) =>
      type === "QUESTION_STICKER" ? media.hasQuestionSticker : true,
    );
    return available.filter((type) => DEFAULT_RULES.includes(type));
  });

  const availableRules = (Object.keys(RULE_LABELS) as RuleType[]).filter((type) =>
    type === "QUESTION_STICKER" ? media.hasQuestionSticker : true,
  );

  function toggle(rule: RuleType) {
    setRules((current) =>
      current.includes(rule)
        ? current.filter((item) => item !== rule)
        : [...current, rule],
    );
  }

  return (
    <form action={createGiveawayAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="mediaId" value={media.id} />

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-ink-900">
            Detalles del sorteo
          </h2>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                Título
              </span>
              <input
                name="title"
                required
                placeholder="Ej: Sorteo de la remera nueva"
                className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                Descripción
              </span>
              <textarea
                name="description"
                rows={3}
                placeholder="Contá qué se sortea y las bases."
                className="w-full resize-none rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                Cantidad de ganadores
              </span>
              <input
                name="winnersCount"
                type="number"
                min={1}
                max={20}
                defaultValue={1}
                className="w-32 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>
        </Card>

        <Card>
          <div className="mb-1 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-ink-900">Reglas</h2>
            <Badge tone="brand">{rules.length} activas</Badge>
          </div>
          <p className="mb-5 text-sm text-ink-500">
            Solo entran al sorteo quienes cumplen todas las reglas marcadas.
          </p>

          <div className="space-y-3">
            {availableRules.map((type) => {
              const Icon = ICONS[type];
              const active = rules.includes(type);

              return (
                <div
                  key={type}
                  className={cn(
                    "rounded-xl border p-4 transition",
                    active
                      ? "border-brand-200 bg-brand-50/50"
                      : "border-ink-200 bg-white",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-3 text-sm font-medium text-ink-800">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggle(type)}
                        className="size-4 accent-brand-600"
                      />
                      <Icon className="size-4 text-brand-600" />
                      {RULE_LABELS[type]}
                    </label>
                  </div>

                  {active ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {type === "QUESTION_STICKER" ? (
                        <label className="block sm:col-span-2">
                          <span className="mb-1.5 block text-xs font-medium text-ink-600">
                            Respuesta correcta
                          </span>
                          <input
                            name={`answer-${type}`}
                            placeholder="Ej: azul"
                            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                          />
                          <span className="mt-1.5 block text-xs text-ink-400">
                            Se compara sin distinguir mayúsculas, minúsculas ni
                            acentos.
                          </span>
                        </label>
                      ) : null}

                      {type === "MENTIONS" ? (
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-ink-600">
                            Mínimo de cuentas a etiquetar
                          </span>
                          <input
                            name={`amount-${type}`}
                            type="number"
                            min={1}
                            max={10}
                            defaultValue={2}
                            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                          />
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {rules.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-amber-700">
              <Plus className="size-3.5" />
              Seleccioná al menos una regla para poder publicar el sorteo.
            </p>
          ) : null}
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={rules.length === 0}>
            Crear sorteo
          </Button>
          <Button type="button" variant="ghost" size="lg">
            <Trash2 className="size-4" />
            Descartar
          </Button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden p-0">
          <div className="aspect-square bg-gradient-to-br from-brand-100 via-brand-50 to-ink-100" />
          <div className="p-5">
            <Badge tone="neutral">
              {MEDIA_LABELS[media.kind] ?? media.kind}
            </Badge>
            <p className="mt-3 line-clamp-4 text-sm text-ink-700">
              {media.caption ?? "Sin descripción"}
            </p>
            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              El sorteo se calcula en el momento de sortear, consultando las
              respuestas y reacciones actuales de esta publicación.
            </p>
          </div>
        </Card>
      </aside>
    </form>
  );
}
