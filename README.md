<div align="center">

<img src="frontend/public/asset/logo.png" alt="SCOPREVO Logo" width="120" height="120" />

# SCOPREVO

**AI-powered Scope & Revision Intelligence.**

**🌐 Language / Bahasa:** **🇮🇩 Indonesia** · [🇬🇧 English](./README.en.md)

[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![EdgeOne](https://img.shields.io/badge/EdgeOne-Makers-0052d9?style=for-the-badge&logo=tencentqq&logoColor=white)](https://edgeone.ai/)

[![DevHandal 2026](https://img.shields.io/badge/DevHandal-2026%20Batch%202-ff6b35?style=for-the-badge)](https://devhandal.codepolitan.com/)
[![License](https://img.shields.io/badge/License-MIT-1A1A1A?style=for-the-badge)](./LICENSE)
[![Status](https://img.shields.io/badge/Status-Live-2A9D8F?style=for-the-badge)](https://scoprevo.edgeone.dev/)

> Ubah feedback klien yang berantakan menjadi revisi yang jelas — dan ketahui mana yang termasuk atau di luar scope proyek.

</div>

---

> **Catatan penamaan/brand:** produk ini sebelumnya bernama ScopeGuard; SCOPREVO (Scope + Revision) adalah nama saat ini dan seterusnya. Identitas visual (logo, sistem warna, simbol brand) secara sengaja **tidak dikunci di dokumen ini** — kepemilikan tersebut berada pada UI/UX Lead sesuai pembagian peran multi-AI (dokumen ini, sebagai output Product/System Architect, hanya mencakup scope, data model, AI contract, dan roadmap).

SCOPREVO mengubah feedback klien yang berantakan (chat WhatsApp, email) menjadi checklist revisi yang terstruktur, sekaligus secara otomatis mendeteksi permintaan mana yang masih termasuk scope proyek dan mana yang berpotensi menjadi pekerjaan tambahan (out of scope).

---

## 📌 Daftar Isi

- [Preview Aplikasi](#-preview-aplikasi)
- [Masalah](#-masalah)
- [Solusi](#-solusi)
- [Kenapa ini, bukan PM tool generik](#-kenapa-ini-bukan-pm-tool-generik)
- [Value inti dalam satu kalimat](#-value-inti-dalam-satu-kalimat)
- [Cakupan MVP (yang termasuk)](#-cakupan-mvp-yang-termasuk)
- [Ditunda secara eksplisit (tidak masuk MVP)](#-ditunda-secara-eksplisit-tidak-masuk-mvp)
- [Mengukur Dampak (wajib untuk case study)](#-mengukur-dampak-wajib-untuk-case-study)
- [Platform & Tech Stack](#-platform--tech-stack)
- [Dokumentasi dalam Set Ini](#-dokumentasi-dalam-set-ini)

---

## 📸 Preview Aplikasi

<table>
<tr>
<td width="50%">

**Dashboard**
<img src="docs/screenshots/dashboard.png" alt="Dashboard SCOPREVO — ringkasan proyek aktif, revisi terpakai, revisi tersisa, dan konfirmasi tertunda" width="100%" />

</td>
<td width="50%">

**Proyek**
<img src="docs/screenshots/projects.png" alt="Halaman daftar proyek SCOPREVO" width="100%" />

</td>
</tr>
<tr>
<td width="50%">

**Riwayat**
<img src="docs/screenshots/history.png" alt="Halaman riwayat revision batch SCOPREVO" width="100%" />

</td>
<td width="50%">

**Pengaturan**
<img src="docs/screenshots/settings.png" alt="Halaman pengaturan SCOPREVO" width="100%" />

</td>
</tr>
</table>

> **Catatan:** screenshot Dashboard di atas sudah asli. Tiga slot lain (Proyek, Riwayat, Pengaturan) menunggu file gambar — lihat instruksi di bawah dokumen ini untuk cara mengisinya.

---

## 🎯 Masalah

Freelancer dan agency kecil di Indonesia kehilangan waktu dan uang karena:
1. Feedback klien tersebar dan tidak terstruktur (WhatsApp, email, campur aduk dengan basa-basi).
2. Tidak ada batas jelas antara "revisi yang disepakati" dan "request baru yang harusnya kena biaya tambahan" → scope creep.
3. Klien enggan pakai tools project management berat (Jira/Trello/Asana) yang butuh onboarding.

## 💡 Solusi

Satu alur inti, bukan aplikasi serba bisa:
Client sends messy feedback (text)
↓
AI extracts & classifies
↓
Structured revision checklist
(IN_SCOPE / OUT_OF_SCOPE / NEEDS_REVIEW)
↓
Revision quota tracked (2/3 used)
↓
Magic link sent to client
↓
Client confirms — no login needed


## 🧭 Kenapa ini, bukan PM tool generik

Moxie, Plutio, dan Odoo adalah platform all-in-one (invoicing, CRM, scheduling, contracts, dll). Keberadaan mereka justru memvalidasi bahwa freelancer butuh business tooling — tapi tak satupun fokus mendalam pada satu masalah spesifik: **mengekstrak dan mengklasifikasi revisi dari feedback berantakan, lalu melindungi scope proyek secara real-time.** SCOPREVO sengaja sempit: satu workflow, dikerjakan tuntas.

## ✨ Value inti dalam satu kalimat

> "AI mengubah feedback klien yang tidak terstruktur menjadi checklist revisi yang bisa ditindaklanjuti, dan melindungi freelancer dari scope creep."

## ✅ Cakupan MVP (yang termasuk)

- Input: paste teks mentah (WhatsApp/email copy-paste)
- AI extraction → structured JSON (item, kategori, klasifikasi scope, alasan)
- Revision quota tracking per project
- Magic link client portal (tanpa login)
- Client sign-off / confirm

##  🚫 Ditunda secara eksplisit (tidak masuk MVP)

- Integrasi WhatsApp Business API
- Transkripsi voice note
- OCR / PDF / DOCX / XLSX ingestion
- Payment/billing
- Team roles / RBAC
- Dashboard analytics

Fitur-fitur ini sah untuk Phase 2/3 — sengaja ditunda supaya MVP bisa dirilis dan didemokan dengan bersih.

These are legitimate Phase 2/3 features — deferred so the MVP ships and demos cleanly.

## 📊 Mengukur Dampak (wajib untuk case study)

Setiap klaim harus berasal dari pengukuran nyata, bukan estimasi marketing:

| Metrik | Manual | SCOPREVO |
|---|---|---|
| Waktu memahami feedback | ~12–30 menit | ~10–30 detik (AI) |
| Request ambigu yang tertangkap | Sering terlewat | Di-flag sebagai NEEDS_REVIEW |
| Request di luar scope yang tertangkap | Sering terlewat | Langsung di-flag dengan alasan |

**Status: belum ada beta tester nyata yang teridentifikasi.** Ini risiko terbuka — case study before/after butuh sampel feedback asli dari kenalan freelancer/agency, bukan yang dibuat-buat. Jangan tulis angka case study sampai ini terselesaikan.

## 🛠️ Platform & Tech Stack

SCOPREVO dibangun untuk **DevHandal 2026 Batch 2 (Codepolitan x Tencent EdgeOne)** — Misi 2 mensyaratkan review teknis / tutorial berdasarkan project yang benar-benar published di EdgeOne Makers, jadi aplikasinya harus live di platform tersebut (bukan cuma dideskripsikan).

**Stack yang dikunci:**

| Layer | Pilihan |
|---|---|
| Frontend | Vue 3 + Vite + TypeScript |
| Backend | Express.js + TypeScript |
| Deployment / Hosting | Tencent EdgeOne Makers |
| Serverless Runtime | EdgeOne Cloud Functions (Express mounted sebagai function handler) |
| Database | PostgreSQL |
| Database Provider | Supabase |
| AI | EdgeOne Models / external LLM API |
| Opsional | EdgeOne KV (cache/session saja, bukan primary storage), EdgeOne Blob, EdgeOne Observability |

**Kenapa bukan KV/Blob sebagai primary storage:** Data model SCOPREVO inherently relasional (Account → Project → RevisionBatch → RevisionItem, dengan foreign key, enum, dan kalkulasi quota yang bergantung pada filtered count). Layer KV/Blob native EdgeOne cocok untuk cache, session token, dan konfigurasi sederhana — bukan untuk bentuk data ini. Karena itu dipakai PostgreSQL via Supabase.

**Catatan struktur deployment (belum diverifikasi — konfirmasi di console EdgeOne sebelum membangun):** pemahaman saat ini adalah satu EdgeOne project dengan satu root directory, di mana backend Express berada di dalam folder `cloud-functions/` bersamaan dengan source Vue frontend (mengikuti `express-template` milik EdgeOne), bukan dua folder `apps/web` + `apps/api` dengan root terpisah dalam satu project. Kalau memang ingin dua deployment sepenuhnya terpisah, itu membutuhkan dua EdgeOne project yang menunjuk ke dua subdirektori — konfirmasi ini di console sebelum mengunci layout folder.

## 📚 Dokumentasi dalam Set Ini

| Dokumen | Deskripsi |
|---|---|
| 📘 [`README.md`](./README.md) | File ini — overview project (Bahasa Indonesia) |
| 📘 [`README.en.md`](./README.en.md) | Versi Bahasa Inggris |
| 🗺️ [`PHASES.md`](./PHASES.md) | Roadmap build, hari per hari |
| 🗄️ [`DATABASE.md`](./DATABASE.md) | Relational data model (ERD + schema) |
| 📐 [`UML.md`](./UML.md) | Use case, sequence, dan state diagram |
| 🏗️ [`APPLICATION_ARCHITECTURE.md`](./APPLICATION_ARCHITECTURE.md) | Layered architecture + API contract |
| 🎨 [`DESIGN_SYSTEM_BRUTALIST.md`](./DESIGN_SYSTEM_BRUTALIST.md) | Neo-Brutalist design system v2.1 |

---

<div align="center">

**Dibangun dengan** ❤️ **untuk DevHandal 2026 Batch 2**

[![Codepolitan](https://img.shields.io/badge/Codepolitan-x%20Tencent%20EdgeOne-1A1A1A?style=flat-square)](https://codepolitan.com/)
[![EdgeOne Makers](https://img.shields.io/badge/Powered%20by-EdgeOne%20Makers-006D77?style=flat-square)](https://edgeone.ai/)

</div>