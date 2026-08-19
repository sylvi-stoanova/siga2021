# SiGa2021 Digital Systems

Die SiGa2021-Website ist eine mehrsprachige Next.js-Anwendung mit React, TypeScript und Tailwind CSS. Das Projekt ist für ein direktes Deployment von GitHub nach Vercel vorbereitet.

## Technologie

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Node.js 22

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Produktionsprüfung:

```bash
npm run build
npm test
npm run lint
```

## Environment Variables

Kopiere bei Bedarf `.env.example` nach `.env.local`. Die einzige vorbereitete Variable ist:

- `N8N_WEBHOOK_URL`: optionale, ausschließlich serverseitig gelesene URL für den späteren n8n-Webhook.

Ohne diese Variable nimmt der Kontakt-Endpunkt Anfragen im vorbereiteten Demo-Zustand an, sendet sie aber nicht an einen externen Dienst. Niemals echte Secrets unter einem `NEXT_PUBLIC_`-Namen speichern.

## Vercel

- Framework Preset: `Next.js`
- Root Directory: Repository-Root (`./`)
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leer lassen; das Next.js-Preset verwendet intern `.next`
- Node.js Version: `22.x`
- Environment Variable: optional `N8N_WEBHOOK_URL`

Eine `vercel.json` ist nicht erforderlich. Vercel erkennt Next.js über `package.json`. Die frühere Vinext-/Cloudflare-Worker-, D1-/Drizzle- und Sites-Hosting-Konfiguration wurde entfernt, weil sie vom Anwendungscode nicht verwendet wurde.
