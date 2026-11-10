
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 855, hash: 'f4dc1bfabebcf9cacc0e16161256f80a9c082bbeb827b7b6ee1d54bb08e834d0', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1017, hash: 'd1faad191f1c2f4337909b8d98bceb436509a268737c97c966353fd5ec326ed0', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 90861, hash: 'abe86a690418f6995da21797e0582efa6e8818c7781f01a774a4863e3d4b2232', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-6ZTYEH7A.css': {size: 252, hash: '1dQpmj+TIeE', text: () => import('./assets-chunks/styles-6ZTYEH7A_css.mjs').then(m => m.default)}
  },
};
