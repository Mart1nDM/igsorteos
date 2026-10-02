type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  igUsername: string | null;
  igId: string | null;
};

declare module "@auth/core/types" {
  interface Session {
    user?: SessionUser;
  }

  interface User {
    igUsername?: string | null;
  }
}

export {};
