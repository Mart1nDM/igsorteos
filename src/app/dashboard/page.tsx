import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Gift, Image as ImageIcon, Play, RefreshCw, Sparkles, Users } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { groupByKind, listMediaForDisplay, syncAccount } from "@/lib/media";
import { syncInstagramAction } from "@/app/actions/giveaways";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatCompact, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  let mediaCount = await prisma.mediaItem.count({ where: { userId } });
  if (mediaCount === 0) {
    await syncAccount(userId).catch(() => null);
    mediaCount = await prisma.mediaItem.count({ where: { userId } });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, igUsername: true, igProfilePic: true },
  });

  const items = await listMediaForDisplay(userId);
  const { stories, posts, reels } = groupByKind(items);
  const giveaways = await prisma.giveaway.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { _count: { select: { participants: true } } },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Tu cuenta"
        title={user?.igUsername ? `@${user.igUsername}` : "Tu cuenta"}
        description="Elegí una historia o publicación sobre la que quieras crear el sorteo."
        action={
          <form action={syncInstagramAction}>
            <Button variant="secondary" type="submit">
              <RefreshCw className="size-4" />
              Sincronizar
            </Button>
          </form>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Historias" value={stories.length} icon={<Sparkles className="size-4" />} />
        <StatCard label="Publicaciones" value={posts.length} icon={<ImageIcon className="size-4" />} />
        <StatCard label="Sorteos activos" value={giveaways.filter((g) => g.status === "ACTIVE").length} icon={<Gift className="size-4" />} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="size-10" />}
          title="Todavía no hay contenido"
          description="Sincronizá tu cuenta de Instagram para ver tus historias y publicaciones acá."
          action={
            <form action={syncInstagramAction}>
              <Button type="submit">
                <RefreshCw className="size-4" />
                Sincronizar ahora
              </Button>
            </form>
          }
        />
      ) : (
        <div className="space-y-10">
          {stories.length > 0 ? <Section title="Historias activas" items={stories} /> : null}
          {posts.length > 0 ? <Section title="Publicaciones" items={posts} /> : null}
          {reels.length > 0 ? <Section title="Reels" items={reels} /> : null}
        </div>
      )}

      {giveaways.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Tus sorteos recientes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {giveaways.map((giveaway) => (
              <Link
                key={giveaway.id}
                href={`/sorteos/${giveaway.publicSlug}`}
                className="card card-hover p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
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
                  <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                    <Users className="size-3.5" />
                    {giveaway._count.participants}
                  </span>
                </div>
                <h3 className="font-medium text-ink-900">{giveaway.title}</h3>
                <p className="mt-1 text-xs text-ink-400">
                  {timeAgo(giveaway.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-semibold text-ink-900">{formatCompact(value)}</p>
        <p className="text-xs text-ink-500">{label}</p>
      </div>
    </Card>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listMediaForDisplay>>;
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-ink-900">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

type MediaCardProps = {
  item: Awaited<ReturnType<typeof listMediaForDisplay>>[number];
};

function MediaCard({ item }: MediaCardProps) {
  const KindIcon = item.kind === "REEL" ? Play : ImageIcon;

  return (
    <Link
      href={`/dashboard/nuevo/${item.id}`}
      className="card card-hover group overflow-hidden"
    >
      <div className="relative aspect-square bg-gradient-to-br from-brand-100 via-brand-50 to-ink-100">
        <div className="flex h-full w-full items-center justify-center text-brand-300">
          <KindIcon className="size-10" />
        </div>
        <span className="absolute top-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-ink-600">
          {item.kind === "STORY" ? "Historia" : item.kind === "REEL" ? "Reel" : "Post"}
        </span>
        {item.hasQuestionSticker ? (
          <span className="absolute top-2 right-2 rounded-lg bg-brand-600 px-2 py-1 text-[10px] font-semibold text-white">
            ? Sticker
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="line-clamp-2 text-sm text-ink-700">
          {item.caption ?? "Sin descripción"}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
          <span>{timeAgo(item.takenAt)}</span>
          {item.permalink ? (
            <ExternalLink className="size-3.5 opacity-0 transition group-hover:opacity-100" />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
