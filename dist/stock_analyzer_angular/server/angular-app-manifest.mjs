
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
    'index.csr.html': {size: 855, hash: '3f0c4134a337ded626e779f31405918e29d062f08fb06165f311cee25020800c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1017, hash: 'b7696b3a59b231dd2969c2f82bb1c8e72bccefbab78cd2899569849c63d8cc7e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 46950, hash: '9f4399a1fa537cf7a9700b0a3e2eda49844078664f9b0da2f13e21225927ca20', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-6ZTYEH7A.css': {size: 252, hash: '1dQpmj+TIeE', text: () => import('./assets-chunks/styles-6ZTYEH7A_css.mjs').then(m => m.default)}
  },
};
