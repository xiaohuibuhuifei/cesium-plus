import type { ExampleMeta } from './types.js';

import { captureExample } from './capture/meta.js';
import { coordinatesExample } from './coordinates/meta.js';
import { pluginBasicExample } from './plugin-basic/meta.js';
import { quickStartExample } from './quick-start/meta.js';

export const exampleCatalog: readonly ExampleMeta[] = [
  quickStartExample,
  coordinatesExample,
  captureExample,
  pluginBasicExample,
];

export const exampleTags: readonly string[] = Array.from(
  new Set(exampleCatalog.flatMap((example) => example.tags)),
);

export function getExamplePath(slug: string): string {
  return `/examples/${slug}`;
}

export function findExampleBySlug(slug: string): ExampleMeta | undefined {
  return exampleCatalog.find((example) => example.slug === slug);
}

export function normalizeExampleTag(tag: unknown): string | undefined {
  return typeof tag === 'string' && exampleTags.includes(tag) ? tag : undefined;
}
