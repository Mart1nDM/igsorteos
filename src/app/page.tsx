import Link from "next/link";
import {
  ArrowRight,
  Dices,
  Fingerprint,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { auth } from "@/auth";
import { isDemoMode } from "@/lib/instagram";
import { InstagramIcon } from "@/components/instagram-icon";
import { Badge, Button } from "@/components/ui";

export default async function HomePage() {
  const session = await auth();
  const demo = isDemoMode();

  const features = [
    {
      icon: InstagramIcon,
      title: "Tus historias y posts",
      description:
        "Leemos tu contenido propio y lo mostrás en una grilla para que elijas sobre cuál sortear.",
    },
    {
      icon: ListChecks,
      title: "Reglas a medida",
      description:
        "Sticker de preguntas con respuesta correcta, menciones, like, seguir, guardar o comentar.",
    },
    {
      icon: Dices,
      title: "Sorteo sin trampas",
      description:
        "Semilla criptográfica y hash publicado antes de sortear: el resultado es auditable.",
    },
  ];

  return (
    <div>
      <section className="py-14 text-center sm:py-20">
        {demo ? (
          <Badge tone="warning" className="mx-auto">
            <Sparkles className="size-3.5" />
            Modo demo activo
          </Badge>
        ) : null}

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-6xl">
          Sorteos de Instagram que{" "}
          <span className="text-brand-600">se pueden verificar</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-500">
          Elegí una historia o publicación, definí las reglas y convertí las
          respuestas en participantes. El sorteo usa una semilla criptográfica
          con hash público para que nadie pueda manipularlo.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href={session?.user ? "/dashboard" : "/login"}>
            <Button size="lg">
              {session?.user ? "Ir al panel" : "Empezar con Instagram"}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Ver demo
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-5 pb-16 sm:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="card card-hover p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <feature.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold text-ink-900">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      <section className="card mb-16 overflow-hidden p-0">
        <div className="grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
          <div>
            <Badge tone="brand">
              <Fingerprint className="size-3.5" />
              Cómo funciona la verificación
            </Badge>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900">
              Un sorteo que podés auditar
            </h2>
            <ol className="mt-6 space-y-4">
              {[
                "Se genera una semilla aleatoria de 256 bits con el módulo criptográfico del sistema.",
                "Se publica su hash SHA-256 antes de elegir a los ganadores.",
                "Cada participante se ordena por su propio hash, sin sesgo ni corridas.",
                "Al revelar la semilla, cualquiera recalcula el hash y confirma el resultado.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-ink-600">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-3 self-center">
            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <p className="text-xs font-medium text-ink-400">
                Compromiso público
              </p>
              <code className="mt-2 block break-all rounded-xl bg-ink-100 px-3 py-2 font-mono text-[11px] text-ink-700">
                9f2c7a1e4b8d6f0a3c5e9b2d7f4a1c8e6b3d9f0a2c5e8b1d4f7a0c3e6b9d2f5a8c1
              </code>
            </div>
            <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
              <p className="text-xs font-medium text-brand-600">
                Semilla revelada después del sorteo
              </p>
              <code className="mt-2 block break-all rounded-xl bg-white px-3 py-2 font-mono text-[11px] text-brand-800">
                4d8f1a6c9b2e7f3a5c0d8b4e1f6a9c2d5b8e1f4a7c0d3b6e9f2a5c8d1b4e7f0a
              </code>
            </div>
            <p className="text-xs text-ink-400">
              Los hashes coinciden → el resultado no fue tocado.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
