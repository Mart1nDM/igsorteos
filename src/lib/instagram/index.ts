import { demoProvider } from "./demo-provider";
import type { InstagramProvider } from "./types";

export function isDemoMode() {
  return process.env.AUTH_DEMO_MODE !== "false";
}

export async function getInstagramProvider(): Promise<InstagramProvider> {
  if (isDemoMode()) {
    return demoProvider;
  }
  const { metaGraphProvider } = await import("./meta-provider");
  return metaGraphProvider;
}

export * from "./types";
export { demoProvider, DEMO_QUESTION } from "./demo-provider";
