import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface GameCard {
  type: string;
  title: string;
  desc: string;
  emoji: string;
  color: string;
  bg: string;
  badge?: string;
}

const GAMES: GameCard[] = [
  {
    type: 'live',
    title: 'Janlı atıspa',
    desc: 'Haqıyqıy oqıwshıǵa qarsı 3 soraw boyınsha tezkor jarıs',
    emoji: '⚔️',
    color: '#EC4899',
    bg: '#FDF2F8',
    badge: 'JANLI',
  },
  {
    type: 'memory',
    title: 'Xotira o\'yini',
    desc: 'Yopıq kartalardan inglizcha–o\'zbekcha juptlerdi tap',
    emoji: '🃏',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    type: 'truefalse',
    title: 'Tez javob',
    desc: 'Tarjima to\'g\'rimi yoki noto\'g\'rimi? 4 sekund ichida javob ber',
    emoji: '⚡',
    color: '#22C55E',
    bg: '#F0FDF4',
  },
  {
    type: 'fillblank',
    title: 'Bo\'sh joyni to\'ldir',
    desc: 'Gapda tusib qolgan inglizcha so\'zni top',
    emoji: '📝',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    type: 'missing',
    title: 'Harfni top',
    desc: '1–2 harfi o\'chirilgan so\'zni to\'ldir',
    emoji: '🔤',
    color: '#EC4899',
    bg: '#FDF2F8',
  },
  {
    type: 'dictation',
    title: 'Dıktant',
    desc: 'So\'zni eshit, inglizcha yoz',
    emoji: '🎧',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    type: 'sprint',
    title: 'Tez yod al',
    desc: 'So\'z 2 sekund ko\'rinadi — yodlab, keyin yoz',
    emoji: '⏱️',
    color: '#8B5CF6',
    bg: '#F3E8FF',
  },
  {
    type: 'scramble',
    title: 'Gap tuzish',
    desc: 'Aralashtirilgan gap so\'zlarini to\'g\'ri tartibga sol',
    emoji: '📋',
    color: '#06B6D4',
    bg: '#ECFEFF',
  },
  {
    type: 'category',
    title: 'Saralama',
    desc: 'So\'zlarni unli / undosh harfga qarab ikki guruhga ajrat',
    emoji: '🗂️',
    color: '#F97316',
    bg: '#FFF7ED',
  },
];

export function GamesHubScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handlePlay = (type: string) => {
    if (type === 'live') {
      navigate('/app/battle/live');
    } else {
      navigate(`/app/battle/${type}`);
    }
  };

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="mb-7">
        <h2 className="font-display font-extrabold text-[26px] sm:text-[28px] text-text mb-1">
          🎮 {t('nav.battle')}
        </h2>
        <p className="text-[14px] font-bold text-text-softer">
          O'zingizga yoqqan o'yin turini tanlang
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((game) => (
          <button
            key={game.type}
            onClick={() => handlePlay(game.type)}
            className="relative text-left bg-white border-2 border-border rounded-[20px] p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-offset-2 group"
            style={{
              borderColor: '#E8EDF3',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = game.color; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E8EDF3'; }}
          >
            {/* Live badge */}
            {game.badge && (
              <span
                className="absolute top-3 right-3 text-white text-[10px] font-extrabold py-[2px] px-[7px] rounded-[20px]"
                style={{ background: game.color }}
              >
                {game.badge}
              </span>
            )}

            {/* Emoji circle */}
            <div
              className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[24px] mb-4"
              style={{ background: game.bg }}
            >
              {game.emoji}
            </div>

            {/* Text */}
            <div
              className="font-display font-extrabold text-[16px] mb-1"
              style={{ color: game.color }}
            >
              {game.title}
            </div>
            <div className="text-[13px] font-bold text-text-softer leading-snug">
              {game.desc}
            </div>

            {/* Play button */}
            <div
              className="mt-4 inline-flex items-center gap-1 text-[13px] font-extrabold"
              style={{ color: game.color }}
            >
              O'ynash →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
