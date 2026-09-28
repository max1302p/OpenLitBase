import { cors } from 'hono/cors'

const EXTENSION_ORIGIN = /^(chrome-extension|moz-extension):\/\/[\w-]+$/

/**
 * CORS nur für Browser-Extensions. Bewusst ohne `credentials`: die Extension meldet sich per
 * API-Token an; Cookies der Web-Sitzung sollen fremden Extensions nicht zur Verfügung stehen.
 * Web-App und Word-Add-in laufen auf derselben Origin und brauchen kein CORS.
 */
export const extensionCors = cors({
  origin: (origin) => (EXTENSION_ORIGIN.test(origin) ? origin : null),
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  maxAge: 600,
})
