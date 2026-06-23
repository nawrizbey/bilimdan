import 'dotenv/config';
import { prisma } from './db';
import { hashPassword } from './lib/auth';

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
    title: 'Unit 1 — Family',
    order: 1,
    emoji: '👨‍👩‍👧',
    words: [
      { en: 'Parent', ipa: '/ˈpeərənt/', uz: 'Ota-ona', example: 'My parents work very hard every day.', emoji: '👪' },
      { en: 'Sibling', ipa: '/ˈsɪblɪŋ/', uz: 'Aka-uka, opa-singil', example: 'I have two siblings, a brother and a sister.', emoji: '👫' },
      { en: 'Grandmother', ipa: '/ˈɡrænmʌðə/', uz: 'Buvi', example: 'My grandmother bakes delicious bread.', emoji: '👵' },
      { en: 'Cousin', ipa: '/ˈkʌzən/', uz: 'Amakivachcha', example: 'My cousin lives in another city.', emoji: '🧑' },
      { en: 'Relative', ipa: '/ˈrelətɪv/', uz: 'Qarindosh', example: 'We invited all our relatives to the party.', emoji: '👨‍👩‍👧‍👦' },
    ],
  },
  {
    title: 'Unit 2 — School',
    order: 2,
    emoji: '🏫',
    words: [
      { en: 'Classroom', ipa: '/ˈklɑːsruːm/', uz: 'Sinfxona', example: 'Our classroom has twenty desks.', emoji: '🏫' },
      { en: 'Homework', ipa: '/ˈhəʊmwɜːk/', uz: 'Uy vazifasi', example: 'I always do my homework after dinner.', emoji: '📝' },
      { en: 'Teacher', ipa: '/ˈtiːtʃə/', uz: "O'qituvchi", example: 'Our teacher explains the lessons very clearly.', emoji: '👩‍🏫' },
      { en: 'Subject', ipa: '/ˈsʌbdʒɪkt/', uz: 'Fan (predmet)', example: 'Mathematics is my favorite subject.', emoji: '📚' },
      { en: 'Library', ipa: '/ˈlaɪbrəri/', uz: 'Kutubxona', example: 'I borrowed three books from the library.', emoji: '📖' },
    ],
  },
  {
    title: 'Unit 3 — Food',
    order: 3,
    emoji: '🍎',
    words: [
      { en: 'Breakfast', ipa: '/ˈbrekfəst/', uz: 'Nonushta', example: 'I eat breakfast at seven o\'clock.', emoji: '🍳' },
      { en: 'Vegetable', ipa: '/ˈvedʒtəbl/', uz: 'Sabzavot', example: 'Carrots and potatoes are vegetables.', emoji: '🥕' },
      { en: 'Delicious', ipa: '/dɪˈlɪʃəs/', uz: 'Mazali', example: 'This soup is absolutely delicious.', emoji: '😋' },
      { en: 'Recipe', ipa: '/ˈresəpi/', uz: 'Retsept', example: 'My mother has a great recipe for pilaf.', emoji: '📋' },
      { en: 'Thirsty', ipa: '/ˈθɜːsti/', uz: 'Chanqagan', example: 'I am very thirsty, can I have some water?', emoji: '🥤' },
    ],
  },
  {
    title: 'Unit 4 — Animals',
    order: 4,
    emoji: '🦁',
    words: [
      { en: 'Brave', ipa: '/breɪv/', uz: 'Jasur', example: 'The brave boy helped his friend.', emoji: '🦁' },
      { en: 'Forest', ipa: '/ˈfɒrɪst/', uz: "O'rmon", example: 'Many animals live in the forest.', emoji: '🌲' },
      { en: 'Curious', ipa: '/ˈkjʊəriəs/', uz: 'Qiziquvchan', example: 'A curious cat opened the box.', emoji: '🐱' },
      { en: 'Weather', ipa: '/ˈweðə/', uz: 'Ob-havo', example: 'The weather is sunny today.', emoji: '☀️' },
      { en: 'Journey', ipa: '/ˈdʒɜːni/', uz: 'Sayohat', example: 'Our journey to the sea was fun.', emoji: '🧭' },
    ],
  },
  {
    title: 'Unit 5 — Sport',
    order: 5,
    emoji: '⚽',
    words: [
      { en: 'Athlete', ipa: '/ˈæθliːt/', uz: 'Sportchi', example: 'The athlete trains every morning.', emoji: '🏃' },
      { en: 'Champion', ipa: '/ˈtʃæmpiən/', uz: 'Chempion', example: 'She became the champion of the competition.', emoji: '🏆' },
      { en: 'Exercise', ipa: '/ˈeksəsaɪz/', uz: 'Mashq', example: 'Daily exercise keeps you healthy.', emoji: '🏋️' },
      { en: 'Stadium', ipa: '/ˈsteɪdiəm/', uz: 'Stadion', example: 'Thousands of fans filled the stadium.', emoji: '🏟️' },
      { en: 'Victory', ipa: '/ˈvɪktəri/', uz: "G'alaba", example: 'Our team celebrated their victory.', emoji: '🥇' },
    ],
  },
  {
    title: 'Unit 6 — Travel',
    order: 6,
    emoji: '✈️',
    words: [
      { en: 'Passport', ipa: '/ˈpɑːspɔːt/', uz: 'Pasport', example: "Don't forget your passport at the airport.", emoji: '🛂' },
      { en: 'Luggage', ipa: '/ˈlʌɡɪdʒ/', uz: 'Bagaj', example: 'We packed our luggage the night before.', emoji: '🧳' },
      { en: 'Destination', ipa: '/ˌdestɪˈneɪʃən/', uz: 'Manzil', example: 'Our final destination is Samarkand.', emoji: '📍' },
      { en: 'Adventure', ipa: '/ədˈventʃə/', uz: 'Sarguzasht', example: 'Traveling abroad is a great adventure.', emoji: '🗺️' },
      { en: 'Souvenir', ipa: '/ˌsuːvəˈnɪə/', uz: 'Esdalik sovg\'a', example: 'I bought a souvenir for my friend.', emoji: '🎁' },
    ],
  },
];

const QUIZ_QUESTIONS = [
  { question: 'Choose: A place with many trees.', options: ['Desert', 'Forest', 'Ocean', 'City'], correctIndex: 1 },
  { question: '"Curious" means…', options: ['Bored', 'Tired', 'Inquisitive', 'Angry'], correctIndex: 2 },
  { question: 'Antonym of "brave"?', options: ['Bold', 'Strong', 'Coward', 'Kind'], correctIndex: 2 },
];

const LISTEN_QUESTIONS = [
  { sentence: 'The curious cat opened the box.', options: ['Furious', 'Curious', 'Serious', 'Carry'], correctIndex: 1 },
  { sentence: 'We had a long journey to the sea.', options: ['Journey', 'Money', 'Jungle', 'Jury'], correctIndex: 0 },
  { sentence: 'The weather is very sunny today.', options: ['Wealth', 'Whether', 'Weather', 'Wonder'], correctIndex: 2 },
];

const BATTLE_QUESTIONS = [
  { question: '"Brave" so\'zining ma\'nosi?', options: ["Qo'rqoq", 'Jasur', 'Sekin', 'Yangi'], correctIndex: 1 },
  { question: '"Forest" nima?', options: ['Dengiz', "Tog'", "O'rmon", "Cho'l"], correctIndex: 2 },
  { question: '"Fast" so\'zining ma\'nosi?', options: ['Tez', 'Issiq', 'Katta', 'Yumshoq'], correctIndex: 0 },
];

const BADGES: { key: string; title: string; desc: string; emoji: string; criteriaType: 'STREAK_GTE' | 'WORDS_KNOWN_GTE' | 'BATTLE_WINS_GTE' | 'SPEAK_ATTEMPTS_GTE'; criteriaValue: number }[] = [
  { key: 'olovli_start', title: 'Olovli start', desc: '7 kun ketma-ket', emoji: '🔥', criteriaType: 'STREAK_GTE', criteriaValue: 7 },
  { key: '100_soz', title: "100 so'z", desc: "100 ta so'z o'rganildi", emoji: '📚', criteriaType: 'WORDS_KNOWN_GTE', criteriaValue: 100 },
  { key: 'notiq', title: 'Notiq', desc: '50 talaffuz mashqi', emoji: '🎙️', criteriaType: 'SPEAK_ATTEMPTS_GTE', criteriaValue: 50 },
  { key: 'jangchi', title: 'Jangchi', desc: "10 batl g'alabasi", emoji: '⚔️', criteriaType: 'BATTLE_WINS_GTE', criteriaValue: 10 },
  { key: '500_soz', title: "500 so'z", desc: "500 ta so'z o'rganildi", emoji: '💎', criteriaType: 'WORDS_KNOWN_GTE', criteriaValue: 500 },
];

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
    const existing = await prisma.unit.findFirst({ where: { title: unit.title } });
    const createdUnit =
      existing ??
      (await prisma.unit.create({ data: { title: unit.title, order: unit.order, emoji: unit.emoji } }));
    if (unit.words) {
      for (let i = 0; i < unit.words.length; i++) {
        const w = unit.words[i];
        const existingWord = await prisma.word.findFirst({ where: { unitId: createdUnit.id, en: w.en } });
        if (!existingWord) {
          await prisma.word.create({
            data: { unitId: createdUnit.id, en: w.en, ipa: w.ipa, uz: w.uz, example: w.example, emoji: w.emoji, order: i },
          });
        }
      }
    }
  }

  console.log('Seeding quiz/listen/battle questions...');
  if ((await prisma.quizQuestion.count()) === 0) {
    await prisma.quizQuestion.createMany({
      data: QUIZ_QUESTIONS.map((q, i) => ({ ...q, order: i })),
    });
  }
  if ((await prisma.listenQuestion.count()) === 0) {
    await prisma.listenQuestion.createMany({
      data: LISTEN_QUESTIONS.map((q, i) => ({ ...q, order: i })),
    });
  }
  if ((await prisma.battleQuestion.count()) === 0) {
    await prisma.battleQuestion.createMany({
      data: BATTLE_QUESTIONS.map((q, i) => ({ ...q, order: i })),
    });
  }

  console.log('Seeding badges...');
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {},
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
        fullName: 'Aziz Karimov',
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
