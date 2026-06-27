import 'dotenv/config';
import { prisma } from './db';
import { hashPassword } from './lib/auth';

// Region/district/school names are official place/institution names — left
// unchanged rather than guessed at in Karakalpak, per the same reasoning as the
// frontend's "don't translate proper nouns" rule.

// Generates sequential school names: ['1-son maktab', '2-son maktab', ..., 'n-son maktab']
const s = (n: number) => Array.from({ length: n }, (_, i) => `${i + 1}-son maktab`);

// Placeholder list for regions outside Karakalpakstan where exact counts are not available.
const T = ['1-son maktab', '12-son maktab', '24-son maktab'];

// Structure: region → { district → school names[] }
// Karakalpakstan school counts sourced from qrstat.uz (as of 01.01.2023).
const REGIONS: Record<string, Record<string, string[]>> = {
  "Qoraqalpog'iston Respublikasi": {
    'Nukus shahri':       s(60),
    'Amudaryo tumani':    s(86),
    'Beruniy tumani':     s(72),
    "Qonliko'l tumani":   s(24),
    "Qorao'zak tumani":   s(33),
    'Kegeyli tumani':     s(39),
    "Qo'ng'irot tumani":  s(50),
    "Mo'ynoq tumani":     s(18),
    'Nukus tumani':       s(33),
    "Taxtako'pir tumani": s(24),
    "To'rtko'l tumani":   s(69),
    "Xo'jayli tumani":    s(44),
    'Chimboy tumani':     s(49),
    'Shumanay tumani':    s(34),
    'Ellikqala tumani':   s(73),
    'Taxiatosh tumani':   s(23),
    "Bo'zatov tumani":    s(15),
  },
  'Andijon viloyati': {
    'Andijon shahri': T, 'Asaka tumani': T, 'Xonobod shahri': T, 'Shahrixon tumani': T,
  },
  'Buxoro viloyati': {
    'Buxoro shahri': T, 'Kogon shahri': T, "G'ijduvon tumani": T, 'Vobkent tumani': T,
  },
  "Farg'ona viloyati": {
    "Farg'ona shahri": T, "Qo'qon shahri": T, "Marg'ilon shahri": T, 'Quvasoy shahri': T,
  },
  'Jizzax viloyati': {
    'Jizzax shahri': T, 'Zomin tumani': T, "G'allaorol tumani": T, "Do'stlik tumani": T,
  },
  'Xorazm viloyati': {
    'Urganch shahri': T, 'Xiva shahri': T, 'Shovot tumani': T, 'Hazorasp tumani': T,
  },
  'Namangan viloyati': {
    'Namangan shahri': T, 'Chust tumani': T, 'Pop tumani': T, "To'raqo'rg'on tumani": T,
  },
  'Navoiy viloyati': {
    'Navoiy shahri': T, 'Zarafshon shahri': T, 'Karmana tumani': T, 'Nurota tumani': T,
  },
  'Qashqadaryo viloyati': {
    'Qarshi shahri': T, 'Shahrisabz shahri': T, 'Kitob tumani': T, "G'uzor tumani": T,
  },
  'Samarqand viloyati': {
    'Samarqand shahri': T, "Kattaqo'rg'on shahri": T, 'Urgut tumani': T, "Bulung'ur tumani": T,
  },
  'Sirdaryo viloyati': {
    'Guliston shahri': T, 'Shirin shahri': T, 'Sayxunobod tumani': T, 'Boyovut tumani': T,
  },
  'Surxondaryo viloyati': {
    'Termiz shahri': T, 'Denov tumani': T, 'Sherobod tumani': T, 'Boysun tumani': T,
  },
  'Toshkent viloyati': {
    'Nurafshon shahri': T, 'Chirchiq shahri': T, 'Olmaliq shahri': T, 'Bekobod shahri': T,
  },
  'Toshkent shahri': {
    'Chilonzor tumani': T, 'Yunusobod tumani': T, "Mirzo Ulug'bek tumani": T, 'Yakkasaroy tumani': T,
  },
};

const UNITS: { title: string; order: number; emoji: string; words?: { en: string; ipa: string; uz: string; example: string; emoji: string }[] }[] = [
  {
    title: '1-tema — Shańaraq',
    order: 1,
    emoji: '👨‍👩‍👧',
    words: [
      { en: 'Parent', ipa: '/ˈpeərənt/', uz: 'Ata-ana', example: 'My parents work very hard every day.', emoji: '👪' },
      { en: 'Sibling', ipa: '/ˈsɪblɪŋ/', uz: 'Aga-qarındas', example: 'I have two siblings, a brother and a sister.', emoji: '👫' },
      { en: 'Grandmother', ipa: '/ˈɡrænmʌðə/', uz: 'Áje', example: 'My grandmother bakes delicious bread.', emoji: '👵' },
      { en: 'Cousin', ipa: '/ˈkʌzən/', uz: 'Tuwısqan bala', example: 'My cousin lives in another city.', emoji: '🧑' },
      { en: 'Relative', ipa: '/ˈrelətɪv/', uz: 'Tuwısqan', example: 'We invited all our relatives to the party.', emoji: '👨‍👩‍👧‍👦' },
    ],
  },
  {
    title: '2-tema — Mektep',
    order: 2,
    emoji: '🏫',
    words: [
      { en: 'Classroom', ipa: '/ˈklɑːsruːm/', uz: 'Sınıp bólmesi', example: 'Our classroom has twenty desks.', emoji: '🏫' },
      { en: 'Homework', ipa: '/ˈhəʊmwɜːk/', uz: 'Úy tapsırması', example: 'I always do my homework after dinner.', emoji: '📝' },
      { en: 'Teacher', ipa: '/ˈtiːtʃə/', uz: 'Oqıtıwshı', example: 'Our teacher explains the lessons very clearly.', emoji: '👩‍🏫' },
      { en: 'Subject', ipa: '/ˈsʌbdʒɪkt/', uz: 'Pán', example: 'Mathematics is my favorite subject.', emoji: '📚' },
      { en: 'Library', ipa: '/ˈlaɪbrəri/', uz: 'Kitapxana', example: 'I borrowed three books from the library.', emoji: '📖' },
    ],
  },
  {
    title: '3-tema — Taǵam',
    order: 3,
    emoji: '🍎',
    words: [
      { en: 'Breakfast', ipa: '/ˈbrekfəst/', uz: 'Tańgi as', example: 'I eat breakfast at seven o\'clock.', emoji: '🍳' },
      { en: 'Vegetable', ipa: '/ˈvedʒtəbl/', uz: 'Kókónis', example: 'Carrots and potatoes are vegetables.', emoji: '🥕' },
      { en: 'Delicious', ipa: '/dɪˈlɪʃəs/', uz: 'Dámli', example: 'This soup is absolutely delicious.', emoji: '😋' },
      { en: 'Recipe', ipa: '/ˈresəpi/', uz: 'Recept', example: 'My mother has a great recipe for pilaf.', emoji: '📋' },
      { en: 'Thirsty', ipa: '/ˈθɜːsti/', uz: 'Shańqaǵan', example: 'I am very thirsty, can I have some water?', emoji: '🥤' },
    ],
  },
  {
    title: '4-tema — Haywanlar',
    order: 4,
    emoji: '🦁',
    words: [
      { en: 'Brave', ipa: '/breɪv/', uz: 'Batır', example: 'The brave boy helped his friend.', emoji: '🦁' },
      { en: 'Forest', ipa: '/ˈfɒrɪst/', uz: 'Orman', example: 'Many animals live in the forest.', emoji: '🌲' },
      { en: 'Curious', ipa: '/ˈkjʊəriəs/', uz: 'Qızıqıwshań', example: 'A curious cat opened the box.', emoji: '🐱' },
      { en: 'Weather', ipa: '/ˈweðə/', uz: 'Hawa-rayı', example: 'The weather is sunny today.', emoji: '☀️' },
      { en: 'Journey', ipa: '/ˈdʒɜːni/', uz: 'Sapar', example: 'Our journey to the sea was fun.', emoji: '🧭' },
    ],
  },
  {
    title: '5-tema — Sport',
    order: 5,
    emoji: '⚽',
    words: [
      { en: 'Athlete', ipa: '/ˈæθliːt/', uz: 'Sportshı', example: 'The athlete trains every morning.', emoji: '🏃' },
      { en: 'Champion', ipa: '/ˈtʃæmpiən/', uz: 'Chempion', example: 'She became the champion of the competition.', emoji: '🏆' },
      { en: 'Exercise', ipa: '/ˈeksəsaɪz/', uz: 'Jattıǵıw', example: 'Daily exercise keeps you healthy.', emoji: '🏋️' },
      { en: 'Stadium', ipa: '/ˈsteɪdiəm/', uz: 'Stadion', example: 'Thousands of fans filled the stadium.', emoji: '🏟️' },
      { en: 'Victory', ipa: '/ˈvɪktəri/', uz: 'Jeńis', example: 'Our team celebrated their victory.', emoji: '🥇' },
    ],
  },
  {
    title: '6-tema — Sayaxat',
    order: 6,
    emoji: '✈️',
    words: [
      { en: 'Passport', ipa: '/ˈpɑːspɔːt/', uz: 'Pasport', example: "Don't forget your passport at the airport.", emoji: '🛂' },
      { en: 'Luggage', ipa: '/ˈlʌɡɪdʒ/', uz: 'Bagaj', example: 'We packed our luggage the night before.', emoji: '🧳' },
      { en: 'Destination', ipa: '/ˌdestɪˈneɪʃən/', uz: 'Barıw ornı', example: 'Our final destination is Samarkand.', emoji: '📍' },
      { en: 'Adventure', ipa: '/ədˈventʃə/', uz: 'Qızıqlı sapar', example: 'Traveling abroad is a great adventure.', emoji: '🗺️' },
      { en: 'Souvenir', ipa: '/ˌsuːvəˈnɪə/', uz: 'Estelik sıyı', example: 'I bought a souvenir for my friend.', emoji: '🎁' },
    ],
  },
];

// Mirrors the Learn flow's Test phase format ("X" sóziniń awdarması qaysı?) for
// pedagogical consistency, rather than the old mixed-English clue format.
const QUIZ_QUESTIONS = [
  { question: '"Forest" sóziniń awdarması qaysı?', options: ['Shól', 'Orman', 'Ókeyan', 'Qala'], correctIndex: 1 },
  { question: '"Curious" sóziniń awdarması qaysı?', options: ['Zerikken', 'Shаршаған', 'Qızıqıwshań', 'Аshıwlı'], correctIndex: 2 },
  { question: '"Brave" sóziniń qarama-qarsı mánisi qaysı?', options: ['Erjúrek', 'Kúshli', 'Qorqaq', 'Jaqsı kóńilli'], correctIndex: 2 },
];

// Tests recognizing similar-sounding ENGLISH words from a spoken English
// sentence — intentionally stays English end-to-end, that's the point of the
// exercise. (Currently orphaned: the standalone Listen screen was removed from
// the frontend nav, but the route/data are kept — see web session notes.)
const LISTEN_QUESTIONS = [
  { sentence: 'The curious cat opened the box.', options: ['Furious', 'Curious', 'Serious', 'Carry'], correctIndex: 1 },
  { sentence: 'We had a long journey to the sea.', options: ['Journey', 'Money', 'Jungle', 'Jury'], correctIndex: 0 },
  { sentence: 'The weather is very sunny today.', options: ['Wealth', 'Whether', 'Weather', 'Wonder'], correctIndex: 2 },
];

const BATTLE_QUESTIONS = [
  { question: '"Brave" sóziniń mánisi qaysı?', options: ['Qorqaq', 'Batır', 'Áste', 'Jańa'], correctIndex: 1 },
  { question: '"Forest" nemeni bildiredi?', options: ['Teńiz', 'Taw', 'Orman', 'Shól'], correctIndex: 2 },
  { question: '"Fast" sóziniń mánisi qaysı?', options: ['Tez', 'Issıq', 'Úlken', 'Жumsaq'], correctIndex: 0 },
];

const BADGES: { key: string; title: string; desc: string; emoji: string; criteriaType: 'STREAK_GTE' | 'WORDS_KNOWN_GTE' | 'BATTLE_WINS_GTE' | 'SPEAK_ATTEMPTS_GTE'; criteriaValue: number }[] = [
  { key: 'olovli_start', title: 'Otlı baslaw', desc: '7 kún izbe-iz', emoji: '🔥', criteriaType: 'STREAK_GTE', criteriaValue: 7 },
  { key: '100_soz', title: '100 sóz', desc: '100 sóz úyrenildi', emoji: '📚', criteriaType: 'WORDS_KNOWN_GTE', criteriaValue: 100 },
  { key: 'notiq', title: 'Shеshen', desc: '50 aytıw jattıǵıwı', emoji: '🎙️', criteriaType: 'SPEAK_ATTEMPTS_GTE', criteriaValue: 50 },
  { key: 'jangchi', title: 'Jawger', desc: '10 atıspa jeńisi', emoji: '⚔️', criteriaType: 'BATTLE_WINS_GTE', criteriaValue: 10 },
  { key: '500_soz', title: '500 sóz', desc: '500 sóz úyrenildi', emoji: '💎', criteriaType: 'WORDS_KNOWN_GTE', criteriaValue: 500 },
];

const DEMO_FULL_NAME = 'Ájiniyaz Dáwletov';

async function main() {
  console.log('Seeding regions/districts/schools...');
  for (const [regionName, districtMap] of Object.entries(REGIONS)) {
    const region = await prisma.region.upsert({
      where: { name: regionName },
      update: {},
      create: { name: regionName },
    });
    for (const [districtName, schoolNames] of Object.entries(districtMap)) {
      const district = await prisma.district.upsert({
        where: { regionId_name: { regionId: region.id, name: districtName } },
        update: {},
        create: { name: districtName, regionId: region.id },
      });
      for (const schoolName of schoolNames) {
        await prisma.school.upsert({
          where: { districtId_name: { districtId: district.id, name: schoolName } },
          update: {},
          create: { name: schoolName, districtId: district.id },
        });
      }
    }
  }

  console.log('Seeding units/words...');
  for (const unit of UNITS) {
    const existing = await prisma.unit.findFirst({ where: { order: unit.order } });
    const createdUnit = existing
      ? await prisma.unit.update({ where: { id: existing.id }, data: { title: unit.title, emoji: unit.emoji } })
      : await prisma.unit.create({ data: { title: unit.title, order: unit.order, emoji: unit.emoji } });
    if (unit.words) {
      for (let i = 0; i < unit.words.length; i++) {
        const w = unit.words[i];
        const existingWord = await prisma.word.findFirst({ where: { unitId: createdUnit.id, order: i } });
        if (existingWord) {
          await prisma.word.update({
            where: { id: existingWord.id },
            data: { en: w.en, ipa: w.ipa, uz: w.uz, example: w.example, emoji: w.emoji },
          });
        } else {
          await prisma.word.create({
            data: { unitId: createdUnit.id, en: w.en, ipa: w.ipa, uz: w.uz, example: w.example, emoji: w.emoji, order: i },
          });
        }
      }
    }
  }

  // No stable unique key on question text, and nothing references these rows by
  // id elsewhere — refreshing on every seed run (instead of only-if-empty) is
  // the simplest way to keep translated content in sync.
  console.log('Seeding quiz/listen/battle questions...');
  await prisma.quizQuestion.deleteMany({});
  await prisma.quizQuestion.createMany({ data: QUIZ_QUESTIONS.map((q, i) => ({ ...q, order: i })) });
  await prisma.listenQuestion.deleteMany({});
  await prisma.listenQuestion.createMany({ data: LISTEN_QUESTIONS.map((q, i) => ({ ...q, order: i })) });
  await prisma.battleQuestion.deleteMany({});
  await prisma.battleQuestion.createMany({ data: BATTLE_QUESTIONS.map((q, i) => ({ ...q, order: i })) });

  console.log('Seeding badges...');
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: { title: badge.title, desc: badge.desc, emoji: badge.emoji, criteriaType: badge.criteriaType, criteriaValue: badge.criteriaValue },
      create: badge,
    });
  }

  console.log('Seeding demo account...');
  const demoExisting = await prisma.user.findUnique({ where: { username: 'demo' } });
  if (!demoExisting) {
    const tashkent = await prisma.region.findUniqueOrThrow({ where: { name: 'Toshkent shahri' } });
    const chilonzor = await prisma.district.findFirstOrThrow({ where: { regionId: tashkent.id, name: 'Chilonzor tumani' } });
    const school = await prisma.school.findFirstOrThrow({ where: { districtId: chilonzor.id, name: '24-son maktab' } });
    await prisma.user.create({
      data: {
        username: 'demo',
        passwordHash: await hashPassword('demo1234'),
        fullName: DEMO_FULL_NAME,
        grade: '6',
        regionId: tashkent.id,
        districtId: chilonzor.id,
        schoolId: school.id,
        xp: 1240,
        streak: 12,
        goalDoneToday: 18,
        lastActiveDate: new Date(),
      },
    });
  } else if (demoExisting.fullName !== DEMO_FULL_NAME) {
    await prisma.user.update({ where: { id: demoExisting.id }, data: { fullName: DEMO_FULL_NAME } });
  }

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
