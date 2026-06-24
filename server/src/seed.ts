import 'dotenv/config';
import { prisma } from './db';
import { hashPassword } from './lib/auth';

// Region/district/school names are official place/institution names — left
// unchanged rather than guessed at in Karakalpak, per the same reasoning as the
// frontend's "don't translate proper nouns" rule.
const REGIONS: Record<string, string[]> = {
  "Qoraqalpog'iston Respublikasi": ['Nukus shahri', "Xo'jayli tumani", 'Chimboy tumani', "Qo'ng'irot tumani"],
  'Andijon viloyati': ['Andijon shahri', 'Asaka tumani', 'Xonobod shahri', 'Shahrixon tumani'],
  'Buxoro viloyati': ['Buxoro shahri', 'Kogon shahri', "G'ijduvon tumani", 'Vobkent tumani'],
  "Farg'ona viloyati": ["Farg'ona shahri", "Qo'qon shahri", "Marg'ilon shahri", 'Quvasoy shahri'],
  'Jizzax viloyati': ['Jizzax shahri', 'Zomin tumani', "G'allaorol tumani", "Do'stlik tumani"],
  'Xorazm viloyati': ['Urganch shahri', 'Xiva shahri', 'Shovot tumani', 'Hazorasp tumani'],
  'Namangan viloyati': ['Namangan shahri', 'Chust tumani', 'Pop tumani', "To'raqo'rg'on tumani"],
  'Navoiy viloyati': ['Navoiy shahri', 'Zarafshon shahri', 'Karmana tumani', 'Nurota tumani'],
  'Qashqadaryo viloyati': ['Qarshi shahri', 'Shahrisabz shahri', 'Kitob tumani', "G'uzor tumani"],
  'Samarqand viloyati': ['Samarqand shahri', "Kattaqo'rg'on shahri", 'Urgut tumani', "Bulung'ur tumani"],
  'Sirdaryo viloyati': ['Guliston shahri', 'Shirin shahri', 'Sayxunobod tumani', 'Boyovut tumani'],
  'Surxondaryo viloyati': ['Termiz shahri', 'Denov tumani', 'Sherobod tumani', 'Boysun tumani'],
  'Toshkent viloyati': ['Nurafshon shahri', 'Chirchiq shahri', 'Olmaliq shahri', 'Bekobod shahri'],
  'Toshkent shahri': ['Chilonzor tumani', 'Yunusobod tumani', "Mirzo Ulug'bek tumani", 'Yakkasaroy tumani'],
};

const SCHOOL_NAME_TEMPLATES = ['1-son maktab', '12-son maktab', '24-son maktab'];

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
  for (const [regionName, districts] of Object.entries(REGIONS)) {
    const region = await prisma.region.upsert({
      where: { name: regionName },
      update: {},
      create: { name: regionName },
    });
    for (const districtName of districts) {
      const district = await prisma.district.upsert({
        where: { regionId_name: { regionId: region.id, name: districtName } },
        update: {},
        create: { name: districtName, regionId: region.id },
      });
      for (const schoolName of SCHOOL_NAME_TEMPLATES) {
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
