---
description: Reglas del sitio estático solecuida.com
paths:
  - "web/**"
---

# Sitio web

- Sitio estático sin build ni dependencias; diseño de carta editorial (Fraunces, Newsreader, Courier Prime, Caveat). La app tiene otro diseño.
- La tía Sole está viva y es cuidadora: nunca "en memoria". La Nonó (la mamá del fundador, fallecida) no se menciona en la app.
- `--tinta-tenue` mantiene al menos 4.5:1 sobre `--papel` y `--papel-hueco` en ambos temas; no se aclara.
- No se agrega botón de WhatsApp ni ficha de Google Business.
- Una sola llamada a la acción principal por página ("Probar Sole"), después del primer párrafo y fija en el celular.
- Título y meta descripción únicos por página; un solo `<h1>`; JSON-LD `Organization`, `WebSite` y `FAQPage` (nunca `LocalBusiness`).
- Nunca escribir que Sole detecta, diagnostica, predice, monitorea clínicamente, mejora la salud o reduce el estrés. Sin logos ni nombres de organizaciones sin permiso escrito.
- Analítica: solo Vercel Web Analytics (sin cookies) y Google Search Console. Nunca GA4.
- `pnpm -C app test tests/unit/web-site.test.ts` revisa estas reglas.
