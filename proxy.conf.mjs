// proxy.conf.mjs
export default {
  '/api': {
    target: 'http://192.168.1.39:5000',
    secure: false,
    changeOrigin: true,
    bypass(req) {
      if (req.url.endsWith('.json')) return req.url;  // ✅ static file
    }
  }
};