import { randomUUID } from "node:crypto";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";

import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/instagram";

type IgProfile = {
  igUsername?: string | null;
};

const providers: NextAuthConfig["providers"] = [];

if (isDemoMode()) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Instagram (modo demo)",
      credentials: {},
      async authorize() {
        const email = "demo@igsorteos.app";
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            id: randomUUID(),
            email,
            name: "Tu Marca",
            igId: "17841400000000001",
            igUsername: "tu.marca",
            igAccessToken: "demo-token",
            igConnectedAt: new Date(),
          },
        });
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  );
}

if (process.env.AUTH_INSTAGRAM_ID && process.env.AUTH_INSTAGRAM_SECRET) {
  providers.push(
    Facebook({
      id: "instagram",
      name: "Instagram",
      authorization: {
        params: {
          scope:
            "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement",
        },
      },
      async profile(account) {
        const { getInstagramProvider } = await import("@/lib/instagram");
        const provider = await getInstagramProvider();
        const ig = await provider.getAccount(account.access_token ?? "");

        return {
          id: ig.igId,
          name: ig.fullName,
          email: null,
          image: ig.profilePicUrl,
          igUsername: ig.username,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers,
  callbacks: {
    /**
     * Sincroniza la cuenta de Instagram con nuestra tabla. El id que devuelve
     * el perfil de Meta es el igId, así que lo usamos como clave natural.
     */
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "demo") return true;

      const igId = String(profile?.sub ?? user.id);
      const igUsername = (profile as IgProfile | undefined)?.igUsername ?? null;

      await prisma.user.upsert({
        where: { igId },
        update: {
          name: user.name ?? igUsername,
          image: user.image ?? null,
          igUsername,
          igAccessToken: account.access_token ?? null,
          igTokenExpiresAt: account.expires_at
            ? new Date(account.expires_at * 1000)
            : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          igConnectedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          name: user.name ?? igUsername,
          image: user.image ?? null,
          igId,
          igUsername,
          igAccessToken: account.access_token ?? null,
          igTokenExpiresAt: account.expires_at
            ? new Date(account.expires_at * 1000)
            : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          igConnectedAt: new Date(),
        },
      });

      return true;
    },

    async jwt({ token, user, account }) {
      if (!user?.id) return token;

      // Login con demo: el id ya es el de nuestra tabla.
      if (!account || account.provider === "demo") {
        token.sub = user.id;
        return token;
      }

      // Login con Instagram: resolvemos el id local a partir del igId.
      const igId = String(user.id);
      const local = await prisma.user.findUnique({ where: { igId } });
      token.sub = local?.id ?? user.id ?? null;
      return token;
    },

    async session({ session, token }) {
      if (!token.sub) return session;

      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          igUsername: true,
          igId: true,
        },
      });

      if (user) {
        session.user.id = user.id;
        session.user.igUsername = user.igUsername;
        session.user.igId = user.igId;
      }

      return session;
    },
  },
});
