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
  {
    title: '7-tema — Dene',
    order: 7,
    emoji: '🫀',
    words: [
      { en: 'Head', ipa: '/hed/', uz: 'Bas', example: 'My head hurts after studying all night.', emoji: '🗣️' },
      { en: 'Eye', ipa: '/aɪ/', uz: 'Kóz', example: 'She has beautiful green eyes.', emoji: '👁️' },
      { en: 'Ear', ipa: '/ɪə/', uz: 'Qulaǵ', example: 'He put his hand to his ear to hear better.', emoji: '👂' },
      { en: 'Nose', ipa: '/nəʊz/', uz: 'Murnı', example: 'The dog uses its nose to find food.', emoji: '👃' },
      { en: 'Mouth', ipa: '/maʊθ/', uz: 'Awız', example: 'Open your mouth wide at the dentist.', emoji: '👄' },
      { en: 'Hand', ipa: '/hænd/', uz: 'Qol', example: 'She raised her hand to answer the question.', emoji: '🤚' },
      { en: 'Foot', ipa: '/fʊt/', uz: 'Ayaq', example: 'My foot hurts after the long walk.', emoji: '🦶' },
      { en: 'Heart', ipa: '/hɑːt/', uz: 'Júrek', example: 'Exercise makes your heart stronger.', emoji: '❤️' },
      { en: 'Skin', ipa: '/skɪn/', uz: 'Teri', example: 'Use sunscreen to protect your skin.', emoji: '🧴' },
      { en: 'Shoulder', ipa: '/ˈʃəʊldə/', uz: 'Iyın', example: 'He carried the bag on his shoulder.', emoji: '💪' },
      { en: 'Finger', ipa: '/ˈfɪŋɡə/', uz: 'Barmaq', example: 'She pointed her finger at the map.', emoji: '☝️' },
      { en: 'Tooth', ipa: '/tuːθ/', uz: 'Tis', example: 'Brush your teeth twice a day.', emoji: '🦷' },
      { en: 'Tongue', ipa: '/tʌŋ/', uz: 'Til', example: 'The tongue helps us taste food.', emoji: '👅' },
      { en: 'Neck', ipa: '/nek/', uz: 'Boyın', example: 'She wore a necklace around her neck.', emoji: '🧣' },
      { en: 'Back', ipa: '/bæk/', uz: 'Arqa', example: 'He hurt his back while lifting heavy boxes.', emoji: '🏃' },
    ],
  },
  {
    title: '8-tema — Renkler',
    order: 8,
    emoji: '🎨',
    words: [
      { en: 'Red', ipa: '/red/', uz: 'Qızıl', example: 'The apple is bright red and shiny.', emoji: '🔴' },
      { en: 'Blue', ipa: '/bluː/', uz: 'Kók', example: 'The sky is clear and blue today.', emoji: '🔵' },
      { en: 'Yellow', ipa: '/ˈjeləʊ/', uz: 'Sarı', example: 'Sunflowers are bright yellow flowers.', emoji: '🟡' },
      { en: 'Green', ipa: '/ɡriːn/', uz: 'Jasıl', example: 'The grass in the garden is green.', emoji: '🟢' },
      { en: 'White', ipa: '/waɪt/', uz: 'Aq', example: 'She wore a white dress at the ceremony.', emoji: '⬜' },
      { en: 'Black', ipa: '/blæk/', uz: 'Qara', example: 'He has a black cat named Shadow.', emoji: '⬛' },
      { en: 'Orange', ipa: '/ˈɒrɪndʒ/', uz: 'Jıltır', example: 'I ate a sweet orange for breakfast.', emoji: '🟠' },
      { en: 'Pink', ipa: '/pɪŋk/', uz: 'Gúlgín', example: 'She painted her room pink.', emoji: '🩷' },
      { en: 'Purple', ipa: '/ˈpɜːpl/', uz: 'Kúlgín', example: 'The queen wore a purple robe.', emoji: '🟣' },
      { en: 'Gray', ipa: '/ɡreɪ/', uz: 'Súr', example: 'The sky turns gray before it rains.', emoji: '🩶' },
      { en: 'Brown', ipa: '/braʊn/', uz: 'Qońır', example: 'The dog has soft brown fur.', emoji: '🟫' },
      { en: 'Gold', ipa: '/ɡəʊld/', uz: 'Altın renkli', example: 'The trophy is made of shiny gold metal.', emoji: '🥇' },
      { en: 'Silver', ipa: '/ˈsɪlvə/', uz: 'Kúmis renkli', example: 'She wore a silver bracelet on her wrist.', emoji: '🥈' },
      { en: 'Dark', ipa: '/dɑːk/', uz: 'Tún qaralıǵı', example: 'The room was very dark at night.', emoji: '🌑' },
      { en: 'Light', ipa: '/laɪt/', uz: 'Aqshıl', example: 'She chose a light blue color for the walls.', emoji: '💡' },
    ],
  },
  {
    title: '9-tema — Sanlar',
    order: 9,
    emoji: '🔢',
    words: [
      { en: 'One', ipa: '/wʌn/', uz: 'Bir', example: 'I have one brother and two sisters.', emoji: '1️⃣' },
      { en: 'Two', ipa: '/tuː/', uz: 'Eki', example: 'She has two cats at home.', emoji: '2️⃣' },
      { en: 'Three', ipa: '/θriː/', uz: 'Úsh', example: 'We need three cups of flour for the cake.', emoji: '3️⃣' },
      { en: 'Four', ipa: '/fɔː/', uz: 'Tórt', example: 'A table has four legs.', emoji: '4️⃣' },
      { en: 'Five', ipa: '/faɪv/', uz: 'Bes', example: 'I wake up at five in the morning.', emoji: '5️⃣' },
      { en: 'Six', ipa: '/sɪks/', uz: 'Altı', example: 'There are six eggs in the box.', emoji: '6️⃣' },
      { en: 'Seven', ipa: '/ˈsevən/', uz: 'Jeti', example: 'A week has seven days.', emoji: '7️⃣' },
      { en: 'Eight', ipa: '/eɪt/', uz: 'Segiz', example: 'She drinks eight glasses of water daily.', emoji: '8️⃣' },
      { en: 'Nine', ipa: '/naɪn/', uz: 'Toǵız', example: 'A cat is said to have nine lives.', emoji: '9️⃣' },
      { en: 'Ten', ipa: '/ten/', uz: 'On', example: 'I scored ten out of ten on the test.', emoji: '🔟' },
      { en: 'Eleven', ipa: '/ɪˈlevən/', uz: 'On bir', example: 'There are eleven players in a football team.', emoji: '🔢' },
      { en: 'Twelve', ipa: '/twelv/', uz: 'On eki', example: 'There are twelve months in a year.', emoji: '📅' },
      { en: 'Fifteen', ipa: '/fɪfˈtiːn/', uz: 'On bes', example: 'The movie starts in fifteen minutes.', emoji: '⏱️' },
      { en: 'Twenty', ipa: '/ˈtwenti/', uz: 'Jiyrma', example: 'She is twenty years old this year.', emoji: '🔢' },
      { en: 'Hundred', ipa: '/ˈhʌndrəd/', uz: 'Júz', example: 'A century is a hundred years.', emoji: '💯' },
    ],
  },
  {
    title: '10-tema — Kún hám ay',
    order: 10,
    emoji: '📅',
    words: [
      { en: 'Monday', ipa: '/ˈmʌndeɪ/', uz: 'Dúysenbi', example: 'School starts again on Monday morning.', emoji: '📅' },
      { en: 'Tuesday', ipa: '/ˈtjuːzdeɪ/', uz: 'Seysenbi', example: 'We have a science test on Tuesday.', emoji: '📅' },
      { en: 'Wednesday', ipa: '/ˈwenzdeɪ/', uz: 'Sársenbi', example: 'The library is closed on Wednesday.', emoji: '📅' },
      { en: 'Thursday', ipa: '/ˈθɜːzdeɪ/', uz: 'Beysenbi', example: 'My piano lesson is every Thursday.', emoji: '📅' },
      { en: 'Friday', ipa: '/ˈfraɪdeɪ/', uz: 'Juma', example: 'Students are happy when Friday comes.', emoji: '📅' },
      { en: 'Saturday', ipa: '/ˈsætədeɪ/', uz: 'Senbi', example: 'We go to the park every Saturday.', emoji: '🎉' },
      { en: 'Sunday', ipa: '/ˈsʌndeɪ/', uz: 'Jeksembi', example: 'Sunday is a day of rest for many people.', emoji: '☀️' },
      { en: 'January', ipa: '/ˈdʒænjuəri/', uz: 'Yanvar', example: 'January is the first month of the year.', emoji: '❄️' },
      { en: 'March', ipa: '/mɑːtʃ/', uz: 'Mart', example: 'Spring begins in March.', emoji: '🌸' },
      { en: 'Summer', ipa: '/ˈsʌmə/', uz: 'Jaz', example: 'We go swimming in summer.', emoji: '☀️' },
      { en: 'Autumn', ipa: '/ˈɔːtəm/', uz: 'Kúz', example: 'Leaves fall from trees in autumn.', emoji: '🍂' },
      { en: 'Winter', ipa: '/ˈwɪntə/', uz: 'Qıs', example: 'It snows a lot in winter.', emoji: '❄️' },
      { en: 'Spring', ipa: '/sprɪŋ/', uz: 'Báhár', example: 'Flowers bloom beautifully in spring.', emoji: '🌷' },
      { en: 'Month', ipa: '/mʌnθ/', uz: 'Ay', example: 'There are twelve months in one year.', emoji: '🗓️' },
      { en: 'Year', ipa: '/jɪə/', uz: 'Jıl', example: 'We celebrate New Year every year.', emoji: '🎆' },
    ],
  },
  {
    title: '11-tema — Hawa-rayı',
    order: 11,
    emoji: '🌤️',
    words: [
      { en: 'Cold', ipa: '/kəʊld/', uz: 'Sawıq', example: 'It is very cold outside today.', emoji: '🥶' },
      { en: 'Hot', ipa: '/hɒt/', uz: 'Issıq', example: 'The desert is very hot in summer.', emoji: '🥵' },
      { en: 'Rain', ipa: '/reɪn/', uz: 'Jawın', example: 'We need an umbrella when it rains.', emoji: '🌧️' },
      { en: 'Snow', ipa: '/snəʊ/', uz: 'Qar', example: 'Children love to play in the snow.', emoji: '❄️' },
      { en: 'Wind', ipa: '/wɪnd/', uz: 'Jel', example: 'The strong wind blew my hat away.', emoji: '💨' },
      { en: 'Cloud', ipa: '/klaʊd/', uz: 'Bulıt', example: 'A dark cloud covered the sun.', emoji: '☁️' },
      { en: 'Sunny', ipa: '/ˈsʌni/', uz: 'Kúnli', example: 'It is a sunny day, perfect for a picnic.', emoji: '☀️' },
      { en: 'Warm', ipa: '/wɔːm/', uz: 'Ilıq', example: 'Spring brings warm and pleasant weather.', emoji: '🌤️' },
      { en: 'Thunder', ipa: '/ˈθʌndə/', uz: 'Gúrildew', example: 'The loud thunder woke me up at night.', emoji: '⛈️' },
      { en: 'Fog', ipa: '/fɒɡ/', uz: 'Tozan', example: 'The fog was so thick we could not see the road.', emoji: '🌫️' },
      { en: 'Storm', ipa: '/stɔːm/', uz: 'Boran', example: 'A big storm destroyed many trees.', emoji: '🌪️' },
      { en: 'Rainbow', ipa: '/ˈreɪnbəʊ/', uz: 'Kempir-qosaq', example: 'A beautiful rainbow appeared after the rain.', emoji: '🌈' },
      { en: 'Temperature', ipa: '/ˈtemprɪtʃə/', uz: 'Temperatura', example: 'The temperature dropped below zero.', emoji: '🌡️' },
      { en: 'Umbrella', ipa: '/ʌmˈbrelə/', uz: 'Shemshir', example: 'Always carry an umbrella in rainy weather.', emoji: '☂️' },
      { en: 'Forecast', ipa: '/ˈfɔːkɑːst/', uz: 'Hawa boljamı', example: 'The weather forecast says it will rain tomorrow.', emoji: '📡' },
    ],
  },
  {
    title: '12-tema — Kiyim',
    order: 12,
    emoji: '👕',
    words: [
      { en: 'Shirt', ipa: '/ʃɜːt/', uz: 'Kóylek', example: 'He wore a white shirt to the meeting.', emoji: '👕' },
      { en: 'Trousers', ipa: '/ˈtraʊzəz/', uz: 'Shálbar', example: 'She bought new blue trousers from the shop.', emoji: '👖' },
      { en: 'Dress', ipa: '/dres/', uz: 'Kóshek', example: 'She wore a beautiful red dress to the party.', emoji: '👗' },
      { en: 'Shoes', ipa: '/ʃuːz/', uz: 'Ayaq kiyim', example: 'Please take off your shoes at the door.', emoji: '👟' },
      { en: 'Coat', ipa: '/kəʊt/', uz: 'Shapan', example: 'She put on her coat before going outside.', emoji: '🧥' },
      { en: 'Jacket', ipa: '/ˈdʒækɪt/', uz: 'Jetken', example: 'He wore a warm jacket in the cold weather.', emoji: '🫙' },
      { en: 'Hat', ipa: '/hæt/', uz: 'Qalpaq', example: 'He wore a hat to protect himself from the sun.', emoji: '🎩' },
      { en: 'Gloves', ipa: '/ɡlʌvz/', uz: 'Qolqap', example: 'She put on warm gloves before going out.', emoji: '🧤' },
      { en: 'Socks', ipa: '/sɒks/', uz: 'Shúlpek', example: 'Always wear clean socks to school.', emoji: '🧦' },
      { en: 'Scarf', ipa: '/skɑːf/', uz: 'Mánger', example: 'She wrapped a warm scarf around her neck.', emoji: '🧣' },
      { en: 'Boots', ipa: '/buːts/', uz: 'Etik', example: 'He wore rubber boots in the rain.', emoji: '🥾' },
      { en: 'Uniform', ipa: '/ˈjuːnɪfɔːm/', uz: 'Forma', example: 'Students wear a uniform to school every day.', emoji: '👔' },
      { en: 'Belt', ipa: '/belt/', uz: 'Belbaw', example: 'He tightened his belt before the race.', emoji: '⚙️' },
      { en: 'Button', ipa: '/ˈbʌtən/', uz: 'Túyme', example: 'A button fell off my shirt today.', emoji: '🔘' },
      { en: 'Pocket', ipa: '/ˈpɒkɪt/', uz: 'Jep', example: 'He kept his phone in his pocket.', emoji: '👖' },
    ],
  },
  {
    title: '13-tema — Transport',
    order: 13,
    emoji: '🚌',
    words: [
      { en: 'Bus', ipa: '/bʌs/', uz: 'Awtobus', example: 'I take the bus to school every morning.', emoji: '🚌' },
      { en: 'Car', ipa: '/kɑː/', uz: 'Mashına', example: 'My father drives his car to work.', emoji: '🚗' },
      { en: 'Train', ipa: '/treɪn/', uz: 'Poyız', example: 'The train arrives at the station at noon.', emoji: '🚂' },
      { en: 'Airplane', ipa: '/ˈeəpleɪn/', uz: 'Ushaq', example: 'We took an airplane to visit my grandparents.', emoji: '✈️' },
      { en: 'Bicycle', ipa: '/ˈbaɪsɪkl/', uz: 'Velosiped', example: 'She rides her bicycle to school every day.', emoji: '🚲' },
      { en: 'Ship', ipa: '/ʃɪp/', uz: 'Kemege', example: 'The large ship sailed across the ocean.', emoji: '🚢' },
      { en: 'Metro', ipa: '/ˈmetrəʊ/', uz: 'Metro', example: 'The metro is the fastest way to travel in the city.', emoji: '🚇' },
      { en: 'Taxi', ipa: '/ˈtæksi/', uz: 'Taksi', example: 'We called a taxi to go to the airport.', emoji: '🚕' },
      { en: 'Motorcycle', ipa: '/ˈməʊtəsaɪkl/', uz: 'Mototsikl', example: 'He drives a red motorcycle through the city.', emoji: '🏍️' },
      { en: 'Boat', ipa: '/bəʊt/', uz: 'Qayrıq', example: 'We rowed a small boat across the lake.', emoji: '🚣' },
      { en: 'Truck', ipa: '/trʌk/', uz: 'Yük mashınası', example: 'A truck delivers goods to the shops.', emoji: '🚚' },
      { en: 'Helicopter', ipa: '/ˈhelɪkɒptə/', uz: 'Vertolyot', example: 'The helicopter flew over the mountain.', emoji: '🚁' },
      { en: 'Tram', ipa: '/træm/', uz: 'Tram', example: 'The old city has a tram that runs through the center.', emoji: '🚃' },
      { en: 'Ferry', ipa: '/ˈferi/', uz: 'Parom', example: 'We took a ferry to reach the island.', emoji: '⛴️' },
      { en: 'Ticket', ipa: '/ˈtɪkɪt/', uz: 'Bilet', example: 'Please buy your ticket before boarding.', emoji: '🎫' },
    ],
  },
  {
    title: '14-tema — Qala',
    order: 14,
    emoji: '🏙️',
    words: [
      { en: 'Shop', ipa: '/ʃɒp/', uz: 'Dúkan', example: 'I went to the shop to buy some fruit.', emoji: '🛒' },
      { en: 'Restaurant', ipa: '/ˈrestrɒnt/', uz: 'Awqatxana', example: 'We had dinner at a nice restaurant.', emoji: '🍽️' },
      { en: 'Cinema', ipa: '/ˈsɪnɪmə/', uz: 'Keshane', example: 'We watched a new film at the cinema.', emoji: '🎬' },
      { en: 'Hospital', ipa: '/ˈhɒspɪtl/', uz: 'Awruwhana', example: 'My uncle works as a nurse in a hospital.', emoji: '🏥' },
      { en: 'Bank', ipa: '/bæŋk/', uz: 'Bank', example: 'She went to the bank to get some money.', emoji: '🏦' },
      { en: 'Mosque', ipa: '/mɒsk/', uz: 'Meshit', example: 'People go to the mosque on Friday.', emoji: '🕌' },
      { en: 'Park', ipa: '/pɑːk/', uz: 'Park', example: 'Children love playing in the park.', emoji: '🌳' },
      { en: 'Market', ipa: '/ˈmɑːkɪt/', uz: 'Bazar', example: 'My mother buys vegetables at the market.', emoji: '🏪' },
      { en: 'Street', ipa: '/striːt/', uz: 'Kóshe', example: 'The street is busy with cars and people.', emoji: '🛣️' },
      { en: 'Bridge', ipa: '/brɪdʒ/', uz: 'Kópir', example: 'We crossed the bridge over the river.', emoji: '🌉' },
      { en: 'Airport', ipa: '/ˈeəpɔːt/', uz: 'Aeroport', example: 'We arrived at the airport two hours early.', emoji: '✈️' },
      { en: 'Hotel', ipa: '/həʊˈtel/', uz: 'Myhmanhana', example: 'We stayed at a comfortable hotel near the beach.', emoji: '🏨' },
      { en: 'Museum', ipa: '/mjuːˈziːəm/', uz: 'Muzey', example: 'The museum has many ancient artifacts.', emoji: '🏛️' },
      { en: 'Station', ipa: '/ˈsteɪʃən/', uz: 'Stansiya', example: 'The bus station is near the city center.', emoji: '🚉' },
      { en: 'Square', ipa: '/skweə/', uz: 'Meydan', example: 'People gather at the main square for festivals.', emoji: '🏟️' },
    ],
  },
  {
    title: '15-tema — Tábiyat',
    order: 15,
    emoji: '🌿',
    words: [
      { en: 'River', ipa: '/ˈrɪvə/', uz: 'Derya', example: 'The river flows through the middle of the city.', emoji: '🏞️' },
      { en: 'Sea', ipa: '/siː/', uz: 'Teńiz', example: 'We swam in the sea during our holiday.', emoji: '🌊' },
      { en: 'Mountain', ipa: '/ˈmaʊntɪn/', uz: 'Taw', example: 'The mountain peak is covered with snow.', emoji: '⛰️' },
      { en: 'Desert', ipa: '/ˈdezət/', uz: 'Shól', example: 'It is very hot in the desert during the day.', emoji: '🏜️' },
      { en: 'Lake', ipa: '/leɪk/', uz: 'Gólet', example: 'We fished in the lake near our village.', emoji: '🏔️' },
      { en: 'Earth', ipa: '/ɜːθ/', uz: 'Jer', example: 'We must protect the earth from pollution.', emoji: '🌍' },
      { en: 'Grass', ipa: '/ɡrɑːs/', uz: 'Ot', example: 'The grass in the field is fresh and green.', emoji: '🌿' },
      { en: 'Flower', ipa: '/ˈflaʊə/', uz: 'Gúl', example: 'She picked a beautiful flower from the garden.', emoji: '🌸' },
      { en: 'Tree', ipa: '/triː/', uz: 'Daraxt', example: 'The old tree in our garden gives great shade.', emoji: '🌳' },
      { en: 'Sky', ipa: '/skaɪ/', uz: 'Áseman', example: 'The sky is full of stars at night.', emoji: '🌌' },
      { en: 'Moon', ipa: '/muːn/', uz: 'Ay', example: 'The moon shines brightly on clear nights.', emoji: '🌙' },
      { en: 'Star', ipa: '/stɑː/', uz: 'Jıldız', example: 'We counted the stars in the night sky.', emoji: '⭐' },
      { en: 'Ocean', ipa: '/ˈəʊʃən/', uz: 'Okean', example: 'The ocean covers more than half of the Earth.', emoji: '🌊' },
      { en: 'Island', ipa: '/ˈaɪlənd/', uz: 'Aral', example: 'The island has beautiful beaches and forests.', emoji: '🏝️' },
      { en: 'Cave', ipa: '/keɪv/', uz: 'Úńgir', example: 'Bats sleep inside the dark cave.', emoji: '🦇' },
    ],
  },
  {
    title: '16-tema — Kásip',
    order: 16,
    emoji: '👨‍💼',
    words: [
      { en: 'Doctor', ipa: '/ˈdɒktə/', uz: 'Doktor', example: 'The doctor examined my sore throat carefully.', emoji: '👨‍⚕️' },
      { en: 'Engineer', ipa: '/ˌendʒɪˈnɪə/', uz: 'Injener', example: 'The engineer designed the new bridge.', emoji: '👷' },
      { en: 'Cook', ipa: '/kʊk/', uz: 'Ashpaz', example: 'The cook prepared a delicious meal for everyone.', emoji: '👨‍🍳' },
      { en: 'Lawyer', ipa: '/ˈlɔːjə/', uz: 'Sháwkım', example: 'The lawyer helped us understand our rights.', emoji: '⚖️' },
      { en: 'Pilot', ipa: '/ˈpaɪlət/', uz: 'Pilot', example: 'The pilot announced we would land in ten minutes.', emoji: '✈️' },
      { en: 'Programmer', ipa: '/ˈprəʊɡræmə/', uz: 'Programshı', example: 'The programmer fixed the bug in the app.', emoji: '💻' },
      { en: 'Artist', ipa: '/ˈɑːtɪst/', uz: 'Sáwletker', example: 'The artist painted a beautiful landscape.', emoji: '🎨' },
      { en: 'Journalist', ipa: '/ˈdʒɜːnəlɪst/', uz: 'Jurnalist', example: 'The journalist reported on the important event.', emoji: '📰' },
      { en: 'Farmer', ipa: '/ˈfɑːmə/', uz: 'Fermer', example: 'The farmer grows wheat and vegetables.', emoji: '👨‍🌾' },
      { en: 'Nurse', ipa: '/nɜːs/', uz: 'Medsestra', example: 'The nurse gave the patient medicine on time.', emoji: '👩‍⚕️' },
      { en: 'Driver', ipa: '/ˈdraɪvə/', uz: 'Shofyor', example: 'The bus driver stopped at every station.', emoji: '🚗' },
      { en: 'Scientist', ipa: '/ˈsaɪəntɪst/', uz: 'Ilimpaz', example: 'The scientist discovered a new medicine.', emoji: '🔬' },
      { en: 'Architect', ipa: '/ˈɑːkɪtekt/', uz: 'Mimar', example: 'The architect designed a modern school building.', emoji: '🏗️' },
      { en: 'Worker', ipa: '/ˈwɜːkə/', uz: 'Ishchi', example: 'The factory worker starts early every morning.', emoji: '🔧' },
      { en: 'Police', ipa: '/pəˈliːs/', uz: 'Politsiya', example: 'The police officer helped the lost child find her parents.', emoji: '👮' },
    ],
  },
  {
    title: '17-tema — Densawlıq',
    order: 17,
    emoji: '🏥',
    words: [
      { en: 'Pain', ipa: '/peɪn/', uz: 'Awırıw', example: 'She felt a sharp pain in her leg.', emoji: '😣' },
      { en: 'Medicine', ipa: '/ˈmedsən/', uz: 'Dári-darman', example: 'The doctor gave him medicine for the fever.', emoji: '💊' },
      { en: 'Sneeze', ipa: '/sniːz/', uz: 'Túshkirik', example: 'He sneezed three times in a row.', emoji: '🤧' },
      { en: 'Fever', ipa: '/ˈfiːvə/', uz: 'Isıtpa', example: 'She stayed home because she had a fever.', emoji: '🌡️' },
      { en: 'Fracture', ipa: '/ˈfræktʃə/', uz: 'Sınıq', example: 'He got a fracture in his arm after the fall.', emoji: '🦴' },
      { en: 'Allergy', ipa: '/ˈælədʒi/', uz: 'Alleriya', example: 'She has an allergy to cats.', emoji: '🤧' },
      { en: 'Blood', ipa: '/blʌd/', uz: 'Qan', example: 'The nurse took a blood sample for the test.', emoji: '🩸' },
      { en: 'Breathe', ipa: '/briːð/', uz: 'Dem alıw', example: 'Breathe deeply to relax your body.', emoji: '🌬️' },
      { en: 'Wound', ipa: '/wuːnd/', uz: 'Jaraqat', example: 'He cleaned the wound carefully with water.', emoji: '🩹' },
      { en: 'Healthy', ipa: '/ˈhelθi/', uz: 'Sawlıqlı', example: 'Eating vegetables keeps you healthy.', emoji: '💪' },
      { en: 'Headache', ipa: '/ˈhedeɪk/', uz: 'Bas awırıw', example: 'I have a headache from looking at the screen.', emoji: '🤕' },
      { en: 'Vitamin', ipa: '/ˈvɪtəmɪn/', uz: 'Vitamin', example: 'Oranges are full of vitamin C.', emoji: '🍊' },
      { en: 'Vaccine', ipa: '/ˈvæksiːn/', uz: 'Vaksina', example: 'Children get a vaccine to prevent diseases.', emoji: '💉' },
      { en: 'Cough', ipa: '/kɒf/', uz: 'Yótel', example: 'She had a bad cough for two days.', emoji: '😷' },
      { en: 'Rest', ipa: '/rest/', uz: 'Istirawhat', example: 'The doctor said he needs to rest at home.', emoji: '🛌' },
    ],
  },
  {
    title: '18-tema — Texnologiya',
    order: 18,
    emoji: '💻',
    words: [
      { en: 'Computer', ipa: '/kəmˈpjuːtə/', uz: 'Kompyuter', example: 'I do my homework on the computer.', emoji: '💻' },
      { en: 'Phone', ipa: '/fəʊn/', uz: 'Telefon', example: 'She called her mother on the phone.', emoji: '📱' },
      { en: 'Internet', ipa: '/ˈɪntənet/', uz: 'Internet', example: 'We use the internet to find information.', emoji: '🌐' },
      { en: 'Program', ipa: '/ˈprəʊɡræm/', uz: 'Dastur', example: 'He wrote a program to solve math problems.', emoji: '⚙️' },
      { en: 'Screen', ipa: '/skriːn/', uz: 'Ekran', example: 'The screen of my phone cracked yesterday.', emoji: '📺' },
      { en: 'Keyboard', ipa: '/ˈkiːbɔːd/', uz: 'Klaviatura', example: 'She types very fast on the keyboard.', emoji: '⌨️' },
      { en: 'Camera', ipa: '/ˈkæmərə/', uz: 'Kamera', example: 'He took a photo with his new camera.', emoji: '📷' },
      { en: 'Robot', ipa: '/ˈrəʊbɒt/', uz: 'Robot', example: 'Scientists built a robot to clean the ocean.', emoji: '🤖' },
      { en: 'Website', ipa: '/ˈwebsaɪt/', uz: 'Sayt', example: 'The school has an official website with information.', emoji: '🌐' },
      { en: 'Battery', ipa: '/ˈbætəri/', uz: 'Batareya', example: 'The battery of my phone is almost empty.', emoji: '🔋' },
      { en: 'Charger', ipa: '/ˈtʃɑːdʒə/', uz: 'Zaryadlawshı', example: 'I forgot my charger at home today.', emoji: '🔌' },
      { en: 'Password', ipa: '/ˈpɑːswɜːd/', uz: 'Parol', example: 'Never share your password with anyone.', emoji: '🔐' },
      { en: 'Message', ipa: '/ˈmesɪdʒ/', uz: 'Xabar', example: 'I sent her a message to say hello.', emoji: '💬' },
      { en: 'Download', ipa: '/ˈdaʊnləʊd/', uz: 'Júklew', example: 'I need to download the new app.', emoji: '⬇️' },
      { en: 'Video', ipa: '/ˈvɪdiəʊ/', uz: 'Video', example: 'She watched a video about science.', emoji: '🎥' },
    ],
  },
  {
    title: '19-tema — Úy',
    order: 19,
    emoji: '🏠',
    words: [
      { en: 'Table', ipa: '/ˈteɪbl/', uz: 'Stol', example: 'We eat dinner at the table together.', emoji: '🪑' },
      { en: 'Chair', ipa: '/tʃeə/', uz: 'Orindiıq', example: 'Please sit on the chair and wait.', emoji: '🪑' },
      { en: 'Bed', ipa: '/bed/', uz: 'Krovat', example: 'I go to bed at ten every night.', emoji: '🛏️' },
      { en: 'Stove', ipa: '/stəʊv/', uz: 'Peshke', example: 'My mother cooks soup on the stove.', emoji: '🍳' },
      { en: 'Wardrobe', ipa: '/ˈwɔːdrəʊb/', uz: 'Shkaf', example: 'I keep all my clothes in the wardrobe.', emoji: '🚪' },
      { en: 'Desk', ipa: '/desk/', uz: 'Jazıwxana', example: 'I study at my desk every evening.', emoji: '🖥️' },
      { en: 'Mattress', ipa: '/ˈmætrɪs/', uz: 'Tóshek', example: 'A good mattress helps you sleep better.', emoji: '🛏️' },
      { en: 'Broom', ipa: '/bruːm/', uz: 'Súpirgi', example: 'She sweeps the floor with a broom every morning.', emoji: '🧹' },
      { en: 'Window', ipa: '/ˈwɪndəʊ/', uz: 'Tereze', example: 'Please open the window to let fresh air in.', emoji: '🪟' },
      { en: 'Door', ipa: '/dɔː/', uz: 'Esik', example: 'Please close the door when you leave.', emoji: '🚪' },
      { en: 'Kitchen', ipa: '/ˈkɪtʃɪn/', uz: 'Ashxana', example: 'My mother spends a lot of time in the kitchen.', emoji: '🍽️' },
      { en: 'Bathroom', ipa: '/ˈbɑːθruːm/', uz: 'Hammam', example: 'I take a shower in the bathroom every morning.', emoji: '🚿' },
      { en: 'Lamp', ipa: '/læmp/', uz: 'Shıraǵan', example: 'She turned on the lamp to read in the dark.', emoji: '💡' },
      { en: 'Carpet', ipa: '/ˈkɑːpɪt/', uz: 'Gilam', example: 'The carpet in our living room is red.', emoji: '🟥' },
      { en: 'Sofa', ipa: '/ˈsəʊfə/', uz: 'Divan', example: 'The whole family sits on the sofa to watch television.', emoji: '🛋️' },
    ],
  },
  {
    title: '20-tema — Hissiyatlar',
    order: 20,
    emoji: '😊',
    words: [
      { en: 'Happiness', ipa: '/ˈhæpinəs/', uz: 'Quwanısh', example: 'Her smile was full of happiness.', emoji: '😊' },
      { en: 'Sadness', ipa: '/ˈsædnəs/', uz: 'Qayǵı', example: 'He felt great sadness when his friend moved away.', emoji: '😢' },
      { en: 'Fear', ipa: '/fɪə/', uz: 'Qorqınısh', example: 'She tried to hide her fear of the dark.', emoji: '😨' },
      { en: 'Anger', ipa: '/ˈæŋɡə/', uz: 'Jını', example: 'He felt anger when someone took his book.', emoji: '😠' },
      { en: 'Love', ipa: '/lʌv/', uz: 'Suyiw', example: 'Parents feel love for their children.', emoji: '❤️' },
      { en: 'Surprise', ipa: '/səˈpraɪz/', uz: 'Tańqalıw', example: 'Her birthday party was a big surprise.', emoji: '😲' },
      { en: 'Shame', ipa: '/ʃeɪm/', uz: 'Arlanısh', example: 'He felt shame after lying to his teacher.', emoji: '😳' },
      { en: 'Hope', ipa: '/həʊp/', uz: 'Úmit', example: 'She had hope that she would pass the exam.', emoji: '🌟' },
      { en: 'Envy', ipa: '/ˈenvi/', uz: 'Qızǵanısh', example: 'Envy can make people do bad things.', emoji: '😒' },
      { en: 'Patience', ipa: '/ˈpeɪʃəns/', uz: 'Shıdamlılıq', example: 'Learning a language requires patience.', emoji: '😌' },
      { en: 'Excited', ipa: '/ɪkˈsaɪtɪd/', uz: 'Ásirlengen', example: 'The children were excited about the school trip.', emoji: '🤩' },
      { en: 'Nervous', ipa: '/ˈnɜːvəs/', uz: 'Jalgıshan', example: 'She was nervous before her big exam.', emoji: '😰' },
      { en: 'Proud', ipa: '/praʊd/', uz: 'Maqtanısh', example: 'Her parents felt proud when she won the competition.', emoji: '🥹' },
      { en: 'Bored', ipa: '/bɔːd/', uz: 'Zeriqqan', example: 'He felt bored during the long journey.', emoji: '😑' },
      { en: 'Grateful', ipa: '/ˈɡreɪtfəl/', uz: 'Minnétdar', example: 'She was grateful for all the help she received.', emoji: '🙏' },
    ],
  },
  {
    title: '21-tema — Húnerler',
    order: 21,
    emoji: '🎯',
    words: [
      { en: 'Drawing', ipa: '/ˈdrɔːɪŋ/', uz: 'Súwret sızıw', example: 'She enjoys drawing animals in her free time.', emoji: '🎨' },
      { en: 'Reading', ipa: '/ˈriːdɪŋ/', uz: 'Kitap oqıw', example: 'Reading books helps you learn new things.', emoji: '📖' },
      { en: 'Music', ipa: '/ˈmjuːzɪk/', uz: 'Musiqa', example: 'He plays music on his guitar every evening.', emoji: '🎵' },
      { en: 'Game', ipa: '/ɡeɪm/', uz: 'Oyin', example: 'We played a fun game after dinner.', emoji: '🎮' },
      { en: 'Cooking', ipa: '/ˈkʊkɪŋ/', uz: 'Tamaq pisiríw', example: 'Cooking is a great hobby and life skill.', emoji: '🍳' },
      { en: 'Fishing', ipa: '/ˈfɪʃɪŋ/', uz: 'Balıq tutıw', example: 'My grandfather loves fishing at the river.', emoji: '🎣' },
      { en: 'Football', ipa: '/ˈfʊtbɔːl/', uz: 'Futbol', example: 'He plays football with his friends every weekend.', emoji: '⚽' },
      { en: 'Travel', ipa: '/ˈtrævl/', uz: 'Sayaxat', example: 'She loves to travel to new places.', emoji: '✈️' },
      { en: 'Photography', ipa: '/fəˈtɒɡrəfi/', uz: 'Fotosúwret', example: 'Photography is a popular hobby among young people.', emoji: '📷' },
      { en: 'Dance', ipa: '/dɑːns/', uz: 'Biy', example: 'She takes dance lessons on Saturday.', emoji: '💃' },
      { en: 'Singing', ipa: '/ˈsɪŋɪŋ/', uz: 'Ańlaw', example: 'He loves singing traditional songs.', emoji: '🎤' },
      { en: 'Swimming', ipa: '/ˈswɪmɪŋ/', uz: 'Suwda júziw', example: 'Swimming is good exercise for the whole body.', emoji: '🏊' },
      { en: 'Painting', ipa: '/ˈpeɪntɪŋ/', uz: 'Boyaw sızıw', example: 'She spent the afternoon painting the sunset.', emoji: '🖌️' },
      { en: 'Chess', ipa: '/tʃes/', uz: 'Shaxmat', example: 'Chess teaches you to think carefully.', emoji: '♟️' },
      { en: 'Gardening', ipa: '/ˈɡɑːdənɪŋ/', uz: 'Gúl ósiríw', example: 'My mother enjoys gardening in the morning.', emoji: '🌱' },
    ],
  },
];

// Mirrors the Learn flow's Test phase format ("X" sóziniń awdarması qaysı?) for
// pedagogical consistency, rather than the old mixed-English clue format.
const QUIZ_QUESTIONS = [
  { question: '"Head" sóziniń awdarması qaysı?', options: ['Ayaq', 'Qol', 'Bas', 'Kóz'], correctIndex: 2 },
  { question: '"Eye" sóziniń awdarması qaysı?', options: ['Qulaǵ', 'Kóz', 'Murnı', 'Awız'], correctIndex: 1 },
  { question: '"Hand" sóziniń awdarması qaysı?', options: ['Ayaq', 'Arqa', 'Bas', 'Qol'], correctIndex: 3 },
  { question: '"Red" sóziniń awdarması qaysı?', options: ['Sarı', 'Kók', 'Jasıl', 'Qızıl'], correctIndex: 3 },
  { question: '"Blue" sóziniń awdarması qaysı?', options: ['Qara', 'Aq', 'Kók', 'Qızıl'], correctIndex: 2 },
  { question: '"Green" sóziniń awdarması qaysı?', options: ['Jasıl', 'Sarı', 'Gúlgín', 'Kúlgín'], correctIndex: 0 },
  { question: '"One" sóziniń awdarması qaysı?', options: ['Eki', 'Úsh', 'Bir', 'Tórt'], correctIndex: 2 },
  { question: '"Ten" sóziniń awdarması qaysı?', options: ['Bes', 'On', 'Jeti', 'Segiz'], correctIndex: 1 },
  { question: '"Monday" sóziniń awdarması qaysı?', options: ['Seysenbi', 'Sársenbi', 'Dúysenbi', 'Beysenbi'], correctIndex: 2 },
  { question: '"Friday" sóziniń awdarması qaysı?', options: ['Senbi', 'Jeksembi', 'Sársenbi', 'Juma'], correctIndex: 3 },
  { question: '"Rain" sóziniń awdarması qaysı?', options: ['Qar', 'Jel', 'Jawın', 'Bulıt'], correctIndex: 2 },
  { question: '"Snow" sóziniń awdarması qaysı?', options: ['Jawın', 'Qar', 'Jel', 'Ilıq'], correctIndex: 1 },
  { question: '"Shirt" sóziniń awdarması qaysı?', options: ['Shálbar', 'Qalpaq', 'Kóylek', 'Shapan'], correctIndex: 2 },
  { question: '"Bus" sóziniń awdarması qaysı?', options: ['Poyız', 'Awtobus', 'Mashına', 'Taksi'], correctIndex: 1 },
  { question: '"Car" sóziniń awdarması qaysı?', options: ['Taksi', 'Poyız', 'Velosiped', 'Mashına'], correctIndex: 3 },
  { question: '"Hospital" sóziniń awdarması qaysı?', options: ['Mektep', 'Awqatxana', 'Awruwhana', 'Kitapxana'], correctIndex: 2 },
  { question: '"River" sóziniń awdarması qaysı?', options: ['Teńiz', 'Derya', 'Taw', 'Shól'], correctIndex: 1 },
  { question: '"Mountain" sóziniń awdarması qaysı?', options: ['Shól', 'Gólet', 'Taw', 'Derya'], correctIndex: 2 },
  { question: '"Doctor" sóziniń awdarması qaysı?', options: ['Oqıtıwshı', 'Ashpaz', 'Doktor', 'Pilot'], correctIndex: 2 },
  { question: '"Farmer" sóziniń awdarması qaysı?', options: ['Injener', 'Ilimpaz', 'Doktor', 'Fermer'], correctIndex: 3 },
  { question: '"Happiness" sóziniń awdarması qaysı?', options: ['Qayǵı', 'Qorqınısh', 'Quwanısh', 'Jını'], correctIndex: 2 },
  { question: '"Love" sóziniń awdarması qaysı?', options: ['Jını', 'Qorqınısh', 'Úmit', 'Suyiw'], correctIndex: 3 },
  { question: '"Computer" sóziniń awdarması qaysı?', options: ['Telefon', 'Ekran', 'Kompyuter', 'Robot'], correctIndex: 2 },
  { question: '"Table" sóziniń awdarması qaysı?', options: ['Orindiıq', 'Stol', 'Krovat', 'Shkaf'], correctIndex: 1 },
  { question: '"Music" sóziniń awdarması qaysı?', options: ['Oyin', 'Biy', 'Musiqa', 'Súwret sızıw'], correctIndex: 2 },
  { question: '"Tooth" sóziniń awdarması qaysı?', options: ['Til', 'Tis', 'Boyın', 'Arqa'], correctIndex: 1 },
  { question: '"Neck" sóziniń awdarması qaysı?', options: ['Iyın', 'Arqa', 'Boyın', 'Bas'], correctIndex: 2 },
  { question: '"Yellow" sóziniń awdarması qaysı?', options: ['Jasıl', 'Gúlgín', 'Kúlgín', 'Sarı'], correctIndex: 3 },
  { question: '"Twenty" sóziniń awdarması qaysı?', options: ['On', 'Jiyrma', 'Júz', 'On bes'], correctIndex: 1 },
  { question: '"Summer" sóziniń awdarması qaysı?', options: ['Qıs', 'Báhár', 'Kúz', 'Jaz'], correctIndex: 3 },
  { question: '"Winter" sóziniń awdarması qaysı?', options: ['Jaz', 'Kúz', 'Qıs', 'Báhár'], correctIndex: 2 },
  { question: '"Hot" sóziniń awdarması qaysı?', options: ['Sawıq', 'Ilıq', 'Issıq', 'Jel'], correctIndex: 2 },
  { question: '"Shoes" sóziniń awdarması qaysı?', options: ['Qalpaq', 'Kóylek', 'Shálbar', 'Ayaq kiyim'], correctIndex: 3 },
  { question: '"Train" sóziniń awdarması qaysı?', options: ['Awtobus', 'Poyız', 'Ushaq', 'Mashına'], correctIndex: 1 },
  { question: '"Park" sóziniń awdarması qaysı?', options: ['Bazar', 'Meshit', 'Park', 'Bank'], correctIndex: 2 },
  { question: '"Tree" sóziniń awdarması qaysı?', options: ['Gúl', 'Ot', 'Daraxt', 'Jer'], correctIndex: 2 },
  { question: '"Flower" sóziniń awdarması qaysı?', options: ['Daraxt', 'Gúl', 'Ot', 'Áseman'], correctIndex: 1 },
  { question: '"Blood" sóziniń awdarması qaysı?', options: ['Dári-darman', 'Jaraqat', 'Qan', 'Isıtpa'], correctIndex: 2 },
  { question: '"Phone" sóziniń awdarması qaysı?', options: ['Kompyuter', 'Ekran', 'Telefon', 'Robot'], correctIndex: 2 },
  { question: '"Door" sóziniń awdarması qaysı?', options: ['Tereze', 'Stol', 'Krovat', 'Esik'], correctIndex: 3 },
  { question: '"Window" sóziniń awdarması qaysı?', options: ['Esik', 'Tereze', 'Shkaf', 'Shıraǵan'], correctIndex: 1 },
  { question: '"Fear" sóziniń awdarması qaysı?', options: ['Suyiw', 'Qayǵı', 'Jını', 'Qorqınısh'], correctIndex: 3 },
  { question: '"Hope" sóziniń awdarması qaysı?', options: ['Qorqınısh', 'Úmit', 'Arlanısh', 'Shıdamlılıq'], correctIndex: 1 },
  { question: '"Football" sóziniń awdarması qaysı?', options: ['Oyin', 'Biy', 'Musiqa', 'Futbol'], correctIndex: 3 },
  { question: '"Swimming" sóziniń awdarması qaysı?', options: ['Suwda júziw', 'Biy', 'Ańlaw', 'Balıq tutıw'], correctIndex: 0 },
  { question: '"Kóz" inglizshede qalay aytıladı?', options: ['Ear', 'Nose', 'Eye', 'Mouth'], correctIndex: 2 },
  { question: '"Qızıl" inglizshede qalay aytıladı?', options: ['Blue', 'Green', 'Yellow', 'Red'], correctIndex: 3 },
  { question: '"Juma" inglizshede qalay aytıladı?', options: ['Thursday', 'Saturday', 'Sunday', 'Friday'], correctIndex: 3 },
  { question: '"Jawın" inglizshede qalay aytıladı?', options: ['Snow', 'Wind', 'Rain', 'Cloud'], correctIndex: 2 },
  { question: '"Awtobus" inglizshede qalay aytıladı?', options: ['Car', 'Train', 'Bus', 'Taxi'], correctIndex: 2 },
  { question: '"Derya" inglizshede qalay aytıladı?', options: ['Sea', 'Lake', 'River', 'Mountain'], correctIndex: 2 },
  { question: '"Oqıtıwshı" inglizshede qalay aytıladı?', options: ['Doctor', 'Teacher', 'Pilot', 'Cook'], correctIndex: 1 },
  { question: '"Kompyuter" inglizshede qalay aytıladı?', options: ['Phone', 'Screen', 'Robot', 'Computer'], correctIndex: 3 },
  { question: '"Stol" inglizshede qalay aytıladı?', options: ['Chair', 'Bed', 'Table', 'Door'], correctIndex: 2 },
  { question: '"Quwanısh" inglizshede qalay aytıladı?', options: ['Sadness', 'Fear', 'Happiness', 'Anger'], correctIndex: 2 },
  { question: '"Bas" inglizshede qalay aytıladı?', options: ['Hand', 'Foot', 'Eye', 'Head'], correctIndex: 3 },
  { question: '"Kóylek" inglizshede qalay aytıladı?', options: ['Trousers', 'Coat', 'Shirt', 'Hat'], correctIndex: 2 },
  { question: '"Jaz" inglizshede qalay aytıladı?', options: ['Winter', 'Autumn', 'Spring', 'Summer'], correctIndex: 3 },
  { question: '"Futbol" inglizshede qalay aytıladı?', options: ['Basketball', 'Tennis', 'Football', 'Volleyball'], correctIndex: 2 },
  { question: '"Teńiz" inglizshede qalay aytıladı?', options: ['River', 'Lake', 'Mountain', 'Sea'], correctIndex: 3 },
  { question: '"Gúl" inglizshede qalay aytıladı?', options: ['Tree', 'Grass', 'Flower', 'Sky'], correctIndex: 2 },
];

// Tests recognizing similar-sounding ENGLISH words from a spoken English
// sentence — intentionally stays English end-to-end, that's the point of the
// exercise. (Currently orphaned: the standalone Listen screen was removed from
// the frontend nav, but the route/data are kept — see web session notes.)
const LISTEN_QUESTIONS = [
  { sentence: 'My head hurts today.', options: ['Hand', 'Head', 'Heart', 'Heel'], correctIndex: 1 },
  { sentence: 'She has beautiful blue eyes.', options: ['Ears', 'Eyes', 'Nose', 'Lips'], correctIndex: 1 },
  { sentence: 'The sky is red at sunset.', options: ['Blue', 'Green', 'Red', 'Yellow'], correctIndex: 2 },
  { sentence: 'I have three cats at home.', options: ['Two', 'Five', 'Three', 'Four'], correctIndex: 2 },
  { sentence: 'School starts on Monday.', options: ['Tuesday', 'Monday', 'Sunday', 'Friday'], correctIndex: 1 },
  { sentence: 'It is raining heavily outside.', options: ['Snowing', 'Raining', 'Windy', 'Sunny'], correctIndex: 1 },
  { sentence: 'She wore a red dress to school.', options: ['Coat', 'Shirt', 'Dress', 'Hat'], correctIndex: 2 },
  { sentence: 'We took the bus to the market.', options: ['Train', 'Bus', 'Car', 'Taxi'], correctIndex: 1 },
  { sentence: 'The river flows through the valley.', options: ['Mountain', 'Ocean', 'River', 'Lake'], correctIndex: 2 },
  { sentence: 'My father is a doctor.', options: ['Teacher', 'Doctor', 'Pilot', 'Engineer'], correctIndex: 1 },
  { sentence: 'I feel happy today.', options: ['Sad', 'Angry', 'Happy', 'Afraid'], correctIndex: 2 },
  { sentence: 'He plays the piano every evening.', options: ['Piano', 'Guitar', 'Violin', 'Drum'], correctIndex: 0 },
  { sentence: 'Please open the window.', options: ['Door', 'Window', 'Curtain', 'Wall'], correctIndex: 1 },
  { sentence: 'The computer is very slow today.', options: ['Phone', 'Television', 'Computer', 'Tablet'], correctIndex: 2 },
  { sentence: 'She loves reading books.', options: ['Writing', 'Drawing', 'Reading', 'Painting'], correctIndex: 2 },
  { sentence: 'Put your books on the table.', options: ['Chair', 'Floor', 'Table', 'Shelf'], correctIndex: 2 },
  { sentence: 'I need to see a doctor.', options: ['Nurse', 'Doctor', 'Teacher', 'Lawyer'], correctIndex: 1 },
  { sentence: 'The snow is very deep this winter.', options: ['Rain', 'Hail', 'Fog', 'Snow'], correctIndex: 3 },
  { sentence: 'He took a taxi to the airport.', options: ['Bus', 'Train', 'Taxi', 'Bicycle'], correctIndex: 2 },
  { sentence: 'We saw a beautiful mountain.', options: ['River', 'Valley', 'Mountain', 'Lake'], correctIndex: 2 },
  { sentence: 'The flower smells wonderful.', options: ['Tree', 'Flower', 'Grass', 'Leaf'], correctIndex: 1 },
  { sentence: 'She teaches English at school.', options: ['Learns', 'Teaches', 'Studies', 'Reads'], correctIndex: 1 },
  { sentence: 'He feels angry about the result.', options: ['Happy', 'Bored', 'Angry', 'Excited'], correctIndex: 2 },
  { sentence: 'The screen of my phone is broken.', options: ['Battery', 'Camera', 'Screen', 'Button'], correctIndex: 2 },
  { sentence: 'She dances beautifully.', options: ['Sings', 'Dances', 'Swims', 'Runs'], correctIndex: 1 },
  { sentence: 'My tooth is hurting.', options: ['Tongue', 'Neck', 'Tooth', 'Shoulder'], correctIndex: 2 },
  { sentence: 'The sky is gray and cloudy.', options: ['Sunny', 'Clear', 'Cloudy', 'Stormy'], correctIndex: 2 },
  { sentence: 'He loves football very much.', options: ['Tennis', 'Basketball', 'Football', 'Volleyball'], correctIndex: 2 },
  { sentence: 'She put on her coat before leaving.', options: ['Hat', 'Boots', 'Coat', 'Scarf'], correctIndex: 2 },
  { sentence: 'The farmer works in the field.', options: ['Engineer', 'Doctor', 'Teacher', 'Farmer'], correctIndex: 3 },
];

const BATTLE_QUESTIONS = [
  { question: '"Eye" sóziniń awdarması qaysı?', options: ['Awız', 'Kóz', 'Murnı', 'Qulaǵ'], correctIndex: 1 },
  { question: '"Ear" sóziniń awdarması qaysı?', options: ['Bas', 'Qulaǵ', 'Kóz', 'Qol'], correctIndex: 1 },
  { question: '"Nose" sóziniń awdarması qaysı?', options: ['Kóz', 'Qulaǵ', 'Murnı', 'Awız'], correctIndex: 2 },
  { question: '"Black" sóziniń awdarması qaysı?', options: ['Aq', 'Sarı', 'Qara', 'Kók'], correctIndex: 2 },
  { question: '"White" sóziniń awdarması qaysı?', options: ['Qara', 'Aq', 'Jasıl', 'Gúlgín'], correctIndex: 1 },
  { question: '"Pink" sóziniń awdarması qaysı?', options: ['Kúlgín', 'Jasıl', 'Sarı', 'Gúlgín'], correctIndex: 3 },
  { question: '"Five" sóziniń awdarması qaysı?', options: ['Tórt', 'Bes', 'Altı', 'Jeti'], correctIndex: 1 },
  { question: '"Seven" sóziniń awdarması qaysı?', options: ['Segiz', 'Toǵız', 'Jeti', 'On'], correctIndex: 2 },
  { question: '"Tuesday" sóziniń awdarması qaysı?', options: ['Dúysenbi', 'Seysenbi', 'Sársenbi', 'Beysenbi'], correctIndex: 1 },
  { question: '"Sunday" sóziniń awdarması qaysı?', options: ['Juma', 'Senbi', 'Jeksembi', 'Sársenbi'], correctIndex: 2 },
  { question: '"Wind" sóziniń awdarması qaysı?', options: ['Jawın', 'Qar', 'Bulıt', 'Jel'], correctIndex: 3 },
  { question: '"Cloud" sóziniń awdarması qaysı?', options: ['Jel', 'Bulıt', 'Qar', 'Issıq'], correctIndex: 1 },
  { question: '"Coat" sóziniń awdarması qaysı?', options: ['Kóylek', 'Shapan', 'Qalpaq', 'Shálbar'], correctIndex: 1 },
  { question: '"Hat" sóziniń awdarması qaysı?', options: ['Shúlpek', 'Qolqap', 'Qalpaq', 'Mánger'], correctIndex: 2 },
  { question: '"Airplane" sóziniń awdarması qaysı?', options: ['Awtobus', 'Poyız', 'Ushaq', 'Kemege'], correctIndex: 2 },
  { question: '"Bicycle" sóziniń awdarması qaysı?', options: ['Mototsikl', 'Velosiped', 'Taksi', 'Qayrıq'], correctIndex: 1 },
  { question: '"Market" sóziniń awdarması qaysı?', options: ['Dúkan', 'Kitapxana', 'Bazar', 'Awqatxana'], correctIndex: 2 },
  { question: '"Street" sóziniń awdarması qaysı?', options: ['Kóshe', 'Kóshek', 'Park', 'Bank'], correctIndex: 0 },
  { question: '"Sea" sóziniń awdarması qaysı?', options: ['Derya', 'Taw', 'Teńiz', 'Orman'], correctIndex: 2 },
  { question: '"Desert" sóziniń awdarması qaysı?', options: ['Gólet', 'Shól', 'Jer', 'Taw'], correctIndex: 1 },
  { question: '"Engineer" sóziniń awdarması qaysı?', options: ['Injener', 'Pilot', 'Ashpaz', 'Doktor'], correctIndex: 0 },
  { question: '"Pilot" sóziniń awdarması qaysı?', options: ['Doktor', 'Injener', 'Pilot', 'Fermer'], correctIndex: 2 },
  { question: '"Healthy" sóziniń awdarması qaysı?', options: ['Awırıw', 'Sawlıqlı', 'Isıtpa', 'Jaraqat'], correctIndex: 1 },
  { question: '"Fever" sóziniń awdarması qaysı?', options: ['Sınıq', 'Qan', 'Isıtpa', 'Alleriya'], correctIndex: 2 },
  { question: '"Internet" sóziniń awdarması qaysı?', options: ['Ekran', 'Kompyuter', 'Internet', 'Dastur'], correctIndex: 2 },
  { question: '"Screen" sóziniń awdarması qaysı?', options: ['Klaviatura', 'Kamera', 'Dastur', 'Ekran'], correctIndex: 3 },
  { question: '"Bed" sóziniń awdarması qaysı?', options: ['Stol', 'Krovat', 'Orindiıq', 'Shkaf'], correctIndex: 1 },
  { question: '"Carpet" sóziniń awdarması qaysı?', options: ['Shıraǵan', 'Tóshek', 'Gilam', 'Divan'], correctIndex: 2 },
  { question: '"Anger" sóziniń awdarması qaysı?', options: ['Quwanısh', 'Úmit', 'Jını', 'Qayǵı'], correctIndex: 2 },
  { question: '"Sadness" sóziniń awdarması qaysı?', options: ['Quwanısh', 'Qayǵı', 'Suyiw', 'Tańqalıw'], correctIndex: 1 },
  { question: '"Reading" sóziniń awdarması qaysı?', options: ['Biy', 'Kitap oqıw', 'Musiqa', 'Oyin'], correctIndex: 1 },
  { question: '"Chess" sóziniń awdarması qaysı?', options: ['Futbol', 'Oyin', 'Shaxmat', 'Biy'], correctIndex: 2 },
  { question: '"Ayaq" inglizshede qalay aytıladı?', options: ['Hand', 'Shoulder', 'Foot', 'Back'], correctIndex: 2 },
  { question: '"Sarı" inglizshede qalay aytıladı?', options: ['Green', 'Yellow', 'Blue', 'Red'], correctIndex: 1 },
  { question: '"On" inglizshede qalay aytıladı?', options: ['Five', 'Seven', 'Ten', 'Eight'], correctIndex: 2 },
  { question: '"Qıs" inglizshede qalay aytıladı?', options: ['Summer', 'Spring', 'Autumn', 'Winter'], correctIndex: 3 },
  { question: '"Issıq" inglizshede qalay aytıladı?', options: ['Cold', 'Warm', 'Hot', 'Cloudy'], correctIndex: 2 },
  { question: '"Poyız" inglizshede qalay aytıladı?', options: ['Bus', 'Airplane', 'Train', 'Ship'], correctIndex: 2 },
  { question: '"Qan" inglizshede qalay aytıladı?', options: ['Pain', 'Blood', 'Fever', 'Nerve'], correctIndex: 1 },
  { question: '"Ekran" inglizshede qalay aytıladı?', options: ['Keyboard', 'Camera', 'Screen', 'Robot'], correctIndex: 2 },
  { question: '"Esik" inglizshede qalay aytıladı?', options: ['Window', 'Door', 'Lamp', 'Carpet'], correctIndex: 1 },
  { question: '"Suyiw" inglizshede qalay aytıladı?', options: ['Fear', 'Anger', 'Love', 'Sadness'], correctIndex: 2 },
  { question: '"Biy" inglizshede qalay aytıladı?', options: ['Sing', 'Dance', 'Draw', 'Cook'], correctIndex: 1 },
  { question: '"Finger" sóziniń awdarması qaysı?', options: ['Kóz', 'Til', 'Barmaq', 'Tis'], correctIndex: 2 },
  { question: '"Orange" sóziniń awdarması qaysı?', options: ['Kúlgín', 'Gúlgín', 'Jıltır', 'Qızıl'], correctIndex: 2 },
  { question: '"Twelve" sóziniń awdarması qaysı?', options: ['On bir', 'On eki', 'On úsh', 'On tórt'], correctIndex: 1 },
  { question: '"Wednesday" sóziniń awdarması qaysı?', options: ['Dúysenbi', 'Seysenbi', 'Sársenbi', 'Beysenbi'], correctIndex: 2 },
  { question: '"Warm" sóziniń awdarması qaysı?', options: ['Sawıq', 'Issıq', 'Ilıq', 'Jel'], correctIndex: 2 },
  { question: '"Gloves" sóziniń awdarması qaysı?', options: ['Shúlpek', 'Qolqap', 'Qalpaq', 'Ayaq kiyim'], correctIndex: 1 },
  { question: '"Ship" sóziniń awdarması qaysı?', options: ['Qayrıq', 'Ushaq', 'Kemege', 'Poyız'], correctIndex: 2 },
  { question: '"Bridge" sóziniń awdarması qaysı?', options: ['Kóshe', 'Kópir', 'Awqatxana', 'Bank'], correctIndex: 1 },
  { question: '"Lake" sóziniń awdarması qaysı?', options: ['Derya', 'Teńiz', 'Orman', 'Gólet'], correctIndex: 3 },
  { question: '"Cook" kásip retinde awdarması qaysı?', options: ['Doktor', 'Ashpaz', 'Injener', 'Fermer'], correctIndex: 1 },
  { question: '"Allergy" sóziniń awdarması qaysı?', options: ['Sınıq', 'Isıtpa', 'Alleriya', 'Jaraqat'], correctIndex: 2 },
  { question: '"Keyboard" sóziniń awdarması qaysı?', options: ['Ekran', 'Kamera', 'Robot', 'Klaviatura'], correctIndex: 3 },
  { question: '"Sofa" sóziniń awdarması qaysı?', options: ['Krovat', 'Stol', 'Divan', 'Orindiıq'], correctIndex: 2 },
  { question: '"Patience" sóziniń awdarması qaysı?', options: ['Úmit', 'Shıdamlılıq', 'Qorqınısh', 'Arlanısh'], correctIndex: 1 },
  { question: '"Fishing" sóziniń awdarması qaysı?', options: ['Súwret sızıw', 'Biy', 'Balıq tutıw', 'Ańlaw'], correctIndex: 2 },
  { question: '"Kópir" inglizshede qalay aytıladı?', options: ['Street', 'Market', 'Bridge', 'Square'], correctIndex: 2 },
  { question: '"Fermer" inglizshede qalay aytıladı?', options: ['Driver', 'Farmer', 'Worker', 'Scientist'], correctIndex: 1 },
  { question: '"Taw" inglizshede qalay aytıladı?', options: ['Desert', 'River', 'Lake', 'Mountain'], correctIndex: 3 },
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
