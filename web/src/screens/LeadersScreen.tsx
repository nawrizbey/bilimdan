import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { ContentLoader } from '../components/ContentLoader';
import type { LeaderboardScope } from '../types/api';

const PODIUM_RANK_STYLE = {
  1: { height: 108, color: '#FACC15', avatar: 56 },
  2: { height: 80, color: '#CBD5E1', avatar: 48 },
  3: { height: 60, color: '#F59E0B', avatar: 48 },
} as const;

const SCOPE_TABS: { id: LeaderboardScope; labelKey: string }[] = [
  { id: 'school', labelKey: 'leaders.scopeSchool' },
  { id: 'district', labelKey: 'leaders.scopeDistrict' },
  { id: 'region', labelKey: 'leaders.scopeRegion' },
  { id: 'republic', labelKey: 'leaders.scopeRepublic' },
];

const RANK_STAT_META: { scope: LeaderboardScope; labelKey: string; color: string; bg: string }[] = [
  { scope: 'school', labelKey: 'leaders.rankInSchool', color: '#22C55E', bg: '#F0FDF4' },
  { scope: 'district', labelKey: 'leaders.rankInDistrict', color: '#0891B2', bg: '#ECFEFF' },
  { scope: 'region', labelKey: 'leaders.rankInRegion', color: '#7C3AED', bg: '#F5F3FF' },
  { scope: 'republic', labelKey: 'leaders.rankInRepublic', color: '#B45309', bg: '#FFFBEB' },
];

export function LeadersScreen() {
  const { t } = useTranslation();
  const leaderScope = useAppStore((s) => s.leaderScope);
  const leaderboard = useAppStore((s) => s.leaderboard);
  const loadLeaderboard = useAppStore((s) => s.loadLeaderboard);
  const setLeaderScope = useAppStore((s) => s.setLeaderScope);

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!leaderboard) {
    return <ContentLoader />;
  }

  const board = leaderboard.board;
  const podiumOrder = [board[1], board[0], board[2]].filter(Boolean);
  const scopeLabel = leaderboard.scope === 'republic' ? t('leaders.wholeRepublicLabel') : leaderboard.scopeLabel;

  return (
    <div className="animate-pop max-w-[760px] mx-auto">
      <h2 className="font-display font-extrabold text-[25px] mb-1 text-text">{t('leaders.title')}</h2>
      <p className="text-[14px] font-bold text-text-softer mb-5">{t('leaders.subtitle')}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {RANK_STAT_META.map((rs) => (
          <div key={rs.scope} className="rounded-[18px] p-4 text-center border border-border-2" style={{ background: rs.bg }}>
            <div className="text-[12px] font-extrabold text-text-softer mb-1">{t(rs.labelKey)}</div>
            <div className="font-display font-extrabold text-[26px]" style={{ color: rs.color }}>
              #{leaderboard.ranks[rs.scope].toLocaleString('en-US')}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-2">
        {SCOPE_TABS.map((tab) => {
          const active = leaderScope === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setLeaderScope(tab.id)}
              className="flex-1 p-[11px] rounded-[12px] cursor-pointer font-display font-extrabold text-[14px] transition-all"
              style={
                active
                  ? { background: '#0F172A', color: '#fff', boxShadow: '0 4px 12px rgba(15,23,42,.2)', border: 'none' }
                  : { background: '#fff', color: '#64748B', border: '1px solid #E8EDF3' }
              }
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>
      <div className="text-[12.5px] font-extrabold text-text mb-[18px] flex items-center gap-[7px]">
        <span className="w-2 h-2 rounded-[3px] bg-primary" />
        {scopeLabel}
      </div>

      {board.length === 0 && (
        <div className="text-center text-[14px] font-bold text-text-softer py-10">{t('leaders.noStudentsYet')}</div>
      )}

      {podiumOrder.length > 0 && (
        <div className="flex items-end justify-center gap-2 sm:gap-[14px] mb-[22px]">
          {podiumOrder.map((p) => {
            const style = PODIUM_RANK_STYLE[p.rank as 1 | 2 | 3];
            const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉';
            const avatarGradient = p.isMe
              ? 'linear-gradient(150deg,#22C55E,#16A34A)'
              : p.rank === 1
                ? 'linear-gradient(150deg,#F59E0B,#EA580C)'
                : 'linear-gradient(150deg,#3B82F6,#2563EB)';
            return (
              <div
                key={p.rank}
                className="flex flex-col items-center w-[96px] sm:w-[130px]"
                style={{ order: p.rank === 1 ? 2 : p.rank === 2 ? 1 : 3 }}
              >
                <div
                  className="rounded-full flex items-center justify-center text-white font-display font-extrabold"
                  style={{
                    width: style.avatar,
                    height: style.avatar,
                    fontSize: p.rank === 1 ? 26 : 22,
                    background: avatarGradient,
                    boxShadow: `0 0 0 4px ${style.color}55`,
                  }}
                >
                  {p.initial}
                </div>
                <div className="font-extrabold text-[12px] sm:text-[14px] text-text mt-2 text-center truncate w-full">
                  {p.name}
                  {p.isMe ? ` ${t('common.you')}` : ''}
                </div>
                <div className="font-extrabold text-[12px] sm:text-[13px] text-[#A16207]">{p.xp} XP</div>
                <div
                  className="mt-[10px] w-full rounded-t-[16px] flex items-start justify-center pt-[10px] text-[22px] sm:text-[26px]"
                  style={{ height: style.height, background: `linear-gradient(180deg,${style.color},${style.color}cc)` }}
                >
                  {medal}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white border border-border-2 rounded-[22px] p-[10px]" style={{ boxShadow: '0 2px 10px rgba(15,23,42,.04)' }}>
        {board.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 p-[12px_14px] rounded-[14px]"
            style={r.isMe ? { background: '#F0FDF4', border: '1px solid #BBF7D0' } : undefined}
          >
            <span className="w-[30px] text-center font-extrabold text-[15px] text-text-softer">{r.rank}</span>
            <div
              className="w-[38px] h-[38px] flex-none rounded-[11px] flex items-center justify-center text-white font-display font-extrabold text-[16px]"
              style={{ background: `linear-gradient(150deg,${r.isMe ? '#22C55E,#16A34A' : '#94A3B8,#64748B'})` }}
            >
              {r.initial}
            </div>
            <span className="flex-1 min-w-0 truncate font-bold text-[15px]" style={{ color: r.isMe ? '#15803D' : '#0F172A' }}>
              {r.name}
              {r.isMe ? ` ${t('common.you')}` : ''}
            </span>
            <span className="hidden sm:inline font-bold text-[13px] text-text-softer mr-[14px]">{r.words} {t('common.words')}</span>
            <span className="font-extrabold text-[14px] text-[#EAB308] flex-none">{r.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
