# ORION PRO

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-%23EA4AAA.svg?style=flat&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Oriondevcore)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

AI-powered customer experience platform for South African businesses — WhatsApp receptionist, appointment booking, smart routing, and multi-industry automation. Serving medical, hospitality, legal, and retail clients in KwaZulu-Natal.

## What It Does

**Naledi** is an AI receptionist that lives on WhatsApp. She answers customer questions, books appointments, handles FAQs, escalates to humans when needed, and works 24/7 — in English and isiZulu. She integrates with your existing practice management tools and never drops a lead.

## Industries

- **Medical** — Doctor bookings, patient intake, prescription refill requests
- **Hospitality** — Room booking, concierge, check-in/out, guest support
- **Legal** — Case inquiry routing, consultation booking, document requests
- **Retail & Restaurants** — Table bookings, order status, hours and directions

## Tech Stack

- **Frontend:** Cloudflare Pages, HTML/CSS/JS (dark theme + gold accent)
- **API:** Hono (Cloudflare Workers)
- **Database:** Cloudflare D1 (SQLite)
- **AI:** SiliconFlow + Cloudflare Workers AI
- **Messaging:** WhatsApp Business API (Meta Cloud API)
- **Deploy:** Git push → Cloudflare Pages auto-deploy

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | Main landing page (hero → pricing → features → CTA) |
| `pages/` | Industry landing pages (doctors, salons, restaurants, lawyers, accountants) |
| `onboard/` | Onboarding forms (practitioner, medical-rep, agentic-chat) |
| `functions/` | Cloudflare Pages Functions (`/naledi/*`, `/api/yoco-checkout`) |
| `css/` | Design system (variables, components, animations) |
| `bp-kit/` | Business partner (BP) enablement kit |

## Sponsorship

If ORION PRO helps your business, consider [sponsoring the project on GitHub](https://github.com/sponsors/Oriondevcore). Your support helps us build open-source AI tools for African businesses.

## License

MIT
