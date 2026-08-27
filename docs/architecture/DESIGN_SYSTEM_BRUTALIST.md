DESIGN*SYSTEM_BRUTALIST.md — SCOPREVO
Version: v2.1 (Kimi+Gemini approved; GPT ratification informational — non-blocking)
Owner: Kimi (QA/Validation) + Gemini (Frontend Lead)
Status: LOCKED — v2.1 Kimi+Gemini approved (team-level); GPT ratification informational pada sync PM berikutnya — non-blocking
Date: 2026-08-26
Target Stack: Vue 3 + Vite + TypeScript + Tailwind CSS
plain  
 PURPOSE: Dokumen ini adalah System Prompt / Blueprint Desain dan Guardrails ketat bagi AI Agent (Gemini/GPT/Claude) agar saat diminta membuat/merevisi kode Vue/Tailwind, AI tidak berhalusinasi gaya visual, salah warna, atau melanggar hierarki desain.
Design Philosophy
SCOPREVO menggunakan Neo-Brutalism — brutalist yang fungsional, bukan brutalist yang "hancur". Filosofinya:
Honest — tidak menyembunyikan struktur UI
Bold — border tebal, warna kontras, tipografi editorial
Functional — tiap elemen punya tujuan jelas
Playful but disciplined — warna aksen (lavender, yellow) dipakai dengan ketat, tidak "bocor" ke elemen struktural
"Brutalist bukan berarti berantakan. Brutalist berarti berani menunjukkan struktur asli tanpa embel-embel."
Absolute Brutalist Rules (NON-NEGOTIABLE)
Aturan ini mutlak. Tidak boleh dilanggar oleh AI manapun saat generate kode.
Sheets
Rule Tailwind Class Kategori
Zero Radius rounded-none SEMUA elemen (Card, Button, Input, Badge, Modal, Tag)
Thick Borders border-2 border-[#1A1A1A] SEMUA komponen interactive dan card
Hard Offset Shadows ONLY shadow-[4px_4px_0px_0px*#1A1A1A] Hanya Macro Elements: Card, Modal, Primary CTA
No Soft Shadows DILARANG shadow-md, shadow-lg, shadow-sm —
No Gradients DILARANG bg-gradient-_ —
No Blur / Backdrop DILARANG backdrop-blur, blur-_ —
No Rounded Corners DILARANG rounded-_ kecuali rounded-none —
Macro Elements yang boleh pakai hard shadow:
Cards (shadow-[4px_4px_0px_0px_#1A1A1A])
Modals (shadow-[8px_8px_0px_0px_#1A1A1A])
Primary CTA Buttons (shadow-[4px_4px_0px_0px_#1A1A1A])
Micro Elements yang TIDAK boleh pakai shadow:
plain  
 Form inputs
Tags / badges
Inline links
Nav items
Divider lines 3. Unified Color Palette (LOCKED)
3.1 Core Colors
Sheets
Token Hex Tailwind Class Role Usage
canvas #FAFAF9 bg-[#FAFAF9] Main workspace background Area baca teks utama, card background, form background. Alasan: Mencegah kelelahan mata saat user membaca output analisis AI yang panjang.
sage #C9CBA3 bg-[#C9CBA3] Persistent shell Sidebar, page background alternatif
lavender #DCCCFF bg-[#DCCCFF] Secondary accent — highlight Tags kategori, 1 stat card sekunder per view, hover underline link. DISIPLIN KETAT — lihat §3.3
yellow #FDFFB6 bg-[#FDFFB6] Highlight / focus / attention Primary stat card, focus state input, NEEDS_REVIEW badge bg
yellow-warm #FFE1A8 bg-[#FFE1A8] Warm accent Stat card alternatif (jika butuh 2 stat card berbeda)
teal #006D77 bg-[#006D77] Primary action CTA "+ NEW PROJECT", "CONFIRM", primary buttons
black #1A1A1A text-[#1A1A1A], border-[#1A1A1A] Text primary, borders Semua teks, 2px borders, shadow offset
white #FAFAF9 text-[#FAFAF9] Text on dark/bg Teks di atas teal, teks di atas black
red #E63946 bg-[#E63946] Error / danger solid Danger button bg, icon error
green #2A9D8F bg-[#2A9D8F] Success solid Icon success, small dot indicators
draft-gray #E5E7EB bg-[#E5E7EB] Batch status — DRAFT Background badge untuk RevisionBatch status DRAFT. Warna netral, tidak konflik dengan palette existing.
3.2 Semantic Status Badge Colors (Accessibility-First)
Status badge WAJIB menggunakan warna ini untuk memastikan kontras teks aman dibaca (B2B accessibility standard):
Sheets
Status Background Text Border Tailwind Classes
IN_SCOPE #DCFCE7 #166534 #1A1A1A bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] rounded-none
OUT_OF_SCOPE #FEE2E2 #991B1B #1A1A1A bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] rounded-none
NEEDS_REVIEW #FDFFB6 #1A1A1A #1A1A1A bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-none
plain  
 Catatan: Warna status ini lebih light dibanding solid green/red agar teks di dalam badge tetap readable. Border hitam tebal tetap dipertahankan untuk menjaga brutalist identity.
3.3 Lavender Discipline Rule (CRITICAL)
plain  
 "Lavender (#DCCCFF) is a SPICE, not a MEAL."
Sheets
Allowed Max Count Example
Stat card background 1 per dashboard view "Pending Review" card
Category tags 3-5 per page [UI], [Copy], [Backend]
Link hover underline Unlimited "View All" links — hover:underline hover:decoration-[#DCCCFF] hover:decoration-2
Small badges 2-3 per view "NEW", "BETA"
Sheets
FORBIDDEN Reason
Sidebar nav item background Breaks visual hierarchy, creates noise
Sidebar background Reserved for sage only
Large card background (>200px area) Lavender overuse
Button primary background Reserved for teal
Form input background Canvas white only
Modal background Canvas white only
3.4 The GPT Mockup Mistake (Documented)
css
/_ ❌ SALAH — GPT Mockup (jangan pernah generate seperti ini) /
.nav-item { background: #DCCCFF; } / Lavender solid di sidebar = VISUAL NOISE _/
/_ ✅ BENAR — Stitch Style _/
.nav-item { background: transparent; color: #1A1A1A; }
.nav-item:hover { text-decoration: underline; text-decoration-color: #DCCCFF; text-decoration-thickness: 2px; }
.nav-item.active { background: #1A1A1A; color: #C9CBA3; border: 2px solid #1A1A1A; }
Why it's wrong:
plain  
 Contrast clash — Lavender ungu di atas Sage hijau = kombinasi warna "berantakan"
Hierarchy broken — Sidebar seharusnya "frame" yang tenang, bukan area warna-warni
Lavender overused — Lavender adalah aksen kecil, bukan block besar
Nav items should be — transparent, text hitam, hover underline lavender 4. Typography System (Unified)
4.1 Font Stack
css
/_ Google Fonts yang harus di-load di index.html atau main.ts _/
@import url('https://fonts.googleapis.com/css2?family=Baskervville&family=Noto+Serif:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
Sheets
Purpose Font Weight Tailwind Class Notes
Headlines (H1-H3, Logo) Baskervville 400 (Regular) font-['Baskervville',serif] Editorial feel, brutalist "raw". NEVER bold.
Body & AI Text Output Noto Serif 400, 500 font-['Noto_Serif',serif] Line-height 1.6 untuk kenyamanan membaca analisis AI panjang.
UI Elements (Buttons, Nav, Labels) Inter 500, 600 font-['Inter',sans-serif] Neutral, readable untuk interface elements.
Tags, Badges, Stats, Numbers JetBrains Mono 400, 700 font-['JetBrains_Mono',monospace] Monospace = "system" feel.
4.2 Type Scale (Tailwind-Ready)
Sheets
Token Size Line Height Letter Spacing Tailwind Classes Usage
display 48px / 3rem 1.1 -0.02em text-5xl leading-[1.1] tracking-tight font-['Baskervville',serif] Page title, hero
h1 32px / 2rem 1.2 -0.01em text-3xl leading-[1.2] tracking-tight font-['Baskervville',serif] Section headers
h2 24px / 1.5rem 1.3 0 text-2xl leading-[1.3] font-['Baskervville',serif] Card titles
h3 20px / 1.25rem 1.4 0 text-xl leading-[1.4] font-['Baskervville',serif] Sub-sections
body 16px / 1rem 1.6 0 text-base leading-[1.6] font-['Noto_Serif',serif] Paragraphs, AI output
body-sm 14px / 0.875rem 1.5 0 text-sm leading-[1.5] font-['Noto_Serif',serif] Secondary text
caption 12px / 0.75rem 1.4 0.02em text-xs leading-[1.4] tracking-wide font-['Inter',sans-serif] Timestamps, metadata
mono 14px / 0.875rem 1.4 0 text-sm leading-[1.4] font-['JetBrains_Mono',monospace] Tags, code, labels
mono-lg 32px / 2rem 1.2 -0.02em text-3xl leading-[1.2] tracking-tight font-['JetBrains_Mono',monospace] Stat numbers
ui 14px / 0.875rem 1.4 0.05em text-sm leading-[1.4] tracking-wide font-['Inter',sans-serif] font-semibold uppercase Buttons, nav items
4.3 Typography Rules
plain  
 Headlines: NEVER bold (font-bold) — Baskervville Regular sudah cukup. Bold editorial fonts terlihat "screaming".
Body text: NEVER italic untuk emphasis — gunakan underline atau bg-[#FDFFB6] highlight.
All caps: ONLY untuk monospace labels/tags dan UI buttons — never untuk body text atau headlines.
Line height: Minimum leading-[1.5] untuk body text — brutalist ≠ unreadable. 5. Spacing & Layout
5.1 Spacing Scale
css
/_ Tailwind spacing — gunakan kelas standar /
/ 1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, 5 = 24px, 6 = 32px, 7 = 48px, 8 = 64px \*/
5.2 Layout Grid
Sheets
Element Spec Tailwind Classes
Sidebar Fixed 240px width, full height fixed left-0 top-0 h-screen w-[240px]
Sidebar bg Sage solid bg-[#C9CBA3]
Sidebar border Right border hitam tebal border-r-2 border-[#1A1A1A]
Main content Flex-grow, offset sidebar ml-[240px] min-h-screen bg-[#FAFAF9] p-8
Card grid Auto-fill responsive grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
Max content width 1200px centered max-w-[1200px] mx-auto
5.3 Border Rules
Sheets
Element Border Tailwind
Cards 2px solid black border-2 border-[#1A1A1A]
Buttons 2px solid black border-2 border-[#1A1A1A]
Inputs 2px solid black border-2 border-[#1A1A1A]
Sidebar separator 2px solid black (right) border-r-2 border-[#1A1A1A]
Tags/badges 1px solid black border border-[#1A1A1A]
Dividers 1px solid black border-t border-[#1A1A1A]
NO rounded corners — rounded-none di SEMUA elemen. 6. Component Implementation Specs (Tailwind-Ready)
6.1 Buttons
Primary Button ("+ NEW PROJECT", "CONFIRM")
vue
<button
class="
bg-[#006D77] text-[#FAFAF9]
border-2 border-[#1A1A1A]
px-6 py-3
font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide
shadow-[4px_4px_0px_0px_#1A1A1A]
rounded-none
transition-all duration-100 ease-out
hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A]
active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]
"

NEW PROJECT
Secondary Button
vue
<button
class="
bg-[#FAFAF9] text-[#1A1A1A]
border-2 border-[#1A1A1A]
px-6 py-3
font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide
shadow-[4px_4px_0px_0px_#1A1A1A]
rounded-none
transition-all duration-100 ease-out
hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A]
active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]
"

CANCEL
Danger Button
vue
<button
class="
bg-[#E63946] text-[#FAFAF9]
border-2 border-[#1A1A1A]
px-6 py-3
font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide
shadow-[4px_4px_0px_0px_#1A1A1A]
rounded-none
transition-all duration-100 ease-out
hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A]
"

DELETE
6.2 Cards
Standard Card
vue

<div
  class="
    bg-[#FAFAF9]
    border-2 border-[#1A1A1A]
    p-6
    rounded-none
    shadow-[4px_4px_0px_0px_#1A1A1A]
  "
>
  <!-- Card content -->
</div>
Stat Card — Yellow (Primary Attention)
vue
<div
  class="
    bg-[#FFE1A8]
    border-2 border-[#1A1A1A]
    p-6
    rounded-none
  "
>
  <p class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide">Revisions Used</p>
  <p class="font-['JetBrains_Mono',monospace] text-3xl font-bold mt-2">2/3</p>
</div>
Stat Card — Lavender (Secondary, MAX 1 per view)
vue
<div
  class="
    bg-[#DCCCFF]
    border-2 border-[#1A1A1A]
    p-6
    rounded-none
  "
>
  <p class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide">Pending Review</p>
  <p class="font-['JetBrains_Mono',monospace] text-3xl font-bold mt-2">1</p>
</div>
6.3 Tags / Badges
Category Tag (Lavender)
vue
<span
class="
inline-block
bg-[#DCCCFF] text-[#1A1A1A]
border border-[#1A1A1A]
px-3 py-1
font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide
rounded-none
"

UI
Scope Status Badges
vue

<!-- IN_SCOPE -->
<span class="bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-['JetBrains_Mono',monospace] text-xs uppercase">
  IN SCOPE
</span>
<!-- OUT_OF_SCOPE -->
<span class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-['JetBrains_Mono',monospace] text-xs uppercase">
  OUT OF SCOPE
</span>
<!-- NEEDS_REVIEW -->
<span class="bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-['JetBrains_Mono',monospace] text-xs uppercase">
  NEEDS REVIEW
</span>
6.4 Form Inputs
vue
<input
type="text"
class="
 bg-[#FAFAF9] text-[#1A1A1A]
 border-2 border-[#1A1A1A]
 px-4 py-3
 font-['Noto_Serif',serif] text-base
 rounded-none
 w-full
 outline-none
 focus:bg-[#FDFFB6]
 focus:outline-none
 placeholder:text-[#1A1A1A]/40
"
placeholder="Enter project name..."
/>
Rules for inputs:
plain   
 NO shadow offset — agar tidak mengganggu proses mengetik
Focus state: focus:bg-[#FDFFB6] — feedback visual jelas tanpa glow/blur
Placeholder: placeholder:text-[#1A1A1A]/40 — tetap readable tapi subdued
 6.5 Textarea (Untuk AI Input Feedback)
vue
<textarea
  class="
    bg-[#FAFAF9] text-[#1A1A1A]
    border-2 border-[#1A1A1A]
    px-4 py-3
    font-['Noto_Serif',serif] text-base leading-[1.6]
    rounded-none
    w-full
    min-h-[200px]
    outline-none
    focus:bg-[#FDFFB6]
    focus:outline-none
    placeholder:text-[#1A1A1A]/40
    resize-y
  "
  placeholder="Paste client feedback here..."
></textarea>
6.6 Sidebar Navigation
vue
<!-- Sidebar Container -->
<aside
  class="
    fixed left-0 top-0 h-screen w-[240px]
    bg-[#C9CBA3]
    border-r-2 border-[#1A1A1A]
    p-6
    flex flex-col
  "
>
  <!-- Logo -->
  <div class="font-['Baskervville',serif] text-2xl text-[#1A1A1A] tracking-tight mb-12">
    SCOPREVO
  </div>
  <!-- Nav Items -->
  <nav class="flex flex-col gap-2">
    <!-- Standard -->
    <a
      href="#"
      class="
        block px-4 py-3
        bg-transparent text-[#1A1A1A]
        font-['Inter',sans-serif] text-sm font-medium
        border-2 border-transparent
        rounded-none
        transition-all duration-100
        hover:underline hover:decoration-[#DCCCFF] hover:decoration-2
      "
    >
      Projects
    </a>
plain   
 <!-- Active -->
<a
  href="#"
  class="
    block px-4 py-3
    bg-[#1A1A1A] text-[#C9CBA3]
    font-['Inter',sans-serif] text-sm font-medium
    border-2 border-[#1A1A1A]
    rounded-none
  "
>
  Dashboard
</a>
   </nav>
</aside>
CRITICAL: Nav items NEVER have lavender background. See §3.4.
6.7 Progress Bar (Quota)
vue
<div class="w-full">
  <div class="w-full h-6 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden">
    <div
      class="h-full bg-[#006D77] transition-all duration-300 ease-out"
      :style="{ width: usedPercentage + '%' }"
    ></div>
  </div>
  <p class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A] mt-1">
    {{ used }}/{{ allowed }} used
  </p>
</div>
6.8 Modal / Dialog
vue
<!-- Overlay -->
<div class="fixed inset-0 bg-[#1A1A1A]/50 flex items-center justify-center z-50">
  <!-- Modal -->
  <div
    class="
      bg-[#FAFAF9]
      border-2 border-[#1A1A1A]
      p-8
      max-w-[480px] w-[90%]
      rounded-none
      shadow-[8px_8px_0px_0px_#1A1A1A]
    "
  >
    <h2 class="font-['Baskervville',serif] text-2xl text-[#1A1A1A] mb-4">
      Create New Project
    </h2>
    <!-- Form content -->
  </div>
</div>
6.9 Divider
vue
<hr class="border-t border-[#1A1A1A]" />
6.10 Empty State
vue
<div
  class="
    bg-[#FAFAF9]
    border-2 border-dashed border-[#1A1A1A]/30
    p-12
    rounded-none
    text-center
  "
>
  <p class="font-['Baskervville',serif] text-xl text-[#1A1A1A]/60">
    No projects yet
  </p>
  <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/40 mt-2">
    Create your first project to get started
  </p>
</div>
plain   
 Note: Empty state boleh pakai border-dashed karena ini adalah placeholder/non-content, bukan elemen interaktif utama. Tapi jangan pakai dashed untuk card/button utama.
 7. Page-Specific Patterns
7.1 Dashboard (Project List)
plain
┌─────────────────────────────────────────────────────────┐
│  [Sidebar: sage #C9CBA3]  │  [Main: canvas #FAFAF9]     │
│                           │                             │
│  SCOPREVO                 │  Dashboard                  │
│  (Baskervville)           │  (Baskervville)             │
│                           │                             │
│  ─ Projects               │  ┌─────────┐ ┌─────────┐   │
│  ─ Settings               │  │ YELLOW  │ │LAVENDER │   │
│  ─ Logout                 │  │ Stat    │ │ Stat    │   │
│                           │  └─────────┘ └─────────┘   │
│                           │                             │
│                           │  [+ NEW PROJECT] (Teal)     │
│                           │                             │
│                           │  ┌─────────────────────┐   │
│                           │  │ Project Card        │   │
│                           │  │ • Name              │   │
│                           │  │ • Client            │   │
│                           │  │ • Quota: [====  ]   │   │
│                           │  └─────────────────────┘   │
└─────────────────────────────────────────────────────────┘
Rules:
plain   
 Max 2 stat cards at top (1 yellow + 1 lavender)
Project cards: canvas bg, black border, NO shadow (keep flat)
"+ NEW PROJECT": teal button with shadow
Page title: Baskervville, display size
 7.2 Batch Detail / AI Result
plain
┌─────────────────────────────────────────────────────────┐
│                           │  Project: Landing Page      │
│                           │  (Baskervville)             │
│                           │  Batch #3 — DRAFT           │
│                           │  (JetBrains Mono)           │
│                           │                             │
│                           │  "AI Summary..."            │
│                           │  (Noto Serif)               │
│                           │                             │
│                           │  ┌─────────────────────┐   │
│                           │  │ [UI] Reduce hero    │   │
│                           │  │ (tag lavender)      │   │
│                           │  │     [IN_SCOPE]      │   │
│                           │  │     (badge green)   │   │
│                           │  └─────────────────────┘   │
│                           │                             │
│                           │  ┌─────────────────────┐   │
│                           │  │ [Copy] Add dark mode│   │
│                           │  │     [OUT_OF_SCOPE]  │   │
│                           │  │     (badge red)     │   │
│                           │  │     Reason: New feat│   │
│                           │  │     (Noto Serif)    │   │
│                           │  └─────────────────────┘   │
│                           │                             │
│                           │  [GENERATE MAGIC LINK]      │
│                           │  (Teal button)              │
└─────────────────────────────────────────────────────────┘
Rules:
plain   
 Scope badges: green (IN_SCOPE), red (OUT_OF_SCOPE), yellow (NEEDS_REVIEW)
Category tags: lavender background, monospace
Reason text: Noto Serif, smaller, indented with left border
AI summary: Noto Serif, line-height 1.6
 7.3 Client Portal (Magic Link — Public, No Sidebar)
plain
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              SCOPREVO CLIENT PORTAL                     │
│              (Baskervville, centered)                   │
│                                                         │
│  Project: Landing Page PT ABC                           │
│  (Noto Serif)                                           │
│  Revision Quota: 2/3 used                               │
│  (JetBrains Mono)                                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Revision Checklist (Card, canvas bg)            │   │
│  │                                                 │   │
│  │ ☑ Reduce hero density        [IN_SCOPE]         │   │
│  │ ☑ Increase CTA size          [IN_SCOPE]         │   │
│  │ ☐ Add dark mode              [OUT_OF_SCOPE]     │   │
│  │    ↳ Reason: New feature...                     │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│              [CONFIRM REVISION SCOPE]                   │
│              (Teal button, centered, large)             │
│                                                         │
└─────────────────────────────────────────────────────────┘
Rules:
plain   
 Centered layout, max-width 640px
No sidebar — public access, no login
Confirm button: large, teal, centered
Background: canvas #FAFAF9
 8. Responsive Rules
8.1 Breakpoints
Sheets
Name	Width	Tailwind Prefix	Behavior
mobile	< 640px	default	Sidebar → hamburger, cards stack, font reduce
tablet	640–1024px	md:	Sidebar collapses to icons, 2-column grid
desktop	> 1024px	lg:	Full sidebar, 3-column grid
8.2 Mobile Specific Classes
vue
<!-- Sidebar (hidden on mobile, slide-in when open) -->
<aside
  class="
    fixed left-0 top-0 h-screen w-[280px]
    bg-[#C9CBA3] border-r-2 border-[#1A1A1A]
    transform -translate-x-full
    transition-transform duration-200 ease-out
    md:translate-x-0 md:w-[240px]
  "
  :class="{ 'translate-x-0': sidebarOpen }"
>
  <!-- sidebar content -->
</aside>
<!-- Main Content -->
<main class="min-h-screen bg-[#FAFAF9] p-4 md:p-8 md:ml-[240px]">
  <!-- content -->
</main>
<!-- Card Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- cards -->
</div>
<!-- Typography responsive -->
<h1 class="text-2xl md:text-3xl font-['Baskervville',serif] tracking-tight">
  Dashboard
</h1>

Animation & Motion
9.1 Principles
Minimal — brutalist = tidak banyak animasi
Purposeful — setiap motion harus memberi feedback
Snappy — duration max 200ms, ease-out
9.2 Allowed Animations
Sheets
Animation Duration Easing Tailwind Usage
Button hover 100ms ease-out duration-100 ease-out Shadow offset increase, translate -2px
Button press 50ms ease-in duration-75 ease-in Shadow offset decrease, translate +2px
Card hover 150ms ease-out duration-150 ease-out Subtle translate(-2px, -2px)
Modal open 200ms ease-out duration-200 ease-out Fade in + slight scale
Progress fill 300ms ease-out duration-300 ease-out Width transition
Sidebar slide 200ms ease-out duration-200 ease-out Mobile menu translate
9.3 Forbidden Animations
plain  
 NO blur/fade backgrounds — backdrop-blur-_, blur-_
NO bounce/spring physics — animate-bounce
NO parallax — scroll-driven transforms
NO gradient transitions — flat colors only
NO skeleton shimmer — use static placeholder atau "Loading..." text dengan font monospace
9.4 Loading State
vue

<!-- Correct loading state -->
<div class="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A]/60">
  <span class="animate-pulse">■</span>
  <span>Processing AI analysis...</span>
</div>
<!-- Or simple static text -->
<div class="font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A]/60">
  Loading...
</div>

Do's and Don'ts (Quick Reference for AI Agent)
✅ DO
Use border-2 border-[#1A1A1A] on everything interactive
Use rounded-none on EVERY element
Use shadow-[4px_4px_0px_0px_#1A1A1A] only on cards, modals, primary buttons
Use Baskervville for headlines — it gives editorial authority
Use Noto Serif for body text and AI output — readability for long content
Use JetBrains Mono for tags, labels, stats — it feels "system"
Use Inter for UI buttons and navigation — neutral and functional
Use #FAFAF9 as main canvas/workspace background
Use #C9CBA3 sage for sidebar only
Use #DCCCFF lavender sparingly — 1-2 elements per view maximum
Use #FDFFB6 yellow for primary stat card and input focus
Use #006D77 teal for primary actions
Keep everything sharp — rounded-none
Use hard shadows — 4px 4px 0px 0px black, no blur
Use semantic status badge colors: #DCFCE7, #FEE2E2, #FDFFB6
❌ DON'T
plain  
 DON'T use lavender for sidebar nav items (the GPT mistake)
DON'T use lavender for large backgrounds
DON'T use rounded-_ anywhere (except rounded-none)
DON'T use soft shadows (shadow-md, shadow-lg, shadow-sm)
DON'T use gradients (bg-gradient-_)
DON'T use blur or backdrop blur
DON'T bold Baskervville headlines — Regular is enough
DON'T use more than 2 accent colors in one view
DON'T use placeholder text like "text#006d77" or "[STATS ROW]" in production
DON'T make cards "float" without borders — everything needs a visible edge
DON'T use italic for emphasis — use underline or highlight (bg-[#FDFFB6])
DON'T use solid green/red for status badge backgrounds (use light shades #DCFCE7/#FEE2E2 for text readability)
DON'T add shadow to form inputs
DON'T use bg-[#FEFAE0] for canvas (deprecated — use #FAFAF9) 11. Mockup Analysis Summary
11.1 Google Stitch (image3.png) — Score: 8.5/10 ⭐ WINNER
Sheets
Aspect Status
Sidebar sage ✅
Lavender usage ✅ Tepat — "Pending Review" card + category tags
Yellow highlight ✅ "Revisions Used" card
Border hitam ✅ Tebal dan konsisten
Font editorial ✅ Baskervville vibes
Progress bar ✅ Dengan border
Tombol "+ NEW PROJECT" ✅ Teal, bold, shadow
Create New Project dashed ⚠️ Masih border dashed (kurang brutalist — ganti solid)
Verdict: Lavender paling disiplin. Layout clean.
11.2 Gemini (Gemini*Generated_Image_x5fdoux5fdoux5fd.jpg) — Score: 5/10
Sheets
Aspect Status
Layout structure ✅
Lavender ✅ Di "Pending Client Review" card + tags
Placeholder text ❌ "text#006d77", "timestamp ago", "[STATS ROW]"
Quality ❌ Masih wireframe kasar
Verdict: Masih draft, belum polished. Lavender usage benar tapi overall belum siap production.
11.3 GPT (ChatGPT Image 26 Agu 2026, 11.02.53.png) — Score: 7/10
Sheets
Aspect Status
Layout ✅ Paling lengkap — semua section ada
Stats row ✅ Yellow + lavender cards
Category tags ✅ Lavender [UI], [Copy], [Backend]
Recent Batches ✅ Count circles
Sidebar nav items ❌ LAVENDER SOLID background — SALAH
"View All" ✅ Lavender link
Verdict: Layout terbaik, tapi salah pakai lavender di sidebar nav items. Fix: ganti nav items jadi transparent + black text (Stitch style). 12. Tailwind Quick Reference for AI Agent
12.1 Most Common Patterns
plain
/* Card */
class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px*#1A1A1A]"
/_ Primary Button _/
class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
/_ Input _/
class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-3 font-['Noto_Serif',serif] text-base rounded-none w-full outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
/_ Tag _/
class="inline-block bg-[#DCCCFF] text-[#1A1A1A] border border-[#1A1A1A] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide rounded-none"
/_ Sidebar Nav Standard _/
class="block px-4 py-3 bg-transparent text-[#1A1A1A] font-['Inter',sans-serif] text-sm font-medium border-2 border-transparent rounded-none hover:underline hover:decoration-[#DCCCFF] hover:decoration-2"
/_ Sidebar Nav Active _/
class="block px-4 py-3 bg-[#1A1A1A] text-[#C9CBA3] font-['Inter',sans-serif] text-sm font-medium border-2 border-[#1A1A1A] rounded-none"
/_ Status Badge IN_SCOPE _/
class="bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-['JetBrains_Mono',monospace] text-xs uppercase"
/_ Status Badge OUT_OF_SCOPE _/
class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-['JetBrains_Mono',monospace] text-xs uppercase"
/_ Status Badge NEEDS_REVIEW _/
class="bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-['JetBrains_Mono',monospace] text-xs uppercase"
12.2 Font Loading (index.html)
HTML

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baskervville&family=Noto+Serif:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
12.3 Tailwind Config (tailwind.config.js)
JavaScript
module.exports = {
content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
theme: {
extend: {
fontFamily: {
editorial: ["'Baskervville'", 'serif'],
body: ["'Noto Serif'", 'serif'],
ui: ["'Inter'", 'sans-serif'],
mono: ["'JetBrains Mono'", 'monospace'],
},
colors: {
canvas: '#FAFAF9',
sage: '#C9CBA3',
lavender: '#DCCCFF',
yellow: '#FDFFB6',
'yellow-warm': '#FFE1A8',
teal: '#006D77',
black: '#1A1A1A',
'status-in': '#DCFCE7',
'status-in-text': '#166534',
'status-out': '#FEE2E2',
'status-out-text': '#991B1B',
},
boxShadow: {
brutal: '4px 4px 0px 0px #1A1A1A',
'brutal-lg': '8px 8px 0px 0px #1A1A1A',
'brutal-hover': '6px 6px 0px 0px #1A1A1A',
'brutal-active': '2px 2px 0px 0px #1A1A1A',
},
},
},
plugins: [],
};

Changelog
Sheets
Version Date Changes Author
v0.1 2026-08-25 Initial color palette + brutalist direction Kimi
v1.0 2026-08-26 Full design system with component specs, responsive, animation, mockup analysis Kimi
v2.0 2026-08-26 UNIFIED — Merged Kimi design rules + Gemini Tailwind tech spec. Key changes: canvas changed to #FAFAF9, body font changed to Noto Serif, status badge colors standardized for accessibility, Tailwind exact syntax added for all components, input focus state added, font loading & Tailwind config included. Kimi + Gemini
Lock & Approval
LOCKED BY:
Kimi (QA/Validation Lead) — Design rules, color discipline, mockup analysis, Tailwind validation
Gemini (Frontend Lead) — Tailwind implementation specs, Vue 3 component syntax, font & canvas optimization
GPT (PM) — Final approval required
STATUS: PENDING GPT FINAL APPROVAL
RULE: Setelah di-approve GPT, dokumen ini menjadi System Prompt / Guardrails mutlak bagi AI Agent manapun (Gemini, GPT, Claude) yang diminta generate atau revisi kode Vue/Tailwind untuk SCOPREVO. AI Agent WAJIB membaca dan mematuhi setiap aturan di dokumen ini. Tidak ada improvisasi visual tanpa approval GPT.
