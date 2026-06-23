# Handoff: Bilimdon — 5–6-sinf ingliz tili so'z o'rganish platformasi

## Overview
**Bilimdon** — O'zbekiston 5–6-sinf o'quvchilari uchun ingliz tili so'zlarini
o'yin (gamifikatsiya) orqali yodlashga mo'ljallangan veb-platforma. Kuniga ~30
daqiqa mashg'ulotga moslangan. Asosiy funksiyalar: flashcard so'z o'rganish,
mikrofon orqali talaffuz mashqi, naushnik orqali tinglab tushunish, jonli batl
(1v1) o'yini, test/viktorina, hudud bo'yicha reyting, profil/yutuqlar va
sozlamalar. Ro'yxatdan o'tishda o'quvchi Viloyat → Shahar/Tuman → Maktab
tanlaydi va statistikalar shu kesimda hisoblanadi.

## About the Design Files
Ushbu paketdagi fayl (`Bilimdon.dc.html`) — **HTML'da yaratilgan dizayn
namunasi (prototip)**. U mahsulotning ko'rinishi va xatti-harakatini ko'rsatadi,
lekin to'g'ridan-to'g'ri ko'chiriladigan production kod EMAS. Vazifa — ushbu
dizaynlarni maqsadli kodbazaning mavjud muhitida (React, Vue, Next.js, SwiftUI
va h.k.) o'sha muhitning o'rnatilgan pattern va kutubxonalaridan foydalanib
**qayta yaratish**. Agar hali kodbaza bo'lmasa, loyiha uchun eng mos
freymvorkni tanlab (tavsiya: **React + Vite + TypeScript + Tailwind CSS**, holat
uchun Zustand yoki Context) shu dizaynlarni amalga oshiring.

> Eslatma: `.dc.html` — bu maxsus "Design Component" formati (jonli ko'rib
> chiqish uchun). Uni shunchaki brauzerda ham ochib ko'rishingiz mumkin. Kodni
> ko'chirib emas, vizual mos ravishda qayta quring.

## Fidelity
**High-fidelity (hifi).** Yakuniy ranglar, tipografiya, oraliqlar, holatlar va
interaksiyalar belgilangan. UI'ni piksel darajasida, kodbazaning mavjud
kutubxonalari bilan qayta yarating. Quyidagi qiymatlar aniq — taxmin qilmang.

---

## Design Tokens

### Colors
| Vazifa | Hex |
|---|---|
| Brand / Primary (yashil) | `#22C55E` |
| Primary dark (soya, bosilgan) | `#16A34A`, `#15803D` |
| Primary light fon | `#F0FDF4`, `#DCFCE7` |
| Secondary (ko'k) | `#3B82F6` / dark `#2563EB` |
| Talaffuz (binafsha) | `#8B5CF6` / `#7C3AED` |
| Tinglash (cyan) | `#06B6D4` / `#0891B2` |
| Batl (pushti) | `#EC4899` / `#DB2777` |
| Test / ogohlantirish (sariq-zarg'aldoq) | `#F59E0B` / `#EA580C` |
| XP / medal (oltin) | `#EAB308` / `#FACC15` |
| Mavzular (teal) | `#14B8A6` |
| Xato / chiqish (qizil) | `#EF4444` / `#DC2626`, fon `#FEF2F2` |
| Matn asosiy | `#0F172A` |
| Matn ikkilamchi | `#64748B`, `#94A3B8` |
| Chegara (border) | `#E8EDF3`, `#EAF0F6`, `#F1F5F9` |
| App fon | `#F6F8FB` |
| To'q panel (sidebar accent, batl header) | `#1E293B` → `#0F172A` gradient |

### Typography
- **Sarlavha / display:** `'Baloo 2'`, weight 700/800. (Google Fonts)
- **Asosiy matn:** `'Nunito'`, weight 400/600/700/800. (Google Fonts)
- Import: `https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap`
- O'lchamlar: H1 hero 32px, ekran sarlavhasi 24–25px, flashcard so'z 46px,
  tugma 15–17px, asosiy matn 13.5–15px, yorliq/caption 11–13px.

### Spacing & Radius
- Radius: kartalar **22px**, katta panel/hero **24–26px**, tugma **13–16px**,
  kichik chip/badge **20px (pill)**, ikona quti **12–16px**.
- Padding: kartalar 18–24px, hero 30–36px, content wrapper 26px 34px.
- Sidebar kengligi **260px**, topbar balandligi ~ padding 18px.
- Card shadow: `0 2px 10px rgba(15,23,42,.04)`; hero shadow rangli, masalan
  `0 18px 40px rgba(22,163,74,.32)`.
- Tugma "3D" effekti: pastki soya `box-shadow:0 5px 0 <darkshade>`.

### Animatsiyalar (keyframes)
- `floaty` — mascot yuqori-past suzishi (4s, infinite).
- `pop` — ekran kirishi (scale .92→1, opacity, .35s).
- `ring` — mikrofon yozish paytida pulsatsiya halqasi.
- `wave` — talaffuz to'lqin chiziqlari (height 10→48px).
- `shrink` — batl taymeri progress bar (width 100→0%).
- `spin`, `shake` — yordamchi.

---

## Screens / Views

Platforma **autentifikatsiya** (login/signup) va **app** (sidebar + topbar +
content) qismlariga bo'linadi. Holat `screen` o'zgaruvchisi orqali boshqariladi.

### 0. Login
- **Maqsad:** Hisobga kirish.
- **Layout:** ekran ikkiga bo'lingan. Chap (flex:1) — yashil gradient panel
  (`#22C55E→#16A34A→#15803D`), mascot (suzuvchi to'tiqush SVG), brend nomi
  "Bilimdon" (44px Baloo 2), 3 ta xususiyat ro'yxati (🎙️/⚔️/🏆). O'ng (480px)
  — oq forma: foydalanuvchi nomi, parol inputlari, "Eslab qolish", "Parolni
  unutdingizmi?", **Kirish** tugmasi (yashil), **Demo sifatida ko'rish**
  tugmasi, "Ro'yxatdan o'ting" havolasi.
- Input: `border:2px #E8EDF3`, radius 14px, fon `#F8FAFC`, focus'da yashil
  chegara + oq fon.

### 1. Signup (Ro'yxatdan o'tish)
- **Maqsad:** Yangi hisob yaratish + hudud/maktab tanlash.
- **Layout:** markazda 440px oq karta (radius 26px), radial yashil/ko'k fon.
- **Maydonlar:** Ism familiya; Foydalanuvchi nomi + Parol (yonma-yon); **Hudud
  kaskadi**; Sinf tanlash (5/6 chip).
- **Hudud kaskadi (MUHIM):** 3 ta bog'liq `<select>`:
  1. **Viloyat / Respublika** — 14 ta variant (ro'yxat pastda).
  2. **Shahar / Tuman** — tanlangan viloyatga qarab to'ladi; viloyat
     tanlanmaguncha `disabled`.
  3. **Maktab** — tuman tanlanmaguncha `disabled`.
  Har bir tanlov o'zgarganda quyidagilari tozalanadi (region o'zgarsa district
  va school bo'shaydi).
- Sinf chip: tanlangani yashil ramka + `#F0FDF4` fon.

### 2. Dashboard (Bosh sahifa)
- **Maqsad:** Kunlik holat va tezkor kirish.
- **Layout (max 1180px):**
  - **Hero** (yashil gradient, radius 26px): salom + ism, qolgan daqiqa,
    "Davom ettirish →" (oq tugma) va "⚔️ Batlga kirish" (shaffof tugma),
    o'ngda suzuvchi mascot.
  - **Stat qatori** (grid 1.15fr/1fr/1fr): (a) kunlik maqsad progress halqasi
    (SVG circle, foiz), (b) ketma-ket kunlar (streak) + hafta kataklari,
    (c) jami so'zlar.
  - **Pastki qator** (grid 1.6fr/1fr): chapda "Bugungi mashg'ulotlar" ro'yxati
    (So'z o'rganish / Talaffuz / Test — bosilsa tegishli ekran), o'ngda to'q
    fonli "Sinf reytingi TOP 5".

### 3. Learn (So'z o'rganish — Flashcard)
- **Maqsad:** Flashcard orqali so'z yodlash.
- **Layout (max 760px, markazda):** sarlavha "Unit 4 — Animals", progress
  bar, **3D aylanuvchi karta** (perspective 1500px, `rotateY` 0/180deg, .5s):
  - **Old tomon:** emoji, so'z (46px), IPA transkripsiya, "Tinglash" tugmasi
    (Web Speech bilan talaffuz), "Tarjimani ko'rish" maslahati.
  - **Orqa tomon:** yashil gradient, tarjima (uz), misol jumla.
  - Pastda: "↻ Takrorlash kerak" (qizil) va "✓ Bilaman" (yashil) tugmalari.
- **Klaviatura:** ← oldingi · → keyingi · `Space` aylantirish · `S` tinglash.
- **Orqaga (‹) tugma** ham bor.
- 5 ta so'z aylanib keladi (`known[]` massivga belgilanadi).

### 4. Speak (Talaffuz mashqi — Mikrofon)
- **Maqsad:** So'zni baland aytib, talaffuzni tekshirish.
- **Layout (max 720px, markaz):** "🎙️ TALAFFUZ MASHQI" badge, ko'rsatma
  ("Naushnik kiying, mikrofonni yoqing"), oq karta: so'z + IPA + tarjima,
  "Namunani tinglash" tugmasi, **to'lqin vizualizatsiyasi** (13 ta chiziq, yozish
  paytida `wave` animatsiya), **doira mikrofon tugmasi** (binafsha; yozayotganda
  pushti + `ring` pulsatsiya). 2.4s dan keyin (yoki qayta bosilganda) tasodifiy
  **80–95% ball** natija kartasi (yashil, SVG progress halqasi, bo'g'in
  maslahati, "↻ Qayta" / "Keyingi →"). Bir nechta so'z bo'ylab aylanadi.
- Talaffuz brauzerning **Web Speech API** (`SpeechSynthesisUtterance`,
  `lang='en-US'`) orqali. Real ilovada mikrofon yozuvini baholash uchun STT
  yoki talaffuz baholash API kerak — hozir bahosi simulyatsiya.

### 5. Listen (Tinglab tushunish — Naushnik)
- **Maqsad:** Jumlani tinglab, to'g'ri so'zni tanlash.
- **Layout (max 680px, markaz):** "🎧 TINGLAB TUSHUNISH" badge, cyan doira
  **▶ Play** tugmasi (Web Speech jumlani o'qiydi), 4 ta variant (grid 2×2).
  Tanlovdan keyin to'g'ri yashil, xato qizil. **3 savolli to'liq oqim:**
  progress, ball, "Keyingi", yakuniy natija + XP. Jumla matni javobni
  oshkor qilmaydi (faqat eshitiladi).

### 6. Battle (Batl o'yini — jonli 1v1)
- **Maqsad:** Bot/raqib bilan tezlik musobaqasi.
- **Layout (max 860px):**
  - **O'yinchilar header** (to'q gradient): chap — siz (yashil avatar, ball),
    markaz — "VS" + savol raqami, o'ng — "Jasur T. 🤖" (pushti avatar, ball).
  - **Taymer** progress bar (10s, `shrink`); jonli sanagich har soniya kamayadi,
    oxirgi 3s qizaradi, vaqt tugasa avtomatik keyingi savol.
  - **Savol kartasi:** "⚡ TEZ JAVOB BERING", savol, 4 variant (grid 2×2).
    Javobdan keyin to'g'ri/xato rang, raqib tasodifan (~55%) to'g'ri javob
    beradi, 1.5s keyin keyingi savol.
  - **Yakun ekrani:** natija emoji, "G'alaba/Mag'lubiyat/Durrang", hisob,
    "⚔️ Qayta o'ynash" / "Bosh sahifa".
- 3 savol.

### 7. Quiz (Test / Viktorina)
- **Maqsad:** Bilimni tekshirish.
- **Layout (max 680px):** progress + savol raqami, savol kartasi, 4 variant
  (A/B/C/D harf badge bilan, vertikal). Tanlovdan keyin to'g'ri/xato rang,
  1.3s keyin keyingi. **Yakun:** natija emoji, "X/Y to'g'ri", "+XP", "↻ Qayta"
  / "Bosh sahifa". 3 savol, har to'g'ri javob +15 XP.

### 8. Lessons (Mavzular)
- **Maqsad:** Darslik birliklarini ko'rish/tanlash.
- **Layout (max 1080px):** grid 3 ustun, 6 ta Unit kartasi (Family, School,
  Food, Animals, Sport, Travel). Har karta: emoji ikona, status badge
  (✓ Tugadi / Joriy / Davom / 🔒 Yopiq), nom, so'zlar soni, progress bar,
  foiz. Joriy karta yashil ramkali; qulflanganlari `opacity .6`,
  `cursor:not-allowed`.

### 9. Leaders (Reyting — hudud kesimida)
- **Maqsad:** Hudud bo'yicha reytingni ko'rish.
- **Layout (max 760px):**
  - **"Sizning o'rningiz" kartalari** (grid 4): Maktabda **#3**, Tumanda
    **#28**, Viloyatda **#156**, Respublikada **#1,204**.
  - **Scope tablari:** Maktab / Tuman / Viloyat / Respublika (faol tab to'q).
  - Faol qamrov yorlig'i (masalan "24-son maktab" / "Butun O'zbekiston").
  - **Podium** (top-3, 1-o'rin balandroq, medal 🥇🥈🥉).
  - **Jadval:** o'rin, avatar, ism, so'z soni, XP. "Siz" qatori yashil
    ajratilgan. Har scope o'z ro'yxatini ko'rsatadi (`BOARDS` obyekti).

### 10. Profile (Profil)
- **Maqsad:** Yutuqlar va statistika.
- **Layout (max 880px):** ko'k gradient header — avatar, ism, "6-A sinf ·
  Daraja 7", **hudud chiplari** (📍 viloyat, 🏫 tuman + maktab), daraja
  progress bar (XP). Statistika grid 4 (so'z, streak, g'alaba, daraja).
  **Yutuqlar/nishonlar** grid 4 (8 ta badge; olinganlari rangli, qolgani
  kulrang `opacity .55`).

### 11. Settings (Sozlamalar)
- **Maqsad:** Audio/qurilma va maqsad sozlamalari.
- **Layout (max 680px):** "AUDIO VA QURILMA" — 4 ta toggle (Mikrofon, Naushnik/
  Ovoz, Ovoz effektlari, Eslatmalar) — iOS uslubidagi switch (yoqilgan yashil).
  "KUNLIK MAQSAD" — 15/20/30/45 daqiqa chiplari. Pastda "↩ Hisobdan chiqish"
  (qizil).

---

## Navigation
Sidebar (260px, oq, sticky): brend logo + 10 element — Bosh sahifa, So'z
o'rganish, Mavzular, Talaffuz mashqi, Tinglab tushunish, Batl o'yini (JONLI
badge), Test/Viktorina, Reyting, Profil, Sozlamalar. Faol element och-kulrang
fon + rangli nuqta. Pastda "Bugungi maqsad" progress kartasi.

Topbar: qidiruv (placeholder), streak (🔥), XP (⭐), foydalanuvchi avatari.

## Interactions & Behavior
- Login/Demo bosilsa → Dashboard. Logout → Login.
- Hudud kaskadi: region o'zgarsa district+school reset; bog'liq selectlar
  disabled holatdan chiqadi.
- Flashcard: 3D flip, klaviatura navigatsiyasi, Web Speech talaffuz.
- Speak: yozish simulyatsiyasi (2.4s) → tasodifiy ball; to'lqin animatsiyasi.
- Listen/Quiz/Battle: tanlov → rang feedback → kechikish → keyingi → yakun.
- Battle taymer: `setInterval` 1s, 0 da avtomatik keyingi savol.
- Barcha ekran kirishida `pop` animatsiya.

## State Management
Asosiy holat o'zgaruvchilari (real ilovada store yoki context):
`screen`, `grade`, `goalMin`, `region`, `district`, `school`, `scope`,
`set{mic,sfx,head,notify}`, flashcard: `card,flipped,known[]`,
speak: `recording,recScore`, listen: `listenSel + (savol indeksi)`,
battle: `bq,myScore,oppScore,bAnswered,bPicked,bTime`,
quiz: `qq,qSel,qScore`.

Ma'lumotlar (prototipda massivlar): `WORDS`, `BATTLE`, `QUIZ`, `REGIONS`
(viloyat→tumanlar map), `SCHOOLS`, `BOARDS` (scope→reyting ro'yxati).

## Backend / Real ilova uchun eslatmalar
- **So'zlar:** prototipda namuna. Real to'ldirish — 5–6-sinf darsliklaridagi
  so'zlardan Unit'larga ajratib (en, IPA, uz, misol, emoji/rasm).
- **Talaffuz baholash:** real mikrofon yozuvini baholash uchun nutq tanish /
  pronunciation-scoring xizmati kerak (hozir simulyatsiya).
- **Reyting statistikasi:** maktab/tuman/viloyat/respublika kesimida XP va
  so'zlar bo'yicha agregatsiya — backendda hisoblanadi (prototip namuna raqam).
- **Batl:** real vaqt 1v1 uchun WebSocket / realtime kerak (hozir bot).

## Hudud ro'yxati (REGIONS)
Qoraqalpogʻiston Respublikasi, Andijon, Buxoro, Fargʻona, Jizzax, Xorazm,
Namangan, Navoiy, Qashqadaryo, Samarqand, Sirdaryo, Surxondaryo, Toshkent
viloyati, Toshkent shahri. Har biri uchun 4 ta namunaviy shahar/tuman.
Maktablar: 1/12/24/45-son maktab, IDUM № 2 (namuna).

## Files
- `Bilimdon.dc.html` — to'liq dizayn prototipi (barcha 12 ko'rinish, mantiq va
  ma'lumotlar shu faylda). Brauzerda ochib ko'rish mumkin.
