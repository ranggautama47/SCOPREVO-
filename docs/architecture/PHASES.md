# PHASES.md — SCOPREVO Build Roadmap

Ground rule: setiap hari harus berakhir dengan sesuatu yang **berjalan dan bisa didemokan**, bukan setengah jadi. Kalau satu fitur mengancam tenggat, potong scope-nya, jangan mundurkan jadwal.

Konteks: dibangun untuk **DevHandal 2026 Batch 2 (Codepolitan x Tencent EdgeOne)** — Misi 2 mensyaratkan artikel/video review teknis berdasarkan project yang benar-benar live di EdgeOne Makers, jadi app ini harus benar-benar ter-deploy, bukan cuma demo lokal.

---

## Day 0 — Platform Verification (WAJIB sebelum Day 1)

Ini belum pernah dijalankan sebelumnya — dua hal ini harus dikonfirmasi dulu sebelum menulis kode produksi, supaya tidak membangun di atas asumsi yang salah:

- [ ] Buka EdgeOne Makers console, buat project percobaan kosong, konfirmasi: apakah "Root Directory" itu satu path per project (seperti Vercel), atau bisa lebih dari satu?
- [ ] Deploy versi minimal Express (`cloud-functions/express/[[default]].js`) yang connect ke Supabase Postgres via pooled connection string (Supavisor), lakukan satu write dan satu read, pastikan tidak ada connection exhaustion di cold start.
- [ ] Konfirmasi struktur folder final berdasarkan hasil verifikasi di atas (lihat catatan struktur di README.md).

**Exit criteria:** ada satu endpoint Express yang live di EdgeOne dan berhasil baca/tulis ke Supabase, dari deployment nyata bukan localhost.

---

## Day 1 — Foundation ✅ COMPLETE (2026-08-22)
- [x] Setup project: Vue 3 + Vite (frontend) + Express.js + TypeScript (backend), database Supabase PostgreSQL
- [x] Auth sederhana untuk agency/freelancer (email/password, JWT)
- [x] CRUD Project (nama, client name, total allowed revisions)
- [ ] Skeleton halaman dashboard project list — **belum dikerjakan, ini scope Gemini (frontend), belum dimulai**

**Exit criteria (REVISED — lihat catatan di bawah):** bisa register, bisa login, bisa bikin project baru, muncul di list.

**Catatan revisi exit criteria:** Versi sebelumnya mensyaratkan *"sudah berjalan di deployment EdgeOne, bukan cuma lokal."* Ini direvisi setelah keputusan tim (Kimi QA + GPT PM, 2026-08-22): **Day 0 (EdgeOne verification) tidak memblokir closure Day 1.** Day 1 backend sudah PASS berdasarkan 18/18 test terhadap Supabase PostgreSQL asli secara lokal, dengan bukti request/response actual. EdgeOne deployment tetap berjalan sebagai gate terpisah (lihat Day 0), bukan syarat Day 1 selesai. Ini mencegah backend coding tersandera oleh verifikasi platform yang independen.

**Bukti closure Day 1 (ringkasan):**
- Backend: Express + TypeScript + `pg` (raw SQL, no ORM) + Supabase PostgreSQL — connected via Session Pooler (local dev)
- JWT Bearer auth, bcrypt password hashing, Zod validation
- Full Project CRUD, no-cascade-delete guard (`PROJECT_NOT_EMPTY`)
- Ownership isolation: cross-account access returns `404 NOT_FOUND` (bukan 403 — keputusan sadar untuk tidak membocorkan keberadaan resource orang lain)
- Error contract `{error:{code,message}}` konsisten di semua endpoint
- 18/18 integration test PASS terhadap database Supabase asli, dengan bukti request/response mentah, diverifikasi independen (Kimi sampling protocol)
- Schema DB diverifikasi manual cocok 100% dengan DATABASE.md (4 tabel, CHECK constraint `reason` aktif, FK benar)

**Belum dikerjakan (bukan blocker Day 2, tapi jangan lupa):**
- Frontend skeleton dashboard (Gemini, belum mulai)
- `git init` untuk backend — **wajib sebelum Day 2 dimulai**, belum dikonfirmasi selesai
- Day 0 EdgeOne verification — pending, berjalan paralel

---

## Day 2 — Revision Engine (inti produk) ✅ COMPLETE (2026-08-24)
- [x] Form input: paste teks feedback mentah
- [x] Integrasi AI (LLM call) → prompt terstruktur, output JSON wajib
- [x] Validasi schema JSON dari AI sebelum disimpan
- [x] Simpan sebagai RevisionBatch + RevisionItem
- [x] Google primary routing + OpenRouter fallback
- [x] NEEDS_REVIEW schema support & reason enforcement

**Status:** Prompt eksekusi untuk KiloCode sudah disusun GPT (2026-08-22), scope dikunci ketat: hanya `IN_SCOPE`/`OUT_OF_SCOPE` untuk Day 2, transaction-safe (rollback kalau RevisionItem gagal insert), 16 test case termasuk regresi Day 1. **Eksekusi selesai dan diverifikasi 2026-08-24: 18/18 test PASS.**

**Catatan sengaja (bukan celah):** Day 2 tidak menginstruksikan LLM untuk pernah mengeluarkan `NEEDS_REVIEW` — itu murni scope Day 3. Skema DB (`scope_status` enum, `CHECK` constraint `reason_required_unless_in_scope`) sudah mendukung ketiga nilai sejak awal, jadi tidak ada perubahan schema yang dibutuhkan saat Day 3 mengaktifkan `NEEDS_REVIEW` nanti.

**Exit criteria:** paste teks WhatsApp contoh → dapat list item terstruktur di database Supabase, bukan cuma tampil di layar. ✅ **TERCAPAI**

**Contoh prompt output yang diharapkan:**
```json
{
  "summary": "Client requested UI refinements for the landing page.",
  "items": [
    { "description": "Reduce hero visual density", "scope": "IN_SCOPE" },
    { "description": "Increase CTA button size", "scope": "IN_SCOPE" },
    { "description": "Add dark mode", "scope": "OUT_OF_SCOPE",
      "reason": "New feature not related to requested UI refinement" }
  ]
}

---

## Day 3 — Scope Detection & Quota ✅ COMPLETE (2026-08-26)
- [x] Klasifikasi tiga status: `IN_SCOPE`, `OUT_OF_SCOPE`, `NEEDS_REVIEW` (bukan cuma boolean — beri AI ruang untuk tidak yakin)
- [x] Setiap item OUT_OF_SCOPE dan NEEDS_REVIEW wajib punya `reason` (ditegakkan di DB via CHECK constraint, lihat DATABASE.md)
- [x] Hitung revision quota otomatis (used / allowed) tiap kali batch baru berstatus APPROVED
- [x] UI progress bar quota (2/3 used)

**Exit criteria:** submit feedback baru → quota counter TIDAK naik sampai batch di-APPROVE oleh klien; item ambigu masuk NEEDS_REVIEW bukan dipaksa IN/OUT. ✅ TERCAPAI

**Kenapa NEEDS_REVIEW penting:** kalau AI salah klasifikasi item ambigu jadi IN_SCOPE secara percaya diri, itu terlihat "ngawur" di depan pembaca artikel/reviewer. Status ketiga ini bikin produk terasa lebih jujur dan profesional.

**Bukti closure Day 3:**
- Backend: 27/27 tests PASS (Day 3 logic) + 34/34 API readiness tests
- Frontend: M3.1-M3.4 CLOSED, vue-tsc 0 errors
- Scope classification: IN_SCOPE/OUT_OF_SCOPE/NEEDS_REVIEW badges rendered correctly
- Reason enforcement: Reason box only renders for OUT_OF_SCOPE & NEEDS_REVIEW with non-empty reason
- Quota logic: Quota DOES NOT consume on DRAFT submit; only on APPROVED (verified by Kimi QA)
- Error handling: 401 interceptor, 409 QUOTA_EXHAUSTED, 422 AI_PROCESSING_FAILED, 500/504 with retry functionality
- Empty states: Implemented for batches and items lists
---

## Day 4 — Client Portal (Magic Link) ✅ COMPLETE (2026-08-29)
- [x] Generate token unik per RevisionBatch → `/portal/:token`
- [x] Halaman publik (tanpa login): tampilkan checklist, quota, badge IN/OUT/NEEDS_REVIEW
- [x] Tombol "Confirm Revision Scope" → update status batch jadi APPROVED

**Exit criteria:** buka link di incognito tanpa login → checklist dan quota muncul dengan benar, tombol confirm berfungsi, dan quota di sisi freelancer langsung ter-update. ✅ TERCAPAI

**Bukti closure Day 4 (Playwright E2E 13-Step PASS):**
- M4.1 (Freelancer Share Action): Modal generate magic link, copy-to-clipboard, dan transisi status DRAFT → PENDING_CONFIRMATION berfungsi.
- M4.2 (Client Portal View): Route publik `/portal/:token` render tanpa sidebar, menampilkan quota row, scope badges, dan tombol CONFIRM.
- Backend B4: 3 endpoint portal (`PATCH /share`, `GET /portal/:token`, `POST /confirm`) live dan mematuhi error contract (409 INVALID_STATE, 404 NOT_FOUND).
- Dynamic Quota: `usedRevisions` tetap 0 saat DRAFT, naik menjadi 1 secara otomatis pasca-APPROVED (tanpa optimistic UI di frontend).
- Security: Cross-account isolation terbukti (Context C mendapat "Batch not found or access denied", bukan 403).
- Idempotency: proteksi terbukti via API (confirm kedua → 409 INVALID_STATE);
  step 11 E2E adalah no-op dan TIDAK dihitung sebagai bukti otomatis —
  manual re-check dijadwalkan wajib di Day 5.

**Catatan kejujuran verifikasi (audit independen Claude, 2026-08-29):**
- Assertion quota UI di E2E masih string-grep lemah; penguatan (exact string
  + scope badges) WAJIB masuk suite regresi Day 5.
- Known limitations (deliberate MVP tradeoffs): magicToken tidak expire &
  tidak ada rate limiting di endpoint portal — deferred ke backlog, wajib
  disebut eksplisit di artikel DevHandal.

---

## Day 5 — UX Polish
- [ ] Dashboard: riwayat revision batch per project
- [ ] Loading state saat AI memproses
- [ ] Error handling (AI gagal parsing, input kosong, dll)
- [ ] Empty state (project baru tanpa revision)
- [ ] Responsive check (mobile — klien sering buka link dari HP)

**Exit criteria:** tidak ada layar kosong/blank tanpa penjelasan di seluruh alur utama.

---

## Day 6 — Case Study (bukti dampak, WAJIB diukur nyata)
- [ ] **BLOCKER belum selesai:** cari 1 contoh feedback nyata dari freelancer/agency kenalan — sampai hari ini belum ada nama konkret. Ini harus selesai sebelum Day 6 dimulai, idealnya dicari paralel sejak Day 1–2, bukan ditunda sampai Day 6.
- [ ] Ukur waktu manual: berapa menit orang biasa butuh untuk baca & susun feedback itu jadi checklist
- [ ] Ukur waktu SCOPREVO: dari paste sampai checklist keluar
- [ ] Screenshot before/after
- [ ] Susun angka jadi tabel perbandingan — **jangan pakai angka karangan**

**Exit criteria:** ada satu cerita before/after nyata, dengan angka yang bisa dipertanggungjawabkan kalau ditanya pembaca artikel.

---

## Day 7 — Deployment, Artikel & Submission DevHandal
- [ ] Deploy final ke EdgeOne Makers, pastikan live dan stabil
- [ ] Buat demo account / data contoh
- [ ] Tulis artikel/video review teknis: "Building SCOPREVO on EdgeOne Makers" (syarat Misi 2 — minimal 500 kata / 3 menit, berdasarkan project yang benar-benar published)
- [ ] Post X Misi 1 (pamer project yang sudah dibangun di EdgeOne)
- [ ] Post X kedua untuk promosi artikel (syarat Misi 2 poin 2)
- [ ] Submit sesuai form DevHandal — cek dua-duanya: link artikel/video DAN link post X

**Exit criteria:** app live, artikel published, kedua link (artikel + post X promosi) sudah diisi di form submission DevHandal.

---

## Roadmap Fitur Lanjutan (eksplisit ditunda, bukan dibuang)

| Versi | Fitur |
|---|---|
| V1.1 | Upload PDF / DOCX |
| V1.2 | Screenshot / annotated design → Vision AI |
| V2 | Integrasi WhatsApp langsung, voice note, email |

Alasan ditunda: setiap format tambahan (parser, OCR, vision) adalah proyek tersendiri yang tidak berhubungan langsung dengan value inti — dan bisa menghabiskan waktu berhari-hari untuk debug format-specific issues, bukan untuk memperkuat core product.