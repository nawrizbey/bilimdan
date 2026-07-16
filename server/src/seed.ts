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
