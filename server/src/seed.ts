import 'dotenv/config';
import { prisma } from './db';
import { hashPassword } from './lib/auth';

// Region/district/school names are official place/institution names — left
// unchanged rather than guessed at in Karakalpak, per the same reasoning as the
// frontend's "don't translate proper nouns" rule.

// Generates sequential school names: ['1-son maktab', '2-son maktab', ..., 'n-son maktab']
const s = (n: number) => Array.from({ length: n }, (_, i) => `${i + 1}-son maktab`);

// Placeholder list for regions where exact school counts are not available.
const T = ['1-son maktab', '12-son maktab', '24-son maktab'];

// Appends an ixtisoslashtirilgan (specialized) school to a district's school list.
const ix = (schools: string[], ...names: string[]) => [...schools, ...names];

// Structure: region → { district → school names[] }
// Karakalpakstan school counts sourced from qrstat.uz (as of 01.01.2023).
// Ixtisoslashtirilgan maktab names sourced from PIIMA official document.
const REGIONS: Record<string, Record<string, string[]>> = {
  "Qoraqalpog'iston Respublikasi": {
    'Nukus shahri':       ix(s(60), 'Nukus shahar 1-son ixtisoslashtirilgan maktab-internati'),
    'Amudaryo tumani':    ix(s(86), 'Amudaryo tuman ixtisoslashtirilgan maktabi'),
    'Beruniy tumani':     ix(s(72), 'Beruniy tuman ixtisoslashtirilgan maktabi'),
    "Qonliko'l tumani":   ix(s(24), "Qonliko'l tuman ixtisoslashtirilgan maktab-internati"),
    "Qorao'zak tumani":   ix(s(33), "Qorao'zak tuman ixtisoslashtirilgan maktabi"),
    'Kegeyli tumani':     ix(s(39), 'Kegeyli tuman ixtisoslashtirilgan maktabi'),
    "Qo'ng'irot tumani":  ix(s(50), "Qo'ng'irot tuman ixtisoslashtirilgan maktab-internati"),
    "Mo'ynoq tumani":     ix(s(18), "Mo'ynoq tuman ixtisoslashtirilgan maktabi"),
    'Nukus tumani':       ix(s(33), 'Nukus tuman ixtisoslashtirilgan maktabi'),
    "Taxtako'pir tumani": ix(s(24), "Taxtako'pir tuman ixtisoslashtirilgan maktabi"),
    "To'rtko'l tumani":   ix(s(69), "To'rtko'l tuman ixtisoslashtirilgan maktabi"),
    "Xo'jayli tumani":    ix(s(44), "Xo'jayli tuman ixtisoslashtirilgan maktabi"),
    'Chimboy tumani':     ix(s(49), 'Chimboy tuman ixtisoslashtirilgan maktabi'),
    'Shumanay tumani':    ix(s(34), 'Shumanay tuman ixtisoslashtirilgan maktabi'),
    'Ellikqala tumani':   ix(s(73), "Ellikqal'a tuman ixtisoslashtirilgan maktab-internati"),
    'Taxiatosh tumani':   ix(s(23), 'Taxiatosh tuman ixtisoslashtirilgan maktabi'),
    "Bo'zatov tumani":    ix(s(15), "Bo'zatov tuman ixtisoslashtirilgan maktabi"),
  },
  'Andijon viloyati': {
    'Andijon shahri':        ix(T, 'Andijon shahar 1-son ixtisoslashtirilgan maktab-internati'),
    'Andijon tumani':        ix(T, 'Andijon tuman ixtisoslashtirilgan maktabi'),
    'Asaka tumani':          ix(T, 'Asaka tuman ixtisoslashtirilgan maktabi'),
    'Baliqchi tumani':       ix(T, 'Baliqchi tuman ixtisoslashtirilgan maktabi'),
    "Bo'ston tumani":        ix(T, "Bo'ston tuman ixtisoslashtirilgan maktabi"),
    'Izboskan tumani':       ix(T, 'Izboskan tuman ixtisoslashtirilgan maktabi'),
    'Marhamat tumani':       ix(T, 'Marhamat tuman ixtisoslashtirilgan maktabi'),
    "Oltinko'l tumani":      ix(T, "Oltinko'l tuman ixtisoslashtirilgan maktabi"),
    "Qo'rg'ontepa tumani":   ix(T, "Qo'rg'ontepa tuman ixtisoslashtirilgan maktabi"),
    'Shahrixon tumani':      ix(T, 'Shahrixon tuman ixtisoslashtirilgan maktabi'),
    "Ulug'nor tumani":       ix(T, "Ulug'nor tuman ixtisoslashtirilgan maktabi"),
    "Xo'jaobod tumani":      ix(T, "Xo'jaobod tuman ixtisoslashtirilgan maktabi"),
    'Xonobod shahri':        ix(T, 'Xonobod shahar ixtisoslashtirilgan maktabi'),
  },
  'Buxoro viloyati': {
    'Buxoro shahri':         ix(T, 'Buxoro shahar 2-son ixtisoslashtirilgan maktab-internati'),
    'Buxoro tumani':         ix(T, 'Buxoro tuman ixtisoslashtirilgan maktabi'),
    "G'ijduvon tumani":      ix(T, "G'ijduvon tuman ixtisoslashtirilgan maktab-internati"),
    'Jondor tumani':         ix(T, 'Jondor tuman ixtisoslashtirilgan maktabi'),
    'Kogon shahri':          ix(T, 'Kogon shahar ixtisoslashtirilgan maktabi'),
    'Kogon tumani':          ix(T, 'Kogon tuman ixtisoslashtirilgan maktabi'),
    'Olot tumani':           ix(T, 'Olot tuman ixtisoslashtirilgan maktab-internati'),
    'Peshku tumani':         ix(T, 'Peshku tuman ixtisoslashtirilgan maktabi'),
    'Shofirkon tumani':      ix(T, 'Shofirkon tuman ixtisoslashtirilgan maktabi'),
    'Vobkent tumani':        ix(T, 'Vobkent tuman ixtisoslashtirilgan maktabi'),
    'Qorovulbozor tumani':   ix(T, 'Qorovulbozor tuman ixtisoslashtirilgan maktabi'),
  },
  "Farg'ona viloyati": {
    "Bag'dod tumani":        ix(T, "Bag'dod tuman ixtisoslashtirilgan maktabi"),
    'Beshariq tumani':       ix(T, 'Beshariq tuman ixtisoslashtirilgan maktabi'),
    'Buvayda tumani':        ix(T, 'Buvayda tuman ixtisoslashtirilgan maktabi'),
    "Dang'ara tumani":       ix(T, "Dang'ara tuman ixtisoslashtirilgan maktabi"),
    "Farg'ona shahri":       ix(T, "Farg'ona shahar 1-son ixtisoslashtirilgan maktab-internati"),
    "Farg'ona tumani":       ix(T, "Farg'ona tuman ixtisoslashtirilgan maktabi"),
    'Furqat tumani':         ix(T, 'Furqat tuman ixtisoslashtirilgan maktabi'),
    "Marg'ilon shahri":      ix(T, "Marg'ilon shahar ixtisoslashtirilgan maktabi"),
    "O'zbekiston tumani":    ix(T, "O'zbekiston tuman ixtisoslashtirilgan maktab-internati"),
    'Oltiariq tumani':       ix(T, 'Oltiariq tuman ixtisoslashtirilgan maktabi'),
    "Qo'qon shahri":         ix(T, "Qo'qon shahar 1-son ixtisoslashtirilgan maktabi", "Qo'qon shahar 2-son ixtisoslashtirilgan maktabi"),
    "Qo'shtepa tumani":      ix(T, "Qo'shtepa tuman ixtisoslashtirilgan maktabi"),
    'Quva tumani':           ix(T, 'Quva tuman ixtisoslashtirilgan maktab-internati'),
    'Quvasoy shahri':        ix(T, 'Quvasoy shahar ixtisoslashtirilgan maktabi'),
    'Rishton tumani':        ix(T, 'Rishton tuman ixtisoslashtirilgan maktabi'),
    'Toshloq tumani':        ix(T, 'Toshloq tuman ixtisoslashtirilgan maktabi'),
    "Uchko'prik tumani":     ix(T, "Uchko'prik tuman ixtisoslashtirilgan maktabi"),
    'Yozyovon tumani':       ix(T, 'Yozyovon tuman ixtisoslashtirilgan maktabi'),
  },
  'Jizzax viloyati': {
    'Arnasoy tumani':        ix(T, 'Arnasoy tuman ixtisoslashtirilgan maktabi'),
    'Baxmal tumani':         ix(T, 'Baxmal tuman ixtisoslashtirilgan maktabi'),
    "Do'stlik tumani":       ix(T, "Do'stlik tuman ixtisoslashtirilgan maktabi"),
    'Forish tumani':         ix(T, 'Forish tuman ixtisoslashtirilgan maktabi'),
    'Jizzax shahri':         ix(T, 'Jizzax shahar 1-son ixtisoslashtirilgan maktab-internati', 'Jizzax shahar 2-son ixtisoslashtirilgan maktab-internati', 'Jizzax shahar 3-son ixtisoslashtirilgan maktabi'),
    'Paxtakor tumani':       ix(T, 'Paxtakor tuman ixtisoslashtirilgan maktabi'),
    'Sharof Rashidov tumani':ix(T, 'Sharof Rashidov tuman ixtisoslashtirilgan maktabi'),
    'Zafarobod tumani':      ix(T, 'Zafarobod tuman ixtisoslashtirilgan maktabi'),
    'Zarbdor tumani':        ix(T, 'Zarbdor tuman ixtisoslashtirilgan maktabi'),
  },
  'Xorazm viloyati': {
    'Urganch shahri': T, 'Xiva shahri': T, 'Shovot tumani': T, 'Hazorasp tumani': T,
  },
  'Namangan viloyati': {
    'Chortoq tumani':        ix(T, 'Chortoq tuman ixtisoslashtirilgan maktabi'),
    'Chust tumani':          ix(T, 'Chust tuman ixtisoslashtirilgan maktabi'),
    'Kosonsoy tumani':       ix(T, 'Kosonsoy tuman ixtisoslashtirilgan maktabi'),
    'Mingbuloq tumani':      ix(T, 'Mingbuloq tuman ixtisoslashtirilgan maktabi'),
    'Namangan shahri':       ix(T, 'Namangan shahar 1-son ixtisoslashtirilgan maktab-internati'),
    'Namangan tumani':       ix(T, 'Namangan tuman ixtisoslashtirilgan maktabi'),
    'Norin tumani':          ix(T, 'Norin tuman ixtisoslashtirilgan maktabi'),
    "To'raqo'rg'on tumani":  ix(T, "To'raqo'rg'on tuman ixtisoslashtirilgan maktabi"),
    "Uchqo'rg'on tumani":    ix(T, "Uchqo'rg'on tuman ixtisoslashtirilgan maktabi"),
    'Uychi tumani':          ix(T, 'Uychi tuman ixtisoslashtirilgan maktabi'),
    'Yangi Namangan tumani': ix(T, 'Yangi Namangan tuman ixtisoslashtirilgan maktabi'),
    "Yangiqo'rg'on tumani":  ix(T, "Yangiqo'rg'on tuman ixtisoslashtirilgan maktabi"),
  },
  'Navoiy viloyati': {
    'Konimex tumani':        ix(T, 'Konimex tuman ixtisoslashtirilgan maktabi'),
    'Navbahor tumani':       ix(T, 'Navbahor tuman ixtisoslashtirilgan maktabi'),
    'Navoiy shahri':         ix(T, 'Navoiy shahar 1-son ixtisoslashtirilgan maktab-internati'),
    'Nurota tumani':         ix(T, 'Nurota tuman ixtisoslashtirilgan maktabi'),
    'Qiziltepa tumani':      ix(T, 'Qiziltepa tuman ixtisoslashtirilgan maktabi'),
    'Tomdi tumani':          ix(T, 'Tomdi tuman ixtisoslashtirilgan maktab-internati'),
    'Xatirchi tumani':       ix(T, 'Xatirchi tuman ixtisoslashtirilgan maktabi'),
  },
  'Qashqadaryo viloyati': {
    'Chiroqchi tumani':      ix(T, 'Chiroqchi tuman ixtisoslashtirilgan maktabi'),
    'Dehqonobod tumani':     ix(T, 'Dehqonobod tuman ixtisoslashtirilgan maktabi'),
    'Kasbi tumani':          ix(T, 'Kasbi tuman ixtisoslashtirilgan maktabi'),
    'Kitob tumani':          ix(T, 'Kitob tuman ixtisoslashtirilgan maktab-internati'),
    'Koson tumani':          ix(T, 'Koson tuman ixtisoslashtirilgan maktabi'),
    'Muborak tumani':        ix(T, 'Muborak tuman ixtisoslashtirilgan maktabi'),
    'Nishon tumani':         ix(T, 'Nishon tuman ixtisoslashtirilgan maktabi'),
    'Qamashi tumani':        ix(T, 'Qamashi tuman ixtisoslashtirilgan maktabi'),
    'Qarshi shahri':         ix(T, 'Qarshi shahar 1-son ixtisoslashtirilgan maktab-internati'),
    'Qarshi tumani':         ix(T, 'Qarshi tuman ixtisoslashtirilgan maktabi'),
    'Shahrisabz shahri':     ix(T, 'Shahrisabz shahar ixtisoslashtirilgan maktabi'),
    'Shahrisabz tumani':     ix(T, 'Shahrisabz tuman ixtisoslashtirilgan maktabi'),
    "Yakkabog' tumani":      ix(T, "Yakkabog' tuman ixtisoslashtirilgan maktabi"),
  },
  'Samarqand viloyati': {
    'Ishtixon tumani':       ix(T, 'Ishtixon tuman ixtisoslashtirilgan maktabi'),
    "Kattaqo'rg'on shahri":  ix(T, "Kattaqo'rg'on shahar ixtisoslashtirilgan maktabi"),
    "Kattaqo'rg'on tumani":  ix(T, "Kattaqo'rg'on tuman ixtisoslashtirilgan maktabi"),
    'Narpay tumani':         ix(T, 'Narpay tuman ixtisoslashtirilgan maktabi'),
    'Nurobod tumani':        ix(T, 'Nurobod tuman ixtisoslashtirilgan maktab-internati'),
    'Oqdaryo tumani':        ix(T, 'Oqdaryo tuman ixtisoslashtirilgan maktabi'),
    "Pastdarg'om tumani":    ix(T, "Pastdarg'om tuman ixtisoslashtirilgan maktabi"),
    'Paxtachi tumani':       ix(T, 'Paxtachi tuman ixtisoslashtirilgan maktab-internati'),
    'Payariq tumani':        ix(T, 'Payariq tuman ixtisoslashtirilgan maktabi'),
    "Qo'shrabot tumani":     ix(T, "Qo'shrabot tuman 1-son ixtisoslashtirilgan maktab-internati", "Qo'shrabot tuman 2-son ixtisoslashtirilgan maktabi"),
    'Samarqand shahri':      T,
    'Samarqand tumani':      ix(T, 'Samarqand tuman ixtisoslashtirilgan maktabi'),
    'Toyloq tumani':         ix(T, 'Toyloq tuman ixtisoslashtirilgan maktabi'),
    'Urgut tumani':          ix(T, 'Urgut tuman ixtisoslashtirilgan maktabi'),
  },
  'Sirdaryo viloyati': {
    'Boyovut tumani':        ix(T, 'Boyovut tuman ixtisoslashtirilgan maktabi'),
    'Guliston shahri':       ix(T, 'Guliston shahar 1-son ixtisoslashtirilgan maktab-internati', 'Guliston shahar 2-son ixtisoslashtirilgan maktab-internati'),
    'Guliston tumani':       ix(T, 'Guliston tuman ixtisoslashtirilgan maktab-internati'),
    'Mirzaobod tumani':      ix(T, 'Mirzaobod tuman ixtisoslashtirilgan maktabi'),
    'Oqoltin tumani':        ix(T, 'Oqoltin tuman ixtisoslashtirilgan maktabi'),
    'Sardoba tumani':        ix(T, 'Sardoba tuman ixtisoslashtirilgan maktabi'),
    'Sayxunobod tumani':     ix(T, 'Sayxunobod tuman ixtisoslashtirilgan maktabi'),
    'Shirin shahri':         ix(T, 'Shirin shahar ixtisoslashtirilgan maktabi'),
    'Yangiyer shahri':       ix(T, 'Yangiyer shahar ixtisoslashtirilgan maktabi'),
  },
  'Surxondaryo viloyati': {
    'Angor tumani':          ix(T, 'Angor tuman ixtisoslashtirilgan maktabi'),
    'Bandixon tumani':       ix(T, 'Bandixon tuman ixtisoslashtirilgan maktabi'),
    'Boysun tumani':         ix(T, 'Boysun tuman ixtisoslashtirilgan maktabi'),
    'Denov tumani':          ix(T, 'Denov tuman 1-son ixtisoslashtirilgan maktabi', 'Denov tuman 2-son ixtisoslashtirilgan maktab-internati'),
    "Jarqo'rg'on tumani":    ix(T, "Jarqo'rg'on tuman ixtisoslashtirilgan maktabi"),
    'Muzrabot tumani':       ix(T, 'Muzrabot tuman ixtisoslashtirilgan maktabi'),
    'Oltinsoy tumani':       ix(T, 'Oltinsoy tuman ixtisoslashtirilgan maktabi'),
    'Qiziriq tumani':        ix(T, 'Qiziriq tuman ixtisoslashtirilgan maktabi'),
    "Qumqo'rg'on tumani":    ix(T, "Qumqo'rg'on tuman ixtisoslashtirilgan maktabi"),
    'Sariosiyo tumani':      ix(T, 'Sariosiyo tuman ixtisoslashtirilgan maktab-internati'),
    'Sherobod tumani':       ix(T, 'Sherobod tuman ixtisoslashtirilgan maktabi'),
    "Sho'rchi tumani":       ix(T, "Sho'rchi tuman ixtisoslashtirilgan maktabi"),
    'Termiz shahri':         ix(T, 'Termiz shahar 1-son ixtisoslashtirilgan maktab-internati', 'Termiz shahar 2-son ixtisoslashtirilgan maktab-internati', 'Termiz shahar 3-son ixtisoslashtirilgan maktabi'),
    'Uzun tumani':           ix(T, 'Uzun tuman ixtisoslashtirilgan maktabi'),
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
