import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Fingerprint, Gift, Trophy, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { verifySeed } from "@/lib/draw";
import { RULE_LABELS } from "@/lib/rules";
import { Badge, Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const giveaway = await prisma.giveaway.findUnique({
    where: { publicSlug: slug },
    select: { title: true, description: true, status: true },
  });

  if (!giveaway) return { title: "Sorteo no encontrado" };

  return {
    title: giveaway.title,
    description:
      giveaway.description ?? "Participá de este sorteo y mirá quién se llevó el premio.",
    openGraph: {
      title: giveaway.title,
      description: giveaway.description ?? undefined,
      type: "website",
    },
  };
}

export default async function PublicGiveawayPage({ params }: Props) {
  const { slug } = await params;

  const giveaway = await prisma.giveaway.findUnique({
    where: { publicSlug: slug },
    include: {
      media: true,
      rules: true,
      user: { select: { igUsername: true, name: true } },
      participants: { select: { id: true } },
      winners: { include: { participant: true }, orderBy: { rank: "asc" } },
    },
  });

  if (!giveaway) notFound();

  const seedValid =
    giveaway.drawSeed && giveaway.seedCommitment
      ? verifySeed(giveaway.drawSeed, giveaway.seedCommitment)
      : null;

  const closed = giveaway.status === "CLOSED";

  return (
    <div className="mx-auto max-w-2xl py-6">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-ink-200 bg-gradient-to-br from-brand-50 to-white px-8 py-10 text-center">
          <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-brand-600 text-white">
            {closed ? <Trophy className="size-7" /> : <Gift className="size-7" />}
          </span>

          <Badge tone={closed ? "neutral" : "success"}>
            {closed ? "Sorteado" : "Sorteo activo"}
          </Badge>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900">
            {giveaway.title}
          </h1>

          {giveaway.description ? (
            <p className="mx-auto mt-3 max-w-lg text-ink-600">
              {giveaway.description}
            </p>
          ) : null}

          <p className="mt-4 text-sm text-ink-400">
            Organizado por{" "}
            <span className="font-medium text-ink-600">
              @{giveaway.user.igUsername ?? giveaway.user.name}
            </span>
          </p>
        </div>

        <div className="space-y-8 px-8 py-8">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
              <CheckCircle2 className="size-4 text-brand-600" />
              Cómo participar
            </h2>
            <ol className="space-y-3">
              {giveaway.rules.map((rule, index) => (
                <li key={rule.id} className="flex gap-3 text-sm text-ink-700">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {index + 1}
                  </span>
                  <span>
                    {RULE_LABELS[rule.type]}
                    {rule.type === "MENTIONS" ? `: etiquetá al menos ${rule.amount} cuentas` : ""}
                    {rule.type === "QUESTION_STICKER"
                      ? `: respondé correctamente${rule.expectedAnswer ? ` (${rule.expectedAnswer})` : ""}`
                      : ""}
                  </span>
                </li>
              ))}
            </ol>

            {giveaway.media?.permalink ? (
              <a
                href={giveaway.media.permalink}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Participar en Instagram
              </a>
            ) : null}
          </section>

          <section className="flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-3">
            <Users className="size-4 text-ink-400" />
            <p className="text-sm text-ink-600">
              {giveaway.participants.length} participantes habilitados
              {giveaway.winnersCount > 1
                ? ` · ${giveaway.winnersCount} ganadores`
                : " · 1 ganador"}
            </p>
          </section>

          {closed && giveaway.winners.length > 0 ? (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
                <Trophy className="size-4 text-amber-500" />
                Ganadores
              </h2>
              <div className="space-y-3">
                {giveaway.winners.map((winner) => (
                  <div
                    key={winner.id}
                    className="flex items-center gap-3 rounded-xl bg-amber-50/60 px-4 py-3 ring-1 ring-amber-100"
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-amber-500 text-sm font-semibold text-white">
                      {winner.rank}
                    </span>
                    <div>
                      <p className="font-medium text-ink-900">
                        @{winner.participant.username}
                      </p>
                      <p className="text-xs text-ink-500">
                        {formatDate(winner.drawnAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {giveaway.seedCommitment ? (
            <section className="border-t border-ink-200 pt-6">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
                <Fingerprint className="size-4 text-brand-600" />
                Sorteo verificable
              </h2>
              <p className="mb-3 text-sm text-ink-600">
                El sorteo se calculó con una semilla aleatoria cuyo hash se
                publicó antes de elegir a los ganadores.
              </p>
              <code className="block break-all rounded-xl bg-ink-100 px-3 py-2 font-mono text-[11px] text-ink-700">
                {giveaway.seedCommitment}
              </code>
              {seedValid !== null ? (
                <p className="mt-2 text-xs text-ink-400">
                  {seedValid
                    ? "Semilla verificada: el resultado no fue alterado."
                    : "Semilla inconsistente: el resultado fue alterado."}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
