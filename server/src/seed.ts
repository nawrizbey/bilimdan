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
    title: '1-tema — Dúnya boylap',
    order: 1,
    emoji: '🌍',
    words: [
      { en: 'Brazil', ipa: '/brəˈzɪl/', uz: 'Braziliya', example: 'Brazil is famous for its beautiful beaches and football.', emoji: '🇧🇷' },
      { en: 'China', ipa: '/ˈtʃaɪnə/', uz: 'Qıtay', example: 'China has the longest wall in the world.', emoji: '🇨🇳' },
      { en: 'Colombia', ipa: '/kəˈlɒmbiə/', uz: 'Kolumbiya', example: 'Colombia grows a lot of coffee every year.', emoji: '🇨🇴' },
      { en: 'France', ipa: '/frɑːns/', uz: 'Fransiya', example: 'France is famous for the Eiffel Tower in Paris.', emoji: '🇫🇷' },
      { en: 'Italy', ipa: '/ˈɪtəli/', uz: 'Italiya', example: 'Italy is well known for pizza and pasta.', emoji: '🇮🇹' },
      { en: 'Mexico', ipa: '/ˈmeksɪkəʊ/', uz: 'Meksika', example: 'Mexico is located in North America.', emoji: '🇲🇽' },
      { en: 'Russia', ipa: '/ˈrʌʃə/', uz: 'Rossiya', example: 'Russia is the largest country in the world.', emoji: '🇷🇺' },
      { en: 'Spain', ipa: '/speɪn/', uz: 'Ispaniya', example: 'Spain has many sunny beaches and old castles.', emoji: '🇪🇸' },
      { en: 'the United Kingdom', ipa: '/ðə juːˌnaɪtɪd ˈkɪŋdəm/', uz: 'Ullı Britaniya', example: 'The United Kingdom includes England, Scotland, and Wales.', emoji: '🇬🇧' },
      { en: 'the United States', ipa: '/ðə juːˌnaɪtɪd ˈsteɪts/', uz: 'Qurama Shtatlar', example: 'The United States has fifty states and two oceans.', emoji: '🇺🇸' },
    ],
  },
  {
    title: '2-tema — Shańaraq hám úy haywanları',
    order: 2,
    emoji: '👨‍👩‍👧‍👦',
    words: [
      { en: 'artistic', ipa: '/ɑːˈtɪstɪk/', uz: 'Ónerpaz', example: 'My sister is artistic and loves painting pictures.', emoji: '🎨' },
      { en: 'friendly', ipa: '/ˈfrendli/', uz: 'Dostana', example: 'Our new neighbor is very friendly and kind.', emoji: '😊' },
      { en: 'funny', ipa: '/ˈfʌni/', uz: 'Kúlkili', example: 'My brother is funny and always makes us laugh.', emoji: '😂' },
      { en: 'hardworking', ipa: '/ˌhɑːdˈwɜːkɪŋ/', uz: 'Miynetsúyer', example: 'My father is hardworking and never stops early.', emoji: '💪' },
      { en: 'kind', ipa: '/kaɪnd/', uz: 'Meyirban', example: 'Our teacher is kind and helps every student.', emoji: '💛' },
      { en: 'naughty', ipa: '/ˈnɔːti/', uz: 'Erke', example: 'The naughty puppy chewed my new shoes.', emoji: '😈' },
      { en: 'shy', ipa: '/ʃaɪ/', uz: 'Uyatshań', example: 'The shy boy didn\'t want to speak in class.', emoji: '😳' },
      { en: 'smart', ipa: '/smɑːt/', uz: 'Aqıllı', example: 'She is smart and always gets good grades.', emoji: '🧠' },
      { en: 'sporty', ipa: '/ˈspɔːti/', uz: 'Sportshı', example: 'My cousin is sporty and plays football every day.', emoji: '⚽' },
      { en: 'talkative', ipa: '/ˈtɔːkətɪv/', uz: 'Sózmar', example: 'My little sister is talkative and never stops chatting.', emoji: '🗣️' },
    ],
  },
  {
    title: '3-tema — Oyın maydanında',
    order: 3,
    emoji: '🛝',
    words: [
      { en: 'cry', ipa: '/kraɪ/', uz: 'Jılaw', example: 'The little boy started to cry when he fell down.', emoji: '😢' },
      { en: 'help others', ipa: '/help ˈʌðəz/', uz: 'Basqalarǵa járdem beriw', example: 'We should always help others when they need us.', emoji: '🤝' },
      { en: 'hop', ipa: '/hɒp/', uz: 'Sekiriw', example: 'The children like to hop over the small puddles.', emoji: '🦘' },
      { en: 'litter', ipa: '/ˈlɪtə/', uz: 'Qoqıs taslaw', example: 'Please don\'t litter in the school playground.', emoji: '🚯' },
      { en: 'shout', ipa: '/ʃaʊt/', uz: 'Qıyqırıw', example: 'Don\'t shout so loudly near the classroom windows.', emoji: '📢' },
      { en: 'skip', ipa: '/skɪp/', uz: 'Atlap júriw', example: 'The girls skip happily around the playground.', emoji: '🤸' },
      { en: 'laugh', ipa: '/lɑːf/', uz: 'Kúliw', example: 'We all laugh together at his funny jokes.', emoji: '😄' },
      { en: 'text a friend', ipa: '/tekst ə frend/', uz: 'Dosqa xabar jazıw', example: 'She likes to text a friend during the break time.', emoji: '💬' },
      { en: 'throw a ball', ipa: '/θrəʊ ə bɔːl/', uz: 'Dop laqtırıw', example: 'The boys throw a ball to each other in the yard.', emoji: '🏐' },
      { en: 'use a cell phone', ipa: '/juːz ə sel fəʊn/', uz: 'Mobil telefon paydalanıw', example: 'Students shouldn\'t use a cell phone during the lesson.', emoji: '📱' },
    ],
  },
  {
    title: '4-tema — Okean astında',
    order: 4,
    emoji: '🐠',
    words: [
      { en: 'crab', ipa: '/kræb/', uz: 'Shayan', example: 'The crab walked sideways along the sandy beach.', emoji: '🦀' },
      { en: 'dolphin', ipa: '/ˈdɒlfɪn/', uz: 'Delfin', example: 'Dolphins are very intelligent and friendly sea animals.', emoji: '🐬' },
      { en: 'jellyfish', ipa: '/ˈdʒelifɪʃ/', uz: 'Meduza', example: 'Be careful, that jellyfish can sting you in the water.', emoji: '🪼' },
      { en: 'octopus', ipa: '/ˈɒktəpəs/', uz: 'Segizayaq', example: 'An octopus has eight long arms and three hearts.', emoji: '🐙' },
      { en: 'seal', ipa: '/siːl/', uz: 'Itbalıq', example: 'The seal swam gracefully near the icy shore.', emoji: '🦭' },
      { en: 'shark', ipa: '/ʃɑːk/', uz: 'Akula', example: 'Sharks have many sharp teeth and swim very fast.', emoji: '🦈' },
      { en: 'starfish', ipa: '/ˈstɑːfɪʃ/', uz: 'Júldız balıq', example: 'We found an orange starfish on the beach yesterday.', emoji: '⭐' },
      { en: 'stingray', ipa: '/ˈstɪŋreɪ/', uz: 'Skat', example: 'The stingray hid under the sand at the bottom of the sea.', emoji: '🐟' },
      { en: 'turtle', ipa: '/ˈtɜːtl/', uz: 'Tasbaqa', example: 'The turtle slowly crawled across the warm sand.', emoji: '🐢' },
      { en: 'whale', ipa: '/weɪl/', uz: 'Kit', example: 'The whale is the biggest animal living in the ocean.', emoji: '🐋' },
    ],
  },
  {
    title: '5-tema — Elektron úskeneler',
    order: 5,
    emoji: '📱',
    words: [
      { en: 'digital camera', ipa: '/ˈdɪdʒɪtl ˈkæmərə/', uz: 'Sanlı kamera', example: 'She took amazing photos with her new digital camera.', emoji: '📷' },
      { en: 'e-reader', ipa: '/ˈiː riːdə/', uz: 'Elektron kitap oqıǵısh', example: 'He reads many books on his e-reader every night.', emoji: '📖' },
      { en: 'games console', ipa: '/ɡeɪmz ˈkɒnsəʊl/', uz: 'Oyın konsolı', example: 'My brother plays football games on his games console.', emoji: '🎮' },
      { en: 'headphones', ipa: '/ˈhedfəʊnz/', uz: 'Naushnik', example: 'I listen to music using my headphones on the bus.', emoji: '🎧' },
      { en: 'laptop', ipa: '/ˈlæptɒp/', uz: 'Noutbuk', example: 'She writes her school reports on a laptop computer.', emoji: '💻' },
      { en: 'MP4 player', ipa: '/ˌem piː fɔː ˈpleɪə/', uz: 'MP4 pleer', example: 'He listens to songs and watches videos on his MP4 player.', emoji: '🎵' },
      { en: 'smartphone', ipa: '/ˈsmɑːtfəʊn/', uz: 'Smartfon', example: 'Almost every student has a smartphone these days.', emoji: '📱' },
      { en: 'tablet', ipa: '/ˈtæblɪt/', uz: 'Planshet', example: 'The children watched cartoons on the tablet after school.', emoji: '📲' },
      { en: 'television', ipa: '/ˈtelɪvɪʒn/', uz: 'Televizor', example: 'The whole family watched the news on television together.', emoji: '📺' },
      { en: 'video camera', ipa: '/ˈvɪdiəʊ ˈkæmərə/', uz: 'Video kamera', example: 'The photographer recorded the wedding with a video camera.', emoji: '🎥' },
    ],
  },
  {
    title: '6-tema — Tábiyiy dúnya',
    order: 6,
    emoji: '🏔️',
    words: [
      { en: 'cave', ipa: '/keɪv/', uz: 'Úńgir', example: 'A group of bats was sleeping inside the dark cave.', emoji: '🦇' },
      { en: 'desert', ipa: '/ˈdezət/', uz: 'Shól', example: 'It rarely rains in the hot, dry desert.', emoji: '🏜️' },
      { en: 'forest', ipa: '/ˈfɒrɪst/', uz: 'Orman', example: 'We walked through the green forest and saw many birds.', emoji: '🌲' },
      { en: 'island', ipa: '/ˈaɪlənd/', uz: 'Aral', example: 'The small island in the lake has no people living there.', emoji: '🏝️' },
      { en: 'jungle', ipa: '/ˈdʒʌŋɡl/', uz: 'Tropikalıq orman', example: 'Tigers and monkeys live in the thick jungle.', emoji: '🌴' },
      { en: 'lake', ipa: '/leɪk/', uz: 'Kól', example: 'We swam in the cool water of the lake.', emoji: '🏞️' },
      { en: 'mountain', ipa: '/ˈmaʊntɪn/', uz: 'Taw', example: 'It took us five hours to climb the tall mountain.', emoji: '⛰️' },
      { en: 'river', ipa: '/ˈrɪvə/', uz: 'Dárya', example: 'The river flows from the mountains to the sea.', emoji: '🌊' },
      { en: 'volcano', ipa: '/vɒlˈkeɪnəʊ/', uz: 'Vulkan', example: 'The volcano erupted and sent smoke into the sky.', emoji: '🌋' },
      { en: 'waterfall', ipa: '/ˈwɔːtəfɔːl/', uz: 'Sharshama', example: 'The waterfall crashed down over the tall rocks.', emoji: '💦' },
    ],
  },
  {
    title: '7-tema — Úyde járdem beriw',
    order: 7,
    emoji: '🧹',
    words: [
      { en: 'clean the bathroom', ipa: '/kliːn ðə ˈbɑːθruːm/', uz: 'Hammamdı tazalaw', example: 'Please clean the bathroom before our guests arrive today.', emoji: '🛁' },
      { en: 'cook dinner', ipa: '/kʊk ˈdɪnə/', uz: 'Keshki tamaqtı pisiriw', example: 'My mother likes to cook dinner for the whole family.', emoji: '🍳' },
      { en: 'dry the dishes', ipa: '/draɪ ðə ˈdɪʃɪz/', uz: 'Idıstı súrtiw', example: 'Can you dry the dishes after I wash them, please?', emoji: '🧽' },
      { en: 'make my bed', ipa: '/meɪk maɪ bed/', uz: 'Tósegimdi jıynaw', example: 'I always make my bed before I go to school.', emoji: '🛏️' },
      { en: 'set the table', ipa: '/set ðə ˈteɪbl/', uz: 'Dastarhandı jayıw', example: 'Could you set the table before dinner is ready?', emoji: '🍽️' },
      { en: 'take the trash out', ipa: '/teɪk ðə træʃ aʊt/', uz: 'Qoqıstı shığarıw', example: 'It\'s your turn to take the trash out tonight.', emoji: '🗑️' },
      { en: 'sweep the floor', ipa: '/swiːp ðə flɔː/', uz: 'Poldı súpiriw', example: 'She swept the floor with a broom every morning.', emoji: '🧹' },
      { en: 'clean my bedroom', ipa: '/kliːn maɪ ˈbedruːm/', uz: 'Bólmemdi tazalaw', example: 'I need to clean my bedroom before my friends visit.', emoji: '🧼' },
      { en: 'wash my clothes', ipa: '/wɒʃ maɪ kləʊðz/', uz: 'Kiyimlerimdi juwıw', example: 'I wash my clothes every weekend with my sister.', emoji: '🧺' },
      { en: 'water the plants', ipa: '/ˈwɔːtə ðə plɑːnts/', uz: 'Gúllerdi suwgarıw', example: 'She waters the plants on the balcony every evening.', emoji: '🪴' },
    ],
  },
  {
    title: '8-tema — Sezimler',
    order: 8,
    emoji: '🎭',
    words: [
      { en: 'angry', ipa: '/ˈæŋɡri/', uz: 'Ashıwlı', example: 'He was angry when he lost his favorite pen.', emoji: '😠' },
      { en: 'bored', ipa: '/bɔːd/', uz: 'Zerikken', example: 'The students felt bored during the long lecture.', emoji: '😑' },
      { en: 'excited', ipa: '/ɪkˈsaɪtɪd/', uz: 'Tolqınlanǵan', example: 'The children were excited about the school trip tomorrow.', emoji: '🤩' },
      { en: 'hungry', ipa: '/ˈhʌŋɡri/', uz: 'Aş', example: 'I am hungry, so let\'s have lunch now.', emoji: '😋' },
      { en: 'interested', ipa: '/ˈɪntrəstɪd/', uz: 'Qızıqqan', example: 'She is very interested in learning new foreign languages.', emoji: '🤔' },
      { en: 'scared', ipa: '/skeəd/', uz: 'Qorqqan', example: 'The little boy was scared of the dark room.', emoji: '😨' },
      { en: 'surprised', ipa: '/səˈpraɪzd/', uz: 'Tań qalǵan', example: 'We were surprised to see snow in April.', emoji: '😲' },
      { en: 'thirsty', ipa: '/ˈθɜːsti/', uz: 'Shóllegen', example: 'After the run, he was very thirsty for water.', emoji: '🥤' },
      { en: 'tired', ipa: '/ˈtaɪəd/', uz: 'Sharshaǵan', example: 'She was tired after working all day long.', emoji: '😴' },
      { en: 'worried', ipa: '/ˈwʌrid/', uz: 'Alańdaǵan', example: 'My mother was worried when I came home late.', emoji: '😟' },
    ],
  },
  {
    title: '9-tema — Ashıq hawa sportı',
    order: 9,
    emoji: '🏕️',
    words: [
      { en: 'bodyboarding', ipa: '/ˈbɒdibɔːdɪŋ/', uz: 'Tolqında taqta menen suzıw', example: 'We tried bodyboarding at the beach during our summer holiday.', emoji: '🌊' },
      { en: 'canoeing', ipa: '/kəˈnuːɪŋ/', uz: 'Kanoeda esiw', example: 'They went canoeing down the river last weekend.', emoji: '🛶' },
      { en: 'go-carting', ipa: '/ˈɡəʊkɑːtɪŋ/', uz: 'Kartingde jarısıw', example: 'My brother loves go-carting with his friends on Saturdays.', emoji: '🏎️' },
      { en: 'hiking', ipa: '/ˈhaɪkɪŋ/', uz: 'Piyada sayaqatlaw', example: 'Our family enjoys hiking in the mountains every summer.', emoji: '🥾' },
      { en: 'rock climbing', ipa: '/rɒk ˈklaɪmɪŋ/', uz: 'Qayaǵa tırmasıw', example: 'He learned rock climbing at an outdoor adventure camp.', emoji: '🧗' },
      { en: 'rowing', ipa: '/ˈrəʊɪŋ/', uz: 'Qayıq esiw', example: 'The team practiced rowing on the lake every morning.', emoji: '🚣' },
      { en: 'scuba diving', ipa: '/ˈskuːbə ˌdaɪvɪŋ/', uz: 'Aqualang menen suwǵa shómiw', example: 'She wants to try scuba diving in the sea someday.', emoji: '🤿' },
      { en: 'snorkeling', ipa: '/ˈsnɔːkəlɪŋ/', uz: 'Trubka menen suzıw', example: 'We saw colorful fish while snorkeling near the coral reef.', emoji: '🐠' },
      { en: 'trampolining', ipa: '/ˌtræmpəˈliːnɪŋ/', uz: 'Batutta sekiriw', example: 'The children had fun trampolining in the park yesterday.', emoji: '🤸' },
      { en: 'windsurfing', ipa: '/ˈwɪndsɜːfɪŋ/', uz: 'Jel taqtasında suzıw', example: 'He is learning windsurfing at the beach this summer.', emoji: '🏄' },
    ],
  },
  {
    title: '10-tema — Pasıllar hám hawa-rayı',
    order: 10,
    emoji: '🌦️',
    words: [
      { en: 'spring', ipa: '/sprɪŋ/', uz: 'Báhár', example: 'In spring, flowers bloom and the weather gets warmer.', emoji: '🌷' },
      { en: 'summer', ipa: '/ˈsʌmə/', uz: 'Jaz', example: 'We often swim in the river during summer.', emoji: '☀️' },
      { en: 'fall', ipa: '/fɔːl/', uz: 'Kúz', example: 'The leaves turn orange and yellow in fall.', emoji: '🍂' },
      { en: 'winter', ipa: '/ˈwɪntə/', uz: 'Qıs', example: 'It snows a lot in winter.', emoji: '❄️' },
      { en: 'monsoon', ipa: '/mɒnˈsuːn/', uz: 'Musson', example: 'The monsoon brings heavy rain to many countries in Asia.', emoji: '🌧️' },
      { en: 'drought', ipa: '/draʊt/', uz: 'Qurǵaqshılıq', example: 'The long drought dried up the small river near our village.', emoji: '🏜️' },
      { en: 'flood', ipa: '/flʌd/', uz: 'Tasqın', example: 'The flood damaged many houses along the river bank.', emoji: '🌊' },
      { en: 'storm', ipa: '/stɔːm/', uz: 'Boran', example: 'A big storm destroyed many trees.', emoji: '🌪️' },
      { en: 'thunder and lightning', ipa: '/ˈθʌndə ənd ˈlaɪtnɪŋ/', uz: 'Gúrildew hám shaqmaq', example: 'We saw thunder and lightning during the night storm.', emoji: '⛈️' },
    ],
  },
  {
    title: '11-tema — Kemping',
    order: 11,
    emoji: '⛺',
    words: [
      { en: 'blanket', ipa: '/ˈblæŋkɪt/', uz: 'Kórpe', example: 'I always bring a warm blanket when we go camping.', emoji: '🛏️' },
      { en: 'bowl', ipa: '/bəʊl/', uz: 'Kasa', example: 'She poured hot soup into a small bowl.', emoji: '🥣' },
      { en: 'cup', ipa: '/kʌp/', uz: 'Kese', example: 'He drank hot tea from a cup by the fire.', emoji: '☕' },
      { en: 'map', ipa: '/mæp/', uz: 'Karta', example: 'We used a map to find the camping site.', emoji: '🗺️' },
      { en: 'plate', ipa: '/pleɪt/', uz: 'Tabaq', example: 'Put the food on your plate before we eat.', emoji: '🍽️' },
      { en: 'backpack', ipa: '/ˈbækpæk/', uz: 'Ryukzak', example: 'My backpack is full of clothes and snacks.', emoji: '🎒' },
      { en: 'sleeping bag', ipa: '/ˈsliːpɪŋ bæg/', uz: 'Uyqı qapı', example: 'I slept warmly in my sleeping bag last night.', emoji: '🛌' },
      { en: 'tent', ipa: '/tent/', uz: 'Shatır', example: 'We set up our tent near the lake.', emoji: '⛺' },
      { en: 'flashlight', ipa: '/ˈflæʃlaɪt/', uz: 'Fonarik', example: 'We used a flashlight to see in the dark forest.', emoji: '🔦' },
      { en: 'water bottle', ipa: '/ˈwɔːtə ˈbɒtl/', uz: 'Suw shishesi', example: 'Don\'t forget to fill your water bottle before the hike.', emoji: '🥤' },
    ],
  },
  {
    title: '12-tema — Talant kórsetiw keshesi',
    order: 12,
    emoji: '🎤',
    words: [
      { en: 'do acrobatics', ipa: '/duː ˌækrəˈbætɪks/', uz: 'Akrobatika kórsetiw', example: 'The gymnast can do amazing acrobatics on the stage.', emoji: '🎪' },
      { en: 'do cartwheels', ipa: '/duː ˈkɑːtwiːlz/', uz: 'Aylanba atlaw', example: 'My sister loves to do cartwheels in the garden.', emoji: '🤸' },
      { en: 'do tricks', ipa: '/duː trɪks/', uz: 'Ámeller kórsetiw', example: 'The clown did funny tricks to make children laugh.', emoji: '🎩' },
      { en: 'juggle', ipa: '/ˈdʒʌgl/', uz: 'Jonglyorlıq etiw', example: 'He can juggle three balls at the same time.', emoji: '🤹' },
      { en: 'make sculptures', ipa: '/meɪk ˈskʌlptʃəz/', uz: 'Músin jasaw', example: 'The artist makes beautiful sculptures out of clay.', emoji: '🗿' },
      { en: 'paint portraits', ipa: '/peɪnt ˈpɔːtrɪts/', uz: 'Portret sızıw', example: 'She likes to paint portraits of her friends and family.', emoji: '🖼️' },
      { en: 'play instruments', ipa: '/pleɪ ˈɪnstrəmənts/', uz: 'Muzıka áspaplarında oynaw', example: 'Many students learn to play instruments at school.', emoji: '🎸' },
      { en: 'do street dancing', ipa: '/duː striːt ˈdɑːnsɪŋ/', uz: 'Kóshe biyin orınlaw', example: 'The boys practice street dancing every afternoon in the park.', emoji: '🕺' },
      { en: 'read poetry', ipa: '/riːd ˈpəʊɪtri/', uz: 'Óleń oqıw', example: 'He reads poetry beautifully in front of the whole class.', emoji: '📜' },
      { en: 'tell jokes', ipa: '/tel dʒəʊks/', uz: 'Anekdot aytıw', example: 'My best friend always tells jokes to make us laugh.', emoji: '😂' },
    ],
  },
  {
    title: '13-tema — Xalıqaralıq taǵamlar',
    order: 13,
    emoji: '🍽️',
    words: [
      { en: 'curry', ipa: '/ˈkʌri/', uz: 'Karri', example: 'My favourite dish is chicken curry with rice.', emoji: '🍛' },
      { en: 'dumplings', ipa: '/ˈdʌmplɪŋz/', uz: 'Dumpling', example: 'We ate hot dumplings for dinner last night.', emoji: '🥟' },
      { en: 'fish and chips', ipa: '/fɪʃ ənd tʃɪps/', uz: 'Balıq hám kartoshka', example: 'In England, people often eat fish and chips on Fridays.', emoji: '🍟' },
      { en: 'kebabs', ipa: '/kɪˈbæbz/', uz: 'Kebab', example: 'We cooked kebabs on the fire during our picnic.', emoji: '🍢' },
      { en: 'noodles', ipa: '/ˈnuːdlz/', uz: 'Lapsha', example: 'She likes eating noodles with vegetables for lunch.', emoji: '🍜' },
      { en: 'paella', ipa: '/paɪˈelə/', uz: 'Paelya', example: 'Paella is a famous rice dish from Spain.', emoji: '🥘' },
      { en: 'rice and beans', ipa: '/raɪs ənd biːnz/', uz: 'Gúrish hám lobiya', example: 'Rice and beans are a popular meal in many countries.', emoji: '🍚' },
      { en: 'stew', ipa: '/stjuː/', uz: 'Sorpa', example: 'My grandmother makes delicious stew with meat and potatoes.', emoji: '🍲' },
      { en: 'sushi', ipa: '/ˈsuːʃi/', uz: 'Sushi', example: 'Sushi is a traditional Japanese food made with rice and fish.', emoji: '🍣' },
      { en: 'tacos', ipa: '/ˈtækəʊz/', uz: 'Tako', example: 'We made tacos with beef, cheese and vegetables.', emoji: '🌮' },
    ],
  },
  {
    title: '14-tema — Muzıka',
    order: 14,
    emoji: '🎵',
    words: [
      { en: 'clarinet', ipa: '/ˌklærɪˈnet/', uz: 'Klarnet', example: 'My brother learned to play the clarinet last year.', emoji: '🎶' },
      { en: 'cymbals', ipa: '/ˈsɪmbəlz/', uz: 'Tarelka', example: 'The drummer hit the cymbals loudly at the end of the song.', emoji: '🥁' },
      { en: 'drums', ipa: '/drʌmz/', uz: 'Baraban', example: 'He plays the drums in a rock band.', emoji: '🥁' },
      { en: 'electric guitar', ipa: '/ɪˌlektrɪk ɡɪˈtɑː/', uz: 'Elektr gitara', example: 'She bought a new electric guitar for her birthday.', emoji: '🎸' },
      { en: 'flute', ipa: '/fluːt/', uz: 'Fleyta', example: 'The girl practises the flute every afternoon after school.', emoji: '🪈' },
      { en: 'keyboard', ipa: '/ˈkiːbɔːd/', uz: 'Klaviatura', example: 'He composes songs using an electronic keyboard at home.', emoji: '🎹' },
      { en: 'saxophone', ipa: '/ˈsæksəfəʊn/', uz: 'Saksofon', example: 'The musician played a beautiful tune on the saxophone.', emoji: '🎷' },
      { en: 'trombone', ipa: '/trɒmˈbəʊn/', uz: 'Trombon', example: 'The trombone makes a deep, rich sound in the band.', emoji: '🎶' },
      { en: 'trumpet', ipa: '/ˈtrʌmpɪt/', uz: 'Truba', example: 'He blew the trumpet loudly during the parade.', emoji: '🎺' },
      { en: 'violin', ipa: '/ˌvaɪəˈlɪn/', uz: 'Skripka', example: 'She has played the violin since she was six years old.', emoji: '🎻' },
    ],
  },
  {
    title: '15-tema — Házir hám burın',
    order: 15,
    emoji: '💻',
    words: [
      { en: 'dictionary', ipa: '/ˈdɪkʃənri/', uz: 'Sózlik', example: 'I looked up the new word in my English dictionary.', emoji: '📖' },
      { en: 'e-book', ipa: '/ˈiːbʊk/', uz: 'Elektron kitap', example: 'She reads an e-book on her tablet every night.', emoji: '📱' },
      { en: 'email', ipa: '/ˈiːmeɪl/', uz: 'Elektron xat', example: 'He sent me an email about the school trip yesterday.', emoji: '📧' },
      { en: 'encyclopedia', ipa: '/ɪnˌsaɪkləˈpiːdiə/', uz: 'Entsiklopediya', example: 'This encyclopedia has information about animals from around the world.', emoji: '📚' },
      { en: 'letter', ipa: '/ˈletə/', uz: 'Xat', example: 'My grandmother wrote me a letter last summer.', emoji: '✉️' },
      { en: 'magazine', ipa: '/ˌmæɡəˈziːn/', uz: 'Jurnal', example: 'My sister buys a fashion magazine every month.', emoji: '📰' },
      { en: 'newspaper', ipa: '/ˈnjuːzˌpeɪpə/', uz: 'Gazeta', example: 'My father reads the newspaper every morning with his tea.', emoji: '🗞️' },
      { en: 'online game', ipa: '/ˈɒnlaɪn ɡeɪm/', uz: 'Onlayn oyın', example: 'The boys play an online game together after finishing homework.', emoji: '🎮' },
      { en: 'text message', ipa: '/tekst ˈmesɪdʒ/', uz: 'Qısqa xabar', example: 'She sent a text message to her friend about the party.', emoji: '💬' },
      { en: 'website', ipa: '/ˈwebsaɪt/', uz: 'Sayt', example: 'The library\'s website has information about new books.', emoji: '🌐' },
    ],
  },
  {
    title: '16-tema — Qorshaǵan ortalıq',
    order: 16,
    emoji: '♻️',
    words: [
      { en: 'aluminum', ipa: '/əˈluːmɪnəm/', uz: 'Alyuminiy', example: 'This drink can is made of lightweight aluminum.', emoji: '🥫' },
      { en: 'cardboard', ipa: '/ˈkɑːdbɔːd/', uz: 'Karton', example: 'We packed all the old books in a cardboard box.', emoji: '📦' },
      { en: 'electricity', ipa: '/ɪˌlekˈtrɪsɪti/', uz: 'Elektr', example: 'The village finally got electricity two years ago.', emoji: '⚡' },
      { en: 'gas', ipa: '/ɡæs/', uz: 'Gaz', example: 'We cook our dinner every night using gas.', emoji: '🔥' },
      { en: 'glass', ipa: '/ɡlɑːs/', uz: 'Shisha', example: 'Please put the empty glass bottles in this bin.', emoji: '🍾' },
      { en: 'paper', ipa: '/ˈpeɪpə/', uz: 'Qaǵaz', example: 'She wrote a short letter on a piece of paper.', emoji: '📄' },
      { en: 'plastic', ipa: '/ˈplæstɪk/', uz: 'Plastik', example: 'Plastic bottles can take hundreds of years to break down.', emoji: '🥤' },
      { en: 'solar power', ipa: '/ˈsəʊlə ˈpaʊə/', uz: 'Quyash energiyası', example: 'Our new school building runs entirely on solar power.', emoji: '☀️' },
      { en: 'water', ipa: '/ˈwɔːtə/', uz: 'Suw', example: 'Every plant in the garden needs water to grow.', emoji: '💧' },
      { en: 'wind power', ipa: '/wɪnd ˈpaʊə/', uz: 'Jel energiyası', example: 'Wind power is a clean way to make electricity.', emoji: '🌬️' },
    ],
  },
  {
    title: '17-tema — Kosmos',
    order: 17,
    emoji: '🚀',
    words: [
      { en: 'astronaut', ipa: '/ˈæstrənɔːt/', uz: 'Kosmonavt', example: 'The astronaut floated freely inside the space station.', emoji: '👨‍🚀' },
      { en: 'Earth', ipa: '/ɜːθ/', uz: 'Jer', example: 'The Earth takes exactly one year to orbit the Sun.', emoji: '🌍' },
      { en: 'Mars', ipa: '/mɑːz/', uz: 'Mars', example: 'Scientists sent a small robot to explore Mars.', emoji: '🔴' },
      { en: 'planets', ipa: '/ˈplænɪts/', uz: 'Planetalar', example: 'There are eight planets moving around our Sun.', emoji: '🪐' },
      { en: 'space laboratory', ipa: '/speɪs ləˈbɒrətri/', uz: 'Kosmos laboratoriyası', example: 'Astronauts carry out experiments inside the space laboratory.', emoji: '🔬' },
      { en: 'space station', ipa: '/speɪs ˈsteɪʃn/', uz: 'Kosmos stansiyası', example: 'The crew will live on the space station for six months.', emoji: '🛰️' },
      { en: 'spacecraft', ipa: '/ˈspeɪskrɑːft/', uz: 'Kosmos kemesi', example: 'The spacecraft landed safely back on Earth this morning.', emoji: '🚀' },
      { en: 'spacesuit', ipa: '/ˈspeɪssuːt/', uz: 'Kosmos kostyumı', example: 'He put on his spacesuit before going outside to work.', emoji: '🧑‍🚀' },
      { en: 'stars', ipa: '/stɑːz/', uz: 'Jıldızlar', example: 'The astronomer counted hundreds of stars through her telescope.', emoji: '⭐' },
      { en: 'the Moon', ipa: '/ðə muːn/', uz: 'Ay', example: 'The first astronauts walked on the Moon in 1969.', emoji: '🌙' },
    ],
  },
  {
    title: '18-tema — Bayramlar',
    order: 18,
    emoji: '🎉',
    words: [
      { en: 'clown', ipa: '/klaʊn/', uz: 'Kloun', example: 'The clown made all the children laugh loudly.', emoji: '🤡' },
      { en: 'costume', ipa: '/ˈkɒstjuːm/', uz: 'Kostyum', example: 'She wore a colorful costume for the school parade.', emoji: '👗' },
      { en: 'dancer', ipa: '/ˈdɑːnsə/', uz: 'Biyshi', example: 'The dancer performed a beautiful traditional dance on stage.', emoji: '💃' },
      { en: 'dragon', ipa: '/ˈdræɡən/', uz: 'Ajdarha', example: 'A giant paper dragon led the festival parade downtown.', emoji: '🐉' },
      { en: 'fireworks', ipa: '/ˈfaɪəwɜːks/', uz: 'Salyut', example: 'Bright fireworks lit up the night sky over the city.', emoji: '🎆' },
      { en: 'float', ipa: '/fləʊt/', uz: 'Bayram arbası', example: 'A colorful float moved slowly through the crowded street.', emoji: '🎊' },
      { en: 'amusement park', ipa: '/əˈmjuːzmənt pɑːk/', uz: 'Attraksion baǵı', example: 'We rode the roller coaster at the amusement park all day.', emoji: '🎡' },
      { en: 'mask', ipa: '/mɑːsk/', uz: 'Maska', example: 'He wore a scary mask for the celebration last night.', emoji: '🎭' },
      { en: 'musician', ipa: '/mjuːˈzɪʃn/', uz: 'Muzıkant', example: 'A musician played the drum during the whole parade.', emoji: '🎸' },
      { en: 'pirate', ipa: '/ˈpaɪərət/', uz: 'Qaraqshı', example: 'The boy dressed up as a pirate for the party.', emoji: '🏴‍☠️' },
    ],
  },
];

// Mirrors the Learn flow's Test phase format ("X" sóziniń awdarması qaysı?) for
// pedagogical consistency, rather than the old mixed-English clue format.
const QUIZ_QUESTIONS = [
  { question: '"the United States" sóziniń awdarması qaysı?', options: ['Qurama Shtatlar', 'Italiya', 'Kolumbiya', 'Ullı Britaniya'], correctIndex: 0 },
  { question: '"trampolining" sóziniń awdarması qaysı?', options: ['Aqualang menen suwǵa shómiw', 'Batutta sekiriw', 'Qayaǵa tırmasıw', 'Jel taqtasında suzıw'], correctIndex: 1 },
  { question: '"make sculptures" sóziniń awdarması qaysı?', options: ['Muzıka áspaplarında oynaw', 'Kóshe biyin orınlaw', 'Aylanba atlaw', 'Músin jasaw'], correctIndex: 3 },
  { question: '"dry the dishes" sóziniń awdarması qaysı?', options: ['Qoqıstı shığarıw', 'Idıstı súrtiw', 'Dastarhandı jayıw', 'Gúllerdi suwgarıw'], correctIndex: 1 },
  { question: '"stew" sóziniń awdarması qaysı?', options: ['Karri', 'Sorpa', 'Lapsha', 'Kebab'], correctIndex: 1 },
  { question: '"Aqıllı" inglizshede qalay aytıladı?', options: ['talkative', 'smart', 'funny', 'sporty'], correctIndex: 1 },
  { question: '"kind" sóziniń awdarması qaysı?', options: ['Dostana', 'Ónerpaz', 'Sózmar', 'Meyirban'], correctIndex: 3 },
  { question: '"costume" sóziniń awdarması qaysı?', options: ['Ajdarha', 'Qaraqshı', 'Kostyum', 'Maska'], correctIndex: 2 },
  { question: '"video camera" sóziniń awdarması qaysı?', options: ['Noutbuk', 'Video kamera', 'Elektron kitap oqıǵısh', 'Sanlı kamera'], correctIndex: 1 },
  { question: '"Idıstı súrtiw" inglizshede qalay aytıladı?', options: ['dry the dishes', 'set the table', 'clean my bedroom', 'cook dinner'], correctIndex: 0 },
  { question: '"Qorqqan" inglizshede qalay aytıladı?', options: ['hungry', 'tired', 'scared', 'interested'], correctIndex: 2 },
  { question: '"whale" sóziniń awdarması qaysı?', options: ['Júldız balıq', 'Kit', 'Delfin', 'Segizayaq'], correctIndex: 1 },
  { question: '"sushi" sóziniń awdarması qaysı?', options: ['Kebab', 'Balıq hám kartoshka', 'Sushi', 'Karri'], correctIndex: 2 },
  { question: '"Kórpe" inglizshede qalay aytıladı?', options: ['tent', 'bowl', 'blanket', 'plate'], correctIndex: 2 },
  { question: '"map" sóziniń awdarması qaysı?', options: ['Tabaq', 'Karta', 'Shatır', 'Kasa'], correctIndex: 1 },
  { question: '"canoeing" sóziniń awdarması qaysı?', options: ['Kartingde jarısıw', 'Qayaǵa tırmasıw', 'Kanoeda esiw', 'Batutta sekiriw'], correctIndex: 2 },
  { question: '"Colombia" sóziniń awdarması qaysı?', options: ['Ispaniya', 'Meksika', 'Ullı Britaniya', 'Kolumbiya'], correctIndex: 3 },
  { question: '"Sportshı" inglizshede qalay aytıladı?', options: ['sporty', 'shy', 'funny', 'talkative'], correctIndex: 0 },
  { question: '"read poetry" sóziniń awdarması qaysı?', options: ['Portret sızıw', 'Jonglyorlıq etiw', 'Muzıka áspaplarında oynaw', 'Óleń oqıw'], correctIndex: 3 },
  { question: '"hiking" sóziniń awdarması qaysı?', options: ['Qayaǵa tırmasıw', 'Piyada sayaqatlaw', 'Kartingde jarısıw', 'Tolqında taqta menen suzıw'], correctIndex: 1 },
  { question: '"Qıs" inglizshede qalay aytıladı?', options: ['winter', 'storm', 'monsoon', 'fall'], correctIndex: 0 },
  { question: '"Aral" inglizshede qalay aytıladı?', options: ['jungle', 'waterfall', 'volcano', 'island'], correctIndex: 3 },
  { question: '"hardworking" sóziniń awdarması qaysı?', options: ['Uyatshań', 'Ónerpaz', 'Meyirban', 'Miynetsúyer'], correctIndex: 3 },
  { question: '"rowing" sóziniń awdarması qaysı?', options: ['Batutta sekiriw', 'Trubka menen suzıw', 'Qayıq esiw', 'Qayaǵa tırmasıw'], correctIndex: 2 },
  { question: '"tablet" sóziniń awdarması qaysı?', options: ['Planshet', 'Noutbuk', 'Smartfon', 'Elektron kitap oqıǵısh'], correctIndex: 0 },
  { question: '"France" sóziniń awdarması qaysı?', options: ['Meksika', 'Fransiya', 'Qıtay', 'Ullı Britaniya'], correctIndex: 1 },
  { question: '"worried" sóziniń awdarması qaysı?', options: ['Alańdaǵan', 'Qorqqan', 'Sharshaǵan', 'Shóllegen'], correctIndex: 0 },
  { question: '"space station" sóziniń awdarması qaysı?', options: ['Ay', 'Kosmonavt', 'Kosmos kemesi', 'Kosmos stansiyası'], correctIndex: 3 },
  { question: '"Kloun" inglizshede qalay aytıladı?', options: ['float', 'mask', 'pirate', 'clown'], correctIndex: 3 },
  { question: '"China" sóziniń awdarması qaysı?', options: ['Meksika', 'Qıtay', 'Italiya', 'Kolumbiya'], correctIndex: 1 },
  { question: '"jellyfish" sóziniń awdarması qaysı?', options: ['Meduza', 'Tasbaqa', 'Segizayaq', 'Skat'], correctIndex: 0 },
  { question: '"Zerikken" inglizshede qalay aytıladı?', options: ['scared', 'surprised', 'bored', 'angry'], correctIndex: 2 },
  { question: '"bodyboarding" sóziniń awdarması qaysı?', options: ['Tolqında taqta menen suzıw', 'Qayaǵa tırmasıw', 'Piyada sayaqatlaw', 'Kanoeda esiw'], correctIndex: 0 },
  { question: '"turtle" sóziniń awdarması qaysı?', options: ['Tasbaqa', 'Segizayaq', 'Skat', 'Shayan'], correctIndex: 0 },
  { question: '"Kúlkili" inglizshede qalay aytıladı?', options: ['sporty', 'funny', 'hardworking', 'naughty'], correctIndex: 1 },
  { question: '"angry" sóziniń awdarması qaysı?', options: ['Aş', 'Tań qalǵan', 'Ashıwlı', 'Alańdaǵan'], correctIndex: 2 },
  { question: '"scuba diving" sóziniń awdarması qaysı?', options: ['Aqualang menen suwǵa shómiw', 'Piyada sayaqatlaw', 'Qayıq esiw', 'Trubka menen suzıw'], correctIndex: 0 },
  { question: '"Paelya" inglizshede qalay aytıladı?', options: ['paella', 'kebabs', 'sushi', 'dumplings'], correctIndex: 0 },
  { question: '"Shól" inglizshede qalay aytıladı?', options: ['desert', 'volcano', 'lake', 'mountain'], correctIndex: 0 },
  { question: '"text message" sóziniń awdarması qaysı?', options: ['Elektron kitap', 'Sózlik', 'Onlayn oyın', 'Qısqa xabar'], correctIndex: 3 },
  { question: '"dictionary" sóziniń awdarması qaysı?', options: ['Qısqa xabar', 'Sayt', 'Sózlik', 'Jurnal'], correctIndex: 2 },
  { question: '"astronaut" sóziniń awdarması qaysı?', options: ['Kosmonavt', 'Kosmos kemesi', 'Kosmos laboratoriyası', 'Kosmos stansiyası'], correctIndex: 0 },
  { question: '"MP4 player" sóziniń awdarması qaysı?', options: ['Sanlı kamera', 'Oyın konsolı', 'Planshet', 'MP4 pleer'], correctIndex: 3 },
  { question: '"volcano" sóziniń awdarması qaysı?', options: ['Kól', 'Taw', 'Vulkan', 'Úńgir'], correctIndex: 2 },
  { question: '"Trubka menen suzıw" inglizshede qalay aytıladı?', options: ['go-carting', 'windsurfing', 'snorkeling', 'rowing'], correctIndex: 2 },
  { question: '"text a friend" sóziniń awdarması qaysı?', options: ['Basqalarǵa járdem beriw', 'Dosqa xabar jazıw', 'Jılaw', 'Qıyqırıw'], correctIndex: 1 },
  { question: '"seal" sóziniń awdarması qaysı?', options: ['Skat', 'Júldız balıq', 'Kit', 'Itbalıq'], correctIndex: 3 },
  { question: '"Naushnik" inglizshede qalay aytıladı?', options: ['headphones', 'MP4 player', 'smartphone', 'video camera'], correctIndex: 0 },
  { question: '"sweep the floor" sóziniń awdarması qaysı?', options: ['Keshki tamaqtı pisiriw', 'Gúllerdi suwgarıw', 'Poldı súpiriw', 'Idıstı súrtiw'], correctIndex: 2 },
  { question: '"Russia" sóziniń awdarması qaysı?', options: ['Ispaniya', 'Kolumbiya', 'Italiya', 'Rossiya'], correctIndex: 3 },
  { question: '"interested" sóziniń awdarması qaysı?', options: ['Alańdaǵan', 'Tań qalǵan', 'Qızıqqan', 'Sharshaǵan'], correctIndex: 2 },
  { question: '"surprised" sóziniń awdarması qaysı?', options: ['Tolqınlanǵan', 'Tań qalǵan', 'Ashıwlı', 'Sharshaǵan'], correctIndex: 1 },
  { question: '"Earth" sóziniń awdarması qaysı?', options: ['Jer', 'Kosmos laboratoriyası', 'Kosmonavt', 'Mars'], correctIndex: 0 },
  { question: '"set the table" sóziniń awdarması qaysı?', options: ['Bólmemdi tazalaw', 'Dastarhandı jayıw', 'Idıstı súrtiw', 'Tósegimdi jıynaw'], correctIndex: 1 },
  { question: '"Alańdaǵan" inglizshede qalay aytıladı?', options: ['bored', 'scared', 'surprised', 'worried'], correctIndex: 3 },
  { question: '"glass" sóziniń awdarması qaysı?', options: ['Gaz', 'Shisha', 'Elektr', 'Alyuminiy'], correctIndex: 1 },
  { question: '"tent" sóziniń awdarması qaysı?', options: ['Shatır', 'Uyqı qapı', 'Tabaq', 'Suw shishesi'], correctIndex: 0 },
  { question: '"drums" sóziniń awdarması qaysı?', options: ['Klarnet', 'Klaviatura', 'Baraban', 'Truba'], correctIndex: 2 },
  { question: '"laptop" sóziniń awdarması qaysı?', options: ['Oyın konsolı', 'MP4 pleer', 'Noutbuk', 'Planshet'], correctIndex: 2 },
  { question: '"shout" sóziniń awdarması qaysı?', options: ['Dosqa xabar jazıw', 'Kúliw', 'Qıyqırıw', 'Sekiriw'], correctIndex: 2 },
];

// Tests recognizing similar-sounding ENGLISH words from a spoken English
// sentence — intentionally stays English end-to-end, that's the point of the
// exercise. (Currently orphaned: the standalone Listen screen was removed from
// the frontend nav, but the route/data are kept — see web session notes.)
const LISTEN_QUESTIONS = [
  { sentence: 'She is smart and always gets good grades.', options: ['smart', 'naughty', 'friendly', 'shy'], correctIndex: 0 },
  { sentence: 'Brazil is famous for its beautiful beaches and football.', options: ['Spain', 'Brazil', 'the United States', 'the United Kingdom'], correctIndex: 1 },
  { sentence: 'We swam in the cool water of the lake.', options: ['volcano', 'lake', 'jungle', 'waterfall'], correctIndex: 1 },
  { sentence: 'Don\'t forget to fill your water bottle before the hike.', options: ['bowl', 'tent', 'water bottle', 'cup'], correctIndex: 2 },
  { sentence: 'A musician played the drum during the whole parade.', options: ['musician', 'mask', 'costume', 'float'], correctIndex: 0 },
  { sentence: 'My brother plays football games on his games console.', options: ['smartphone', 'e-reader', 'games console', 'tablet'], correctIndex: 2 },
  { sentence: 'We were surprised to see snow in April.', options: ['hungry', 'surprised', 'scared', 'worried'], correctIndex: 1 },
  { sentence: 'We rode the roller coaster at the amusement park all day.', options: ['dancer', 'musician', 'amusement park', 'dragon'], correctIndex: 2 },
  { sentence: 'They went canoeing down the river last weekend.', options: ['trampolining', 'snorkeling', 'scuba diving', 'canoeing'], correctIndex: 3 },
  { sentence: 'Please don\'t litter in the school playground.', options: ['cry', 'help others', 'throw a ball', 'litter'], correctIndex: 3 },
  { sentence: 'We used a map to find the camping site.', options: ['bowl', 'blanket', 'map', 'water bottle'], correctIndex: 2 },
  { sentence: 'The turtle slowly crawled across the warm sand.', options: ['dolphin', 'whale', 'jellyfish', 'turtle'], correctIndex: 3 },
  { sentence: 'The team practiced rowing on the lake every morning.', options: ['bodyboarding', 'go-carting', 'trampolining', 'rowing'], correctIndex: 3 },
  { sentence: 'She is very interested in learning new foreign languages.', options: ['hungry', 'thirsty', 'bored', 'interested'], correctIndex: 3 },
  { sentence: 'Tigers and monkeys live in the thick jungle.', options: ['cave', 'mountain', 'jungle', 'island'], correctIndex: 2 },
  { sentence: 'Our family enjoys hiking in the mountains every summer.', options: ['windsurfing', 'rock climbing', 'hiking', 'go-carting'], correctIndex: 2 },
  { sentence: 'My brother learned to play the clarinet last year.', options: ['clarinet', 'trombone', 'keyboard', 'cymbals'], correctIndex: 0 },
  { sentence: 'He reads many books on his e-reader every night.', options: ['MP4 player', 'video camera', 'tablet', 'e-reader'], correctIndex: 3 },
  { sentence: 'Students shouldn\'t use a cell phone during the lesson.', options: ['shout', 'use a cell phone', 'help others', 'laugh'], correctIndex: 1 },
  { sentence: 'Put the food on your plate before we eat.', options: ['plate', 'flashlight', 'cup', 'blanket'], correctIndex: 0 },
  { sentence: 'She reads an e-book on her tablet every night.', options: ['e-book', 'text message', 'magazine', 'newspaper'], correctIndex: 0 },
  { sentence: 'The shy boy didn\'t want to speak in class.', options: ['shy', 'sporty', 'naughty', 'hardworking'], correctIndex: 0 },
  { sentence: 'France is famous for the Eiffel Tower in Paris.', options: ['France', 'Mexico', 'China', 'Colombia'], correctIndex: 0 },
  { sentence: 'She bought a new electric guitar for her birthday.', options: ['keyboard', 'electric guitar', 'trombone', 'flute'], correctIndex: 1 },
  { sentence: 'He can juggle three balls at the same time.', options: ['paint portraits', 'juggle', 'do street dancing', 'play instruments'], correctIndex: 1 },
  { sentence: 'The little boy was scared of the dark room.', options: ['tired', 'thirsty', 'interested', 'scared'], correctIndex: 3 },
  { sentence: 'China has the longest wall in the world.', options: ['China', 'Mexico', 'the United Kingdom', 'Brazil'], correctIndex: 0 },
  { sentence: 'The little boy started to cry when he fell down.', options: ['litter', 'cry', 'hop', 'text a friend'], correctIndex: 1 },
  { sentence: 'He listens to songs and watches videos on his MP4 player.', options: ['headphones', 'tablet', 'MP4 player', 'e-reader'], correctIndex: 2 },
  { sentence: 'The children watched cartoons on the tablet after school.', options: ['headphones', 'tablet', 'digital camera', 'video camera'], correctIndex: 1 },
];

const BATTLE_QUESTIONS = [
  { question: '"Elektron kitap oqıǵısh" inglizshede qalay aytıladı?', options: ['e-reader', 'games console', 'MP4 player', 'digital camera'], correctIndex: 0 },
  { question: '"stars" sóziniń awdarması qaysı?', options: ['Kosmonavt', 'Jıldızlar', 'Kosmos kemesi', 'Kosmos stansiyası'], correctIndex: 1 },
  { question: '"cry" sóziniń awdarması qaysı?', options: ['Mobil telefon paydalanıw', 'Jılaw', 'Atlap júriw', 'Sekiriw'], correctIndex: 1 },
  { question: '"fall" sóziniń awdarması qaysı?', options: ['Kúz', 'Gúrildew hám shaqmaq', 'Báhár', 'Boran'], correctIndex: 0 },
  { question: '"Sharshaǵan" inglizshede qalay aytıladı?', options: ['excited', 'tired', 'interested', 'angry'], correctIndex: 1 },
  { question: '"read poetry" sóziniń awdarması qaysı?', options: ['Jonglyorlıq etiw', 'Óleń oqıw', 'Muzıka áspaplarında oynaw', 'Kóshe biyin orınlaw'], correctIndex: 1 },
  { question: '"Oyın konsolı" inglizshede qalay aytıladı?', options: ['smartphone', 'games console', 'television', 'MP4 player'], correctIndex: 1 },
  { question: '"Júldız balıq" inglizshede qalay aytıladı?', options: ['octopus', 'shark', 'starfish', 'stingray'], correctIndex: 2 },
  { question: '"thunder and lightning" sóziniń awdarması qaysı?', options: ['Qıs', 'Boran', 'Musson', 'Gúrildew hám shaqmaq'], correctIndex: 3 },
  { question: '"paella" sóziniń awdarması qaysı?', options: ['Paelya', 'Gúrish hám lobiya', 'Tako', 'Karri'], correctIndex: 0 },
  { question: '"drums" sóziniń awdarması qaysı?', options: ['Fleyta', 'Baraban', 'Saksofon', 'Tarelka'], correctIndex: 1 },
  { question: '"make my bed" sóziniń awdarması qaysı?', options: ['Keshki tamaqtı pisiriw', 'Qoqıstı shığarıw', 'Tósegimdi jıynaw', 'Bólmemdi tazalaw'], correctIndex: 2 },
  { question: '"Basqalarǵa járdem beriw" inglizshede qalay aytıladı?', options: ['cry', 'use a cell phone', 'text a friend', 'help others'], correctIndex: 3 },
  { question: '"pirate" sóziniń awdarması qaysı?', options: ['Muzıkant', 'Ajdarha', 'Qaraqshı', 'Attraksion baǵı'], correctIndex: 2 },
  { question: '"smart" sóziniń awdarması qaysı?', options: ['Aqıllı', 'Kúlkili', 'Meyirban', 'Sózmar'], correctIndex: 0 },
  { question: '"help others" sóziniń awdarması qaysı?', options: ['Qıyqırıw', 'Sekiriw', 'Atlap júriw', 'Basqalarǵa járdem beriw'], correctIndex: 3 },
  { question: '"litter" sóziniń awdarması qaysı?', options: ['Sekiriw', 'Atlap júriw', 'Qoqıs taslaw', 'Qıyqırıw'], correctIndex: 2 },
  { question: '"Sayt" inglizshede qalay aytıladı?', options: ['e-book', 'magazine', 'encyclopedia', 'website'], correctIndex: 3 },
  { question: '"windsurfing" sóziniń awdarması qaysı?', options: ['Jel taqtasında suzıw', 'Qayaǵa tırmasıw', 'Aqualang menen suwǵa shómiw', 'Batutta sekiriw'], correctIndex: 0 },
  { question: '"take the trash out" sóziniń awdarması qaysı?', options: ['Bólmemdi tazalaw', 'Hammamdı tazalaw', 'Poldı súpiriw', 'Qoqıstı shığarıw'], correctIndex: 3 },
  { question: '"stingray" sóziniń awdarması qaysı?', options: ['Shayan', 'Skat', 'Itbalıq', 'Kit'], correctIndex: 1 },
  { question: '"do tricks" sóziniń awdarması qaysı?', options: ['Jonglyorlıq etiw', 'Ámeller kórsetiw', 'Óleń oqıw', 'Kóshe biyin orınlaw'], correctIndex: 1 },
  { question: '"desert" sóziniń awdarması qaysı?', options: ['Kól', 'Sharshama', 'Aral', 'Shól'], correctIndex: 3 },
  { question: '"Spain" sóziniń awdarması qaysı?', options: ['Meksika', 'Fransiya', 'Ispaniya', 'Rossiya'], correctIndex: 2 },
  { question: '"throw a ball" sóziniń awdarması qaysı?', options: ['Atlap júriw', 'Kúliw', 'Dop laqtırıw', 'Sekiriw'], correctIndex: 2 },
  { question: '"television" sóziniń awdarması qaysı?', options: ['Televizor', 'Sanlı kamera', 'Elektron kitap oqıǵısh', 'Planshet'], correctIndex: 0 },
  { question: '"Meduza" inglizshede qalay aytıladı?', options: ['dolphin', 'stingray', 'jellyfish', 'crab'], correctIndex: 2 },
  { question: '"talkative" sóziniń awdarması qaysı?', options: ['Erke', 'Sózmar', 'Kúlkili', 'Meyirban'], correctIndex: 1 },
  { question: '"Russia" sóziniń awdarması qaysı?', options: ['Meksika', 'Braziliya', 'Italiya', 'Rossiya'], correctIndex: 3 },
  { question: '"turtle" sóziniń awdarması qaysı?', options: ['Shayan', 'Akula', 'Júldız balıq', 'Tasbaqa'], correctIndex: 3 },
  { question: '"Braziliya" inglizshede qalay aytıladı?', options: ['France', 'the United Kingdom', 'Italy', 'Brazil'], correctIndex: 3 },
  { question: '"Kúlkili" inglizshede qalay aytıladı?', options: ['talkative', 'kind', 'artistic', 'funny'], correctIndex: 3 },
  { question: '"bored" sóziniń awdarması qaysı?', options: ['Alańdaǵan', 'Zerikken', 'Shóllegen', 'Qızıqqan'], correctIndex: 1 },
  { question: '"newspaper" sóziniń awdarması qaysı?', options: ['Sayt', 'Elektron xat', 'Gazeta', 'Entsiklopediya'], correctIndex: 2 },
  { question: '"China" sóziniń awdarması qaysı?', options: ['Qurama Shtatlar', 'Meksika', 'Italiya', 'Qıtay'], correctIndex: 3 },
  { question: '"Itbalıq" inglizshede qalay aytıladı?', options: ['jellyfish', 'dolphin', 'shark', 'seal'], correctIndex: 3 },
  { question: '"Tań qalǵan" inglizshede qalay aytıladı?', options: ['surprised', 'excited', 'hungry', 'tired'], correctIndex: 0 },
  { question: '"dictionary" sóziniń awdarması qaysı?', options: ['Qısqa xabar', 'Sayt', 'Sózlik', 'Onlayn oyın'], correctIndex: 2 },
  { question: '"artistic" sóziniń awdarması qaysı?', options: ['Aqıllı', 'Erke', 'Ónerpaz', 'Sózmar'], correctIndex: 2 },
  { question: '"e-reader" sóziniń awdarması qaysı?', options: ['Noutbuk', 'Elektron kitap oqıǵısh', 'Smartfon', 'Video kamera'], correctIndex: 1 },
  { question: '"mountain" sóziniń awdarması qaysı?', options: ['Dárya', 'Aral', 'Taw', 'Sharshama'], correctIndex: 2 },
  { question: '"clarinet" sóziniń awdarması qaysı?', options: ['Klarnet', 'Saksofon', 'Tarelka', 'Fleyta'], correctIndex: 0 },
  { question: '"text a friend" sóziniń awdarması qaysı?', options: ['Jılaw', 'Qoqıs taslaw', 'Dosqa xabar jazıw', 'Basqalarǵa járdem beriw'], correctIndex: 2 },
  { question: '"Colombia" sóziniń awdarması qaysı?', options: ['Ullı Britaniya', 'Qıtay', 'Kolumbiya', 'Meksika'], correctIndex: 2 },
  { question: '"Qayaǵa tırmasıw" inglizshede qalay aytıladı?', options: ['windsurfing', 'rowing', 'scuba diving', 'rock climbing'], correctIndex: 3 },
  { question: '"tacos" sóziniń awdarması qaysı?', options: ['Kebab', 'Tako', 'Balıq hám kartoshka', 'Gúrish hám lobiya'], correctIndex: 1 },
  { question: '"aluminum" sóziniń awdarması qaysı?', options: ['Gaz', 'Suw', 'Alyuminiy', 'Jel energiyası'], correctIndex: 2 },
  { question: '"starfish" sóziniń awdarması qaysı?', options: ['Shayan', 'Júldız balıq', 'Tasbaqa', 'Itbalıq'], correctIndex: 1 },
  { question: '"Ay" inglizshede qalay aytıladı?', options: ['astronaut', 'spacesuit', 'Earth', 'the Moon'], correctIndex: 3 },
  { question: '"float" sóziniń awdarması qaysı?', options: ['Ajdarha', 'Kostyum', 'Bayram arbası', 'Attraksion baǵı'], correctIndex: 2 },
  { question: '"dolphin" sóziniń awdarması qaysı?', options: ['Kit', 'Shayan', 'Júldız balıq', 'Delfin'], correctIndex: 3 },
  { question: '"smartphone" sóziniń awdarması qaysı?', options: ['Televizor', 'Smartfon', 'Elektron kitap oqıǵısh', 'MP4 pleer'], correctIndex: 1 },
  { question: '"octopus" sóziniń awdarması qaysı?', options: ['Segizayaq', 'Akula', 'Kit', 'Skat'], correctIndex: 0 },
  { question: '"games console" sóziniń awdarması qaysı?', options: ['Oyın konsolı', 'Elektron kitap oqıǵısh', 'Televizor', 'Smartfon'], correctIndex: 0 },
  { question: '"video camera" sóziniń awdarması qaysı?', options: ['MP4 pleer', 'Sanlı kamera', 'Video kamera', 'Televizor'], correctIndex: 2 },
  { question: '"tired" sóziniń awdarması qaysı?', options: ['Qızıqqan', 'Sharshaǵan', 'Shóllegen', 'Ashıwlı'], correctIndex: 1 },
  { question: '"clean the bathroom" sóziniń awdarması qaysı?', options: ['Keshki tamaqtı pisiriw', 'Dastarhandı jayıw', 'Hammamdı tazalaw', 'Qoqıstı shığarıw'], correctIndex: 2 },
  { question: '"Elektr" inglizshede qalay aytıladı?', options: ['glass', 'electricity', 'cardboard', 'water'], correctIndex: 1 },
  { question: '"clean my bedroom" sóziniń awdarması qaysı?', options: ['Gúllerdi suwgarıw', 'Qoqıstı shığarıw', 'Bólmemdi tazalaw', 'Idıstı súrtiw'], correctIndex: 2 },
  { question: '"Akrobatika kórsetiw" inglizshede qalay aytıladı?', options: ['do street dancing', 'make sculptures', 'do tricks', 'do acrobatics'], correctIndex: 3 },
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

  // Units/words are only ever touched when SEED_REPLACE_CONTENT=1 is set.
  // A full replace deletes every learner's word progress (see the warning
  // below), so it must never be the default behavior of a plain `npm run
  // seed` — that command also refreshes regions/badges/demo/questions and
  // gets run far more casually than a deliberate content swap should be.
  if (process.env.SEED_REPLACE_CONTENT === '1') {
    if (process.env.NODE_ENV === 'production' && process.env.SEED_REPLACE_CONTENT_CONFIRM_PROD !== '1') {
      console.error(
        'SEED_REPLACE_CONTENT=1 with NODE_ENV=production also requires SEED_REPLACE_CONTENT_CONFIRM_PROD=1 — refusing to run.',
      );
      process.exit(1);
    }

    let dbHost = 'unknown';
    try {
      dbHost = new URL(process.env.DATABASE_URL ?? '').host;
    } catch {
      // leave dbHost as 'unknown'
    }
    console.warn(`
!!! SEED_REPLACE_CONTENT=1 — this DELETES every Unit/Word row and every
!!! learner's word progress (UserWordProgress, LearnSession,
!!! LearnBlockProgress), then rebuilds units/words from the UNITS list in
!!! this file. This cannot be undone without a database backup.
!!! Target database host: ${dbHost}
`);

    // Full replace, not upsert: the UNITS list below was rebuilt from scratch
    // (Cambridge "Guess What!" Grade 5/6 vocabulary, 2026-07-16) and no longer
    // corresponds word-for-word to whatever used to occupy these unit/order
    // slots. Upserting by order would silently reassign existing
    // UserWordProgress/LearnSession/LearnBlockProgress rows to a completely
    // different word, corrupting learners' FSRS state — so every dependent
    // table is wiped first and rebuilt clean.
    console.log('Clearing old units/words and dependent learn progress...');
    await prisma.userWordProgress.deleteMany({});
    await prisma.learnSession.deleteMany({});
    await prisma.learnBlockProgress.deleteMany({});
    await prisma.word.deleteMany({});
    await prisma.unit.deleteMany({});
    await prisma.user.updateMany({ data: { wordsKnownCount: 0 } });

    console.log('Seeding units/words...');
    for (const unit of UNITS) {
      const createdUnit = await prisma.unit.create({ data: { title: unit.title, order: unit.order, emoji: unit.emoji } });
      if (unit.words) {
        await prisma.word.createMany({
          data: unit.words.map((w, i) => ({ unitId: createdUnit.id, en: w.en, ipa: w.ipa, uz: w.uz, example: w.example, emoji: w.emoji, order: i })),
        });
      }
    }
  } else {
    console.log('Skipping units/words (set SEED_REPLACE_CONTENT=1 to replace) — existing content left untouched.');
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
