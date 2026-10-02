import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { GiveawayBuilder } from "./giveaway-builder";

export const dynamic = "force-dynamic";

export default async function NewGiveawayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const media = await prisma.mediaItem.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!media) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Nuevo sorteo"
        title="Configurá las reglas"
        description="Definí quién puede participar y cuántas personas ganadoras querés."
      />

      <GiveawayBuilder
        media={{
          id: media.id,
          kind: media.kind,
          caption: media.caption,
          hasQuestionSticker: media.hasQuestionSticker,
          permalink: media.permalink,
        }}
      />
    </div>
  );
}
