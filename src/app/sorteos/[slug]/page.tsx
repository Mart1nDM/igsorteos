import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Dices,
  ExternalLink,
  Eye,
  Fingerprint,
  Hash,
  Share2,
  Trophy,
  XCircle,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  drawAction,
  revealSeedAction,
  toggleGiveawayStatusAction,
} from "@/app/actions/giveaways";
import { verifySeed } from "@/lib/draw";
import { RULE_LABELS } from "@/lib/rules";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GiveawayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const giveaway = await prisma.giveaway.findUnique({
    where: { publicSlug: slug },
    include: {
      media: true,
      rules: true,
      user: { select: { igUsername: true, name: true } },
      participants: true,
      winners: { include: { participant: true }, orderBy: { rank: "asc" } },
    },
  });

  if (!giveaway) {
    return <div className="card p-10 text-center text-ink-500">Sorteo no encontrado.</div>;
  }

  const isOwner = session?.user?.id === giveaway.userId;
  const seedValid = giveaway.drawSeed && giveaway.seedCommitment
    ? verifySeed(giveaway.drawSeed, giveaway.seedCommitment)
    : null;

  return (
    <div>
      <PageHeader
        eyebrow={isOwner ? "Tu sorteo" : "Sorteo"}
        title={giveaway.title}
        description={giveaway.description ?? undefined}
        action={
          <div className="flex items-center gap-3">
            <Badge
              tone={
                giveaway.status === "ACTIVE"
                  ? "success"
                  : giveaway.status === "CLOSED"
                    ? "neutral"
                    : "warning"
              }
            >
              {giveaway.status === "ACTIVE"
                ? "Activo"
                : giveaway.status === "CLOSED"
                  ? "Sorteado"
                  : "Borrador"}
            </Badge>
            {!isOwner ? (
              <Link
                href={`/s/${giveaway.publicSlug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Ver página pública <ExternalLink className="size-3.5" />
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-base font-semibold text-ink-900">Reglas</h2>
            <ul className="space-y-3">
              {giveaway.rules.map((rule) => (
                <li key={rule.id} className="flex items-start gap-3 text-sm text-ink-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  <span>
                    {RULE_LABELS[rule.type]}
                    {rule.type === "MENTIONS" ? `: al menos ${rule.amount}` : ""}
                    {rule.type === "QUESTION_STICKER" && rule.expectedAnswer
                      ? `: la respuesta debe ser "${rule.expectedAnswer}"`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-ink-400">
              {giveaway.winnersCount}{" "}
              {giveaway.winnersCount === 1 ? "ganador" : "ganadores"} ·{" "}
              {giveaway.participants.length} participantes válidos
              {giveaway.participantsSnapshot
                ? ` de ${giveaway.participantsSnapshot} al momento del sorteo`
                : ""}
            </p>
          </Card>

          {giveaway.status === "CLOSED" && giveaway.winners.length > 0 ? (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink-900">
                <Trophy className="size-5 text-amber-500" />
                Ganadores
              </h2>
              <ol className="space-y-3">
                {giveaway.winners.map((winner) => (
                  <li
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
                        Sorteado el {formatDate(winner.drawnAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}

          {isOwner && giveaway.status !== "CLOSED" ? (
            <Card className="border-brand-200 bg-brand-50/40">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-ink-900">
                <Dices className="size-5 text-brand-600" />
                Sortear ahora
              </h2>
              <p className="mb-5 text-sm text-ink-600">
                Al sortear se genera una semilla aleatoria, se publica su hash y
                después se calculan los ganadores. Nadie puede manipular el
                resultado después.
              </p>
              <form action={drawAction}>
                <input type="hidden" name="slug" value={giveaway.publicSlug} />
                <Button type="submit" size="lg">
                  <Dices className="size-5" />
                  Ejecutar sorteo
                </Button>
              </form>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {giveaway.media ? (
            <Card className="overflow-hidden p-0">
              <div className="aspect-square bg-gradient-to-br from-brand-100 via-brand-50 to-ink-100" />
              <div className="p-5">
                <Badge tone="neutral">{giveaway.media.kind}</Badge>
                <p className="mt-3 line-clamp-4 text-sm text-ink-700">
                  {giveaway.media.caption ?? "Sin descripción"}
                </p>
                {giveaway.media.permalink ? (
                  <a
                    href={giveaway.media.permalink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Ver en Instagram <ExternalLink className="size-3.5" />
                  </a>
                ) : null}
              </div>
            </Card>
          ) : null}

          {isOwner ? (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink-900">
                <Share2 className="size-4 text-brand-600" />
                Compartir
              </h2>
              <Link
                href={`/s/${giveaway.publicSlug}`}
                className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-600 hover:bg-ink-50"
              >
                <Eye className="size-4" />
                Ver página pública
              </Link>

              {giveaway.status === "ACTIVE" ? (
                <form action={toggleGiveawayStatusAction} className="mt-2">
                  <input type="hidden" name="slug" value={giveaway.publicSlug} />
                  <input type="hidden" name="status" value="CLOSED" />
                  <Button variant="secondary" type="submit" className="w-full">
                    Cerrar sorteo
                  </Button>
                </form>
              ) : null}
            </Card>
          ) : null}

          <SeedCard
            slug={giveaway.publicSlug}
            seed={giveaway.drawSeed}
            commitment={giveaway.seedCommitment}
            valid={seedValid}
            drawnAt={giveaway.drawnAt}
            revealed={isOwner}
          />
        </aside>
      </div>
    </div>
  );
}

function SeedCard({
  slug,
  seed,
  commitment,
  valid,
  drawnAt,
  revealed,
}: {
  slug: string;
  seed: string | null;
  commitment: string | null;
  valid: boolean | null;
  drawnAt: Date | null;
  revealed: boolean;
}) {
  if (!drawnAt || !commitment) {
    return (
      <Card>
        <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-ink-900">
          <Fingerprint className="size-4 text-brand-600" />
          Verificación
        </h2>
        <p className="text-sm text-ink-500">
          Cuando ejecutes el sorteo se publica el hash de la semilla. Después
          vas a poder revelar la semilla para que cualquiera compruebe el
          resultado.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink-900">
        <Fingerprint className="size-4 text-brand-600" />
        Verificación
      </h2>

      <p className="mb-2 text-xs font-medium text-ink-500">
        Compromiso público (SHA-256 de la semilla)
      </p>
      <code className="block break-all rounded-xl bg-ink-100 px-3 py-2 font-mono text-[11px] text-ink-700">
        {commitment}
      </code>

      {seed && revealed ? (
        <>
          <p className="mt-4 mb-2 text-xs font-medium text-ink-500">
            Semilla revelada
          </p>
          <code className="block break-all rounded-xl bg-brand-50 px-3 py-2 font-mono text-[11px] text-brand-800">
            {seed}
          </code>
        </>
      ) : seed ? (
        <form action={revealSeedAction} className="mt-4">
          <input type="hidden" name="slug" value={slug} />
          <Button variant="secondary" type="submit" className="w-full">
            <Copy className="size-4" />
            Revelar semilla
          </Button>
        </form>
      ) : null}

      {valid === true ? (
        <p className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="size-4" />
          La semilla coincide con el compromiso.
        </p>
      ) : null}
      {valid === false ? (
        <p className="mt-4 flex items-center gap-2 text-xs font-medium text-red-700">
          <XCircle className="size-4" />
          La semilla no coincide: el sorteo fue alterado.
        </p>
      ) : null}

      <p className="mt-4 flex items-start gap-2 text-xs text-ink-400">
        <Hash className="mt-0.5 size-3.5 shrink-0" />
        Sorteado el {formatDate(drawnAt)}. Cualquiera puede recalcular el hash
        y auditar el resultado.
      </p>
    </Card>
  );
}
