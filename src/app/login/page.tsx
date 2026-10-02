import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { auth, signIn } from "@/auth";
import { isDemoMode } from "@/lib/instagram";
import { InstagramIcon } from "@/components/instagram-icon";
import { Badge, Button, Card } from "@/components/ui";

const FEATURES = [
  "Leé tus historias y publicaciones y elegí sobre cuál sortear",
  "Definí reglas: sticker de pregunta, menciones, like, seguir, guardar",
  "Sorteo con semilla criptográfica y hash público verificable",
];

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const demo = isDemoMode();

  return (
    <div className="grid items-center gap-12 py-8 lg:grid-cols-2">
      <div>
        <Badge tone="brand">
          <Sparkles className="size-3.5" />
          Sorteos sobre Instagram
        </Badge>

        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
          Sorteá entre quienes
          <span className="block text-brand-600">respondieron tu historia</span>
        </h1>

        <p className="mt-4 max-w-lg text-ink-500">
          IGSorteos lee tus publicaciones e historias, Arma la lista de
          participantes según las reglas que definís y sortea de forma
          verificable y sin manipulable.
        </p>

        <ul className="mt-8 space-y-3">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-ink-600">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
              {feature}
            </li>
          ))}
        </ul>

        {demo ? (
          <p className="mt-8 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800 ring-1 ring-amber-100">
            Estás en <strong>modo demo</strong>: se usan datos simulados. Cuando
            tengas la app de Meta aprobada, cambiá{" "}
            <code className="font-mono">AUTH_DEMO_MODE=false</code> para conectar
            con Instagram real.
          </p>
        ) : null}
      </div>

      <Card className="p-8">
        <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-brand-600 text-white">
          <InstagramIcon className="size-6" />
        </div>

        <h2 className="text-xl font-semibold text-ink-900">Entrar</h2>
        <p className="mt-1 text-sm text-ink-500">
          Necesitamos acceso a tu cuenta para leer tus historias y publicaciones.
        </p>

        <form action={async () => {"use server"; await signIn("instagram", { redirectTo: "/dashboard" });}} className="mt-6">
          <Button size="lg" className="w-full" type="submit">
            <InstagramIcon className="size-5" />
            Continuar con Instagram
          </Button>
        </form>

        {demo ? (
          <form
            action={async () => {
              "use server";
              await signIn("demo", { redirectTo: "/dashboard" });
            }}
            className="mt-3"
          >
            <Button variant="secondary" size="lg" className="w-full" type="submit">
              <Sparkles className="size-5" />
              Entrar en modo demo
            </Button>
          </form>
        ) : null}

        <div className="mt-6 flex items-start gap-2 text-xs text-ink-400">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p>
            Solo pedimos permisos de lectura sobre tu contenido propio. No
            publicamos ni modificamos nada en tu cuenta.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          <Link href="/" className="hover:text-brand-600">
            Volver al inicio
          </Link>
        </p>
      </Card>
    </div>
  );
}
