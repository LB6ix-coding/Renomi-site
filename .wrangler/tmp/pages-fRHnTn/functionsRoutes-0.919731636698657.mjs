import { onRequestGet as __api_testi_js_onRequestGet } from "/home/claude/renomi-site/functions/api/testi.js"
import { onRequest as __api_testi_js_onRequest } from "/home/claude/renomi-site/functions/api/testi.js"

export const routes = [
    {
      routePath: "/api/testi",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_testi_js_onRequestGet],
    },
  {
      routePath: "/api/testi",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_testi_js_onRequest],
    },
  ]