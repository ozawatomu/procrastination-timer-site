import { hosting } from '../site.config.mjs';

export const route = (path: string) => `${hosting.base}${path}`;

export const routes = ['/', '/privacy/', '/support/', '/404.html'].map(route);
