import type { NodePackageInfo } from "./detectStack";

export interface Framework {
  name: string;
  url: string;
}

/**
 * Well-known packages worth calling out in a README, keyed by package name.
 * Order matters: frameworks first, then tooling, so the list reads naturally.
 */
const KNOWN_PACKAGES: [pkg: string, framework: Framework][] = [
  // App frameworks
  ["next", { name: "Next.js", url: "https://nextjs.org" }],
  ["nuxt", { name: "Nuxt", url: "https://nuxt.com" }],
  ["@remix-run/react", { name: "Remix", url: "https://remix.run" }],
  ["@sveltejs/kit", { name: "SvelteKit", url: "https://svelte.dev/docs/kit" }],
  ["astro", { name: "Astro", url: "https://astro.build" }],
  ["react", { name: "React", url: "https://react.dev" }],
  ["vue", { name: "Vue", url: "https://vuejs.org" }],
  ["svelte", { name: "Svelte", url: "https://svelte.dev" }],
  ["@angular/core", { name: "Angular", url: "https://angular.dev" }],
  ["solid-js", { name: "Solid", url: "https://www.solidjs.com" }],
  ["react-native", { name: "React Native", url: "https://reactnative.dev" }],
  ["expo", { name: "Expo", url: "https://expo.dev" }],
  ["electron", { name: "Electron", url: "https://www.electronjs.org" }],
  // Servers
  ["express", { name: "Express", url: "https://expressjs.com" }],
  ["fastify", { name: "Fastify", url: "https://fastify.dev" }],
  ["@nestjs/core", { name: "NestJS", url: "https://nestjs.com" }],
  ["hono", { name: "Hono", url: "https://hono.dev" }],
  ["koa", { name: "Koa", url: "https://koajs.com" }],
  // Data
  ["@prisma/client", { name: "Prisma", url: "https://www.prisma.io" }],
  ["drizzle-orm", { name: "Drizzle ORM", url: "https://orm.drizzle.team" }],
  ["mongoose", { name: "Mongoose", url: "https://mongoosejs.com" }],
  ["typeorm", { name: "TypeORM", url: "https://typeorm.io" }],
  ["graphql", { name: "GraphQL", url: "https://graphql.org" }],
  ["@tanstack/react-query", { name: "TanStack Query", url: "https://tanstack.com/query" }],
  ["@reduxjs/toolkit", { name: "Redux Toolkit", url: "https://redux-toolkit.js.org" }],
  ["zustand", { name: "Zustand", url: "https://zustand.docs.pmnd.rs" }],
  // Styling and build
  ["tailwindcss", { name: "Tailwind CSS", url: "https://tailwindcss.com" }],
  ["vite", { name: "Vite", url: "https://vite.dev" }],
  ["typescript", { name: "TypeScript", url: "https://www.typescriptlang.org" }],
  // Testing
  ["vitest", { name: "Vitest", url: "https://vitest.dev" }],
  ["jest", { name: "Jest", url: "https://jestjs.io" }],
  ["@playwright/test", { name: "Playwright", url: "https://playwright.dev" }],
  ["cypress", { name: "Cypress", url: "https://www.cypress.io" }],
  ["storybook", { name: "Storybook", url: "https://storybook.js.org" }],
];

/** Notable frameworks and tools found in package.json dependencies. */
export function detectFrameworks(packageInfo: NodePackageInfo | null): Framework[] {
  if (!packageInfo) return [];

  const installed = new Set([
    ...packageInfo.dependencies,
    ...packageInfo.devDependencies,
  ]);

  return KNOWN_PACKAGES.filter(([pkg]) => installed.has(pkg)).map(
    ([, framework]) => framework,
  );
}
