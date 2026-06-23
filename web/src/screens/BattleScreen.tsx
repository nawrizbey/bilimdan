import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { connectBattleSocket, sendAnswer, sendQueueJoin } from '../lib/battleSocket';
import { playCorrect, playIncorrect, playMatchFound, playTick } from '../lib/sound';

const QUESTION_SECONDS = 10;
const TOTAL_QUESTIONS = 3;
const RECONNECT_DELAYS_MS = [1500, 2500, 4000, 4000];
const RESUME_WATCHDOG_MS = 4000;

type ConnectionState = 'connected' | 'reconnecting' | 'reconnect-failed';

export function BattleScreen() {
  const navigate = useNavigate();
  const userId = useAppStore((s) => s.userId);
  const studentName = useAppStore((s) => s.studentName);
  const sfxEnabled = useAppStore((s) => s.settings.sfx);
  const battleStatus = useAppStore((s) => s.battleStatus);
  const battleWinnerId = useAppStore((s) => s.battleWinnerId);
  const battleOpponent = useAppStore((s) => s.battleOpponent);
  const battleQIndex = useAppStore((s) => s.battleQIndex);
  const battleQuestion = useAppStore((s) => s.battleQuestion);
  const battleDeadline = useAppStore((s) => s.battleDeadline);
  const battleMyScore = useAppStore((s) => s.battleMyScore);
  const battleOppScore = useAppStore((s) => s.battleOppScore);
  const battleYourChoice = useAppStore((s) => s.battleYourChoice);
  const battleOppChoice = useAppStore((s) => s.battleOppChoice);
  const battleCorrectIndex = useAppStore((s) => s.battleCorrectIndex);
  const battleXpAwarded = useAppStore((s) => s.battleXpAwarded);
  const battleApplyMessage = useAppStore((s) => s.battleApplyMessage);
  const battleSetQueueing = useAppStore((s) => s.battleSetQueueing);
  const battleReset = useAppStore((s) => s.battleReset);

  const wsRef = useRef<WebSocket | null>(null);
  const deliberateCloseRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(QUESTION_SECONDS);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const clearReconnectTimers = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (resumeWatchdogRef.current) {
      clearTimeout(resumeWatchdogRef.current);
      resumeWatchdogRef.current = null;
    }
  };

  const wireSocket = (ws: WebSocket) => {
    ws.onclose = () => {
      // A stale/replaced socket (e.g. the previous match's connection, superseded by
      // a rematch) closing later shouldn't trigger a reconnect for the current one.
      if (wsRef.current !== ws) return;
      wsRef.current = null;
      if (deliberateCloseRef.current) {
        deliberateCloseRef.current = false;
        return;
      }
      const status = useAppStore.getState().battleStatus;
      if (status === 'matched' || status === 'playing' || status === 'revealed') {
        scheduleReconnect();
      }
    };
  };

  const scheduleReconnect = () => {
    const attempt = reconnectAttemptsRef.current;
    if (attempt >= RECONNECT_DELAYS_MS.length) {
      setConnectionState('reconnect-failed');
      return;
    }
    setConnectionState('reconnecting');
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      const ws = connectBattleSocket((msg) => {
        battleApplyMessage(msg);
        if (msg.type === 'match:found' || msg.type === 'question:start' || msg.type === 'question:reveal' || msg.type === 'match:end') {
          clearReconnectTimers();
          reconnectAttemptsRef.current = 0;
          setConnectionState('connected');
        }
      });
      if (!ws) {
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;
      wireSocket(ws);
      ws.onopen = () => {
        resumeWatchdogRef.current = setTimeout(() => setConnectionState('reconnect-failed'), RESUME_WATCHDOG_MS);
      };
    }, RECONNECT_DELAYS_MS[attempt]);
  };

  useEffect(() => {
    return () => {
      clearReconnectTimers();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (battleStatus !== 'playing' || battleDeadline == null) return;
    const tick = () => setRemainingSeconds(Math.max(0, Math.ceil((battleDeadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [battleStatus, battleDeadline]);

  // Sound effects (gated by the "Ovoz effektlari" setting).
  useEffect(() => {
    if (sfxEnabled && battleStatus === 'matched') playMatchFound();
  }, [battleStatus, sfxEnabled]);

  const prevStatusRef = useRef(battleStatus);
  useEffect(() => {
    if (sfxEnabled && battleStatus === 'revealed' && prevStatusRef.current !== 'revealed' && battleYourChoice != null) {
      if (battleYourChoice === battleCorrectIndex) playCorrect();
      else playIncorrect();
    }
    prevStatusRef.current = battleStatus;
  }, [battleStatus, battleYourChoice, battleCorrectIndex, sfxEnabled]);

  useEffect(() => {
    if (sfxEnabled && battleStatus === 'playing' && remainingSeconds > 0 && remainingSeconds <= 3) playTick();
  }, [remainingSeconds, battleStatus, sfxEnabled]);

  const handleJoinQueue = () => {
    setConnectError(null);
    setConnectionState('connected');
    reconnectAttemptsRef.current = 0;
    battleSetQueueing();
    const ws = connectBattleSocket((msg) => battleApplyMessage(msg));
    if (!ws) {
      setConnectError('Tizimga kirish talab qilinadi');
      battleReset();
      return;
    }
    wireSocket(ws);
    ws.onopen = () => sendQueueJoin(ws);
    ws.onerror = () => setConnectError('Ulanishda xatolik yuz berdi');
    wsRef.current = ws;
  };

  const handleAnswer = (choice: number) => {
    if (!wsRef.current || battleQuestion == null) return;
    sendAnswer(wsRef.current, battleQIndex, choice);
  };

  const handleRematch = () => {
    battleReset();
    handleJoinQueue();
  };

  const closeDeliberately = () => {
    clearReconnectTimers();
    deliberateCloseRef.current = true;
    // Let wireSocket's onclose handler null wsRef once the close event actually
    // fires — nulling it here too would make that handler's `wsRef.current === ws`
    // check fail, leaving deliberateCloseRef stuck true and never consumed.
    wsRef.current?.close();
  };

  const handleLeave = () => {
    closeDeliberately();
    battleReset();
    navigate('/app/dashboard');
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false);
    handleLeave();
  };

  const initial = studentName.charAt(0).toUpperCase();
  const inActiveMatch = battleStatus === 'matched' || battleStatus === 'playing' || battleStatus === 'revealed';

  if (connectionState === 'reconnect-failed') {
    return (
      <div className="animate-pop max-w-[680px] mx-auto text-center bg-white border border-border-2 rounded-[24px] p-10" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
        <div className="text-[64px] mb-2">📡</div>
        <h2 className="font-display font-extrabold text-[24px] text-text mb-1">Ulanish tiklanmadi</h2>
        <p className="text-[14px] font-bold text-text-softer mb-6">
          Internet aloqasi uzilib qoldi va o'yinga qayta ulanib bo'lmadi. Agar raqibingiz o'ynashda davom etgan bo'lsa, siz mag'lub deb hisoblangan bo'lishingiz mumkin.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRematch}
            className="bg-battle text-white border-none rounded-[15px] py-[14px] px-[26px] font-display font-extrabold text-[16px] cursor-pointer"
            style={{ boxShadow: '0 5px 0 #BE185D' }}
          >
            ⚔️ Qayta urinish
          </button>
          <button
            onClick={handleLeave}
            className="bg-border-3 text-[#475569] border-none rounded-[15px] py-[14px] px-[26px] font-display font-bold text-[16px] cursor-pointer"
          >
            Bosh sahifa
          </button>
        </div>
      </div>
    );
  }

  if (battleStatus === 'idle') {
    return (
      <div className="animate-pop max-w-[680px] mx-auto text-center bg-white border border-border-2 rounded-[24px] p-10" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
        <div className="text-[64px] mb-2">⚔️</div>
        <h2 className="font-display font-extrabold text-[26px] text-text mb-1">Jonli batl</h2>
        <p className="text-[14px] font-bold text-text-softer mb-6">
          Haqiqiy o'quvchiga qarshi {TOTAL_QUESTIONS} ta savol bo'yicha tezkor bellashuv
        </p>
        {connectError && (
          <div className="bg-danger-light border border-[#FECACA] text-danger-dark text-[13px] font-bold rounded-[12px] p-3 mb-4">
            {connectError}
          </div>
        )}
        <button
          onClick={handleJoinQueue}
          className="bg-battle text-white border-none rounded-[15px] py-[14px] px-[26px] font-display font-extrabold text-[16px] cursor-pointer"
          style={{ boxShadow: '0 5px 0 #BE185D' }}
        >
          ⚔️ Raqib qidirish
        </button>
      </div>
    );
  }

  if (battleStatus === 'queueing') {
    return (
      <div className="animate-pop max-w-[680px] mx-auto text-center bg-white border border-border-2 rounded-[24px] p-10" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-[3px] border-border-2 animate-spin" style={{ borderTopColor: '#EC4899' }} />
        <h2 className="font-display font-extrabold text-[22px] text-text mb-1">Raqib qidirilmoqda…</h2>
        <p className="text-[14px] font-bold text-text-softer mb-6">Boshqa o'quvchi ulanishini kuting</p>
        <button
          onClick={handleLeave}
          className="bg-border-3 text-[#475569] border-none rounded-[14px] py-[11px] px-[22px] font-display font-bold text-[15px] cursor-pointer"
        >
          Bekor qilish
        </button>
      </div>
    );
  }

  const oppInitial = battleOpponent?.initial ?? '?';
  const oppName = battleOpponent?.name ?? 'Raqib';

  return (
    <div className="animate-pop max-w-[860px] mx-auto">
      {connectionState === 'reconnecting' && (
        <div className="mb-3 flex items-center justify-center gap-2 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[13px] font-bold rounded-[12px] p-3">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
          📡 Ulanish uzildi, qayta ulanmoqda…
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-[#0F172A]/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLeaveConfirm(false)}>
          <div
            className="bg-white rounded-[20px] p-7 max-w-[360px] w-full text-center"
            style={{ boxShadow: '0 20px 50px rgba(15,23,42,.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[40px] mb-2">⚠️</div>
            <h3 className="font-display font-extrabold text-[19px] text-text mb-1">Rostdan chiqasizmi?</h3>
            <p className="text-[13.5px] font-bold text-text-softer mb-5">Bu mag'lubiyat hisoblanadi va o'yin tugaydi.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-border-3 text-[#475569] border-none rounded-[13px] py-[11px] font-display font-bold text-[14px] cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmLeave}
                className="flex-1 bg-danger text-white border-none rounded-[13px] py-[11px] font-display font-extrabold text-[14px] cursor-pointer"
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {inActiveMatch && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowLeaveConfirm(true)}
            aria-label="O'yindan chiqish"
            className="text-[12px] font-bold text-text-softer bg-white border border-border-2 py-[5px] px-[11px] rounded-[11px] cursor-pointer hover:text-danger-dark hover:border-[#FECACA]"
          >
            ✕ Chiqish
          </button>
        </div>
      )}

      <div
        className="rounded-[24px] p-4 sm:p-[20px_26px] flex items-center gap-2 sm:gap-[18px]"
        style={{ background: 'linear-gradient(125deg,#1E293B,#0F172A)', boxShadow: '0 14px 36px rgba(15,23,42,.28)' }}
      >
        <div className="flex items-center gap-2 sm:gap-[13px] flex-1 min-w-0">
          <div
            className="w-10 h-10 sm:w-[54px] sm:h-[54px] flex-none rounded-[16px] flex items-center justify-center text-white font-display font-extrabold text-[18px] sm:text-[22px]"
            style={{ background: 'linear-gradient(150deg,#22C55E,#16A34A)', boxShadow: '0 0 0 3px rgba(34,197,94,.3)' }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-white font-extrabold text-[12.5px] sm:text-[15px] truncate">{studentName} (siz)</div>
            <div className="text-primary font-extrabold text-[11px] sm:text-[13px]">{battleMyScore} ball</div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-[6px] flex-none">
          <div className="font-display font-extrabold text-[18px] sm:text-[22px] text-[#FACC15] bg-[#FACC15]/[.12] w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center">
            VS
          </div>
          <div className="text-[10px] sm:text-[11px] font-extrabold text-text-soft whitespace-nowrap">
            SAVOL {Math.min(battleQIndex + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-[13px] flex-1 min-w-0 justify-end text-right">
          <div className="min-w-0">
            <div className="text-white font-extrabold text-[12.5px] sm:text-[15px] truncate">{oppName}</div>
            <div className="text-battle font-extrabold text-[11px] sm:text-[13px]">{battleOppScore} ball</div>
          </div>
          <div
            className="w-10 h-10 sm:w-[54px] sm:h-[54px] flex-none rounded-[16px] flex items-center justify-center text-white font-display font-extrabold text-[18px] sm:text-[22px]"
            style={{ background: 'linear-gradient(150deg,#EC4899,#DB2777)', boxShadow: '0 0 0 3px rgba(236,72,153,.3)' }}
          >
            {oppInitial}
          </div>
        </div>
      </div>

      {battleStatus === 'matched' && (
        <div className="mt-[18px] text-center bg-white border border-border-2 rounded-[24px] p-10" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
          <div className="text-[40px] mb-2 animate-floaty">⚔️</div>
          <h2 className="font-display font-extrabold text-[22px] text-text">Raqib topildi!</h2>
          <p className="text-[14px] font-bold text-text-softer">Boshlanmoqda…</p>
        </div>
      )}

      {(battleStatus === 'playing' || battleStatus === 'revealed') && battleQuestion && (
        <div className="mt-[18px]">
          <div className="flex items-center gap-3 mb-[18px]">
            <div className="flex-1 h-2 bg-border rounded-[20px] overflow-hidden">
              <div
                className="h-full rounded-[20px] transition-[width] duration-1000 ease-linear"
                style={{
                  width: `${(remainingSeconds / QUESTION_SECONDS) * 100}%`,
                  background: remainingSeconds <= 3 ? 'linear-gradient(90deg,#EF4444,#DC2626)' : 'linear-gradient(90deg,#F59E0B,#EC4899)',
                }}
              />
            </div>
            <span
              className="font-display font-extrabold text-[15px] min-w-[34px] text-right"
              style={{ color: remainingSeconds <= 3 ? '#DC2626' : '#B45309' }}
            >
              {remainingSeconds}s
            </span>
          </div>

          <div className="bg-white border border-border-2 rounded-[24px] p-[30px] text-center" style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}>
            <div className="text-[12.5px] font-extrabold text-battle tracking-[.06em] mb-2">⚡ TEZ JAVOB BERING</div>
            <h2 className="font-display font-extrabold text-[28px] text-text mb-[22px]">{battleQuestion.question}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px]">
              {battleQuestion.options.map((label, i) => {
                const revealed = battleStatus === 'revealed';
                let bg = '#F8FAFC';
                let bd = '#E8EDF3';
                let col = '#0F172A';
                if (revealed) {
                  if (i === battleCorrectIndex) {
                    bg = '#DCFCE7';
                    bd = '#22C55E';
                    col = '#15803D';
                  } else if (i === battleYourChoice) {
                    bg = '#FEE2E2';
                    bd = '#EF4444';
                    col = '#DC2626';
                  }
                } else if (battleYourChoice === i) {
                  bg = '#F1F5F9';
                  bd = '#94A3B8';
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={revealed || battleYourChoice != null}
                    className="p-[18px] rounded-[16px] border-2 font-display font-bold text-[18px] transition-all"
                    style={{ background: bg, borderColor: bd, color: col, cursor: revealed || battleYourChoice != null ? 'default' : 'pointer' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {battleStatus === 'revealed' && battleOppChoice != null && (
              <div className="mt-4 text-[12.5px] font-bold text-text-softer">
                {oppName} {battleOppChoice === battleCorrectIndex ? "to'g'ri" : "noto'g'ri"} javob berdi
              </div>
            )}
          </div>
        </div>
      )}

      {battleStatus === 'ended' && (
        <div
          className="animate-pop mt-[18px] bg-white border border-border-2 rounded-[24px] p-[38px] text-center"
          style={{ boxShadow: '0 8px 26px rgba(15,23,42,.06)' }}
        >
          {(() => {
            // Driven by winnerId (not score comparison) so a forfeit ending with
            // tied scores still correctly shows a win/loss instead of "Durrang".
            const won = battleWinnerId != null && battleWinnerId === userId;
            const lost = battleWinnerId != null && battleWinnerId !== userId;
            const resultTitle = won ? "G'alaba! 🏆" : lost ? "Mag'lubiyat" : 'Durrang';
            const resultEmoji = won ? '🎉' : lost ? '😅' : '🤝';
            const resultColor = won ? '#16A34A' : lost ? '#DB2777' : '#F59E0B';
            return (
              <>
                <div className="text-[64px] animate-floaty">{resultEmoji}</div>
                <h2 className="font-display font-extrabold text-[32px] my-2 mb-1" style={{ color: resultColor }}>
                  {resultTitle}
                </h2>
                <p className="text-[15px] font-bold text-text-softer mb-2">Yakuniy hisob</p>
                <div className="inline-flex items-center gap-[18px] font-display font-extrabold text-[34px] mb-2">
                  <span className="text-[#16A34A]">{battleMyScore}</span>
                  <span className="text-[#CBD5E1] text-[20px]">—</span>
                  <span className="text-[#DB2777]">{battleOppScore}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#FEFCE8] border border-[#FEF08A] rounded-[14px] py-[8px] px-[16px] mb-6">
                  <span className="font-extrabold text-[#A16207] text-[13px]">+{battleXpAwarded} XP</span>
                </div>
              </>
            );
          })()}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRematch}
              className="bg-battle text-white border-none rounded-[15px] py-[14px] px-[26px] font-display font-extrabold text-[16px] cursor-pointer"
              style={{ boxShadow: '0 5px 0 #BE185D' }}
            >
              ⚔️ Qayta o'ynash
            </button>
            <button
              onClick={handleLeave}
              className="bg-border-3 text-[#475569] border-none rounded-[15px] py-[14px] px-[26px] font-display font-bold text-[16px] cursor-pointer"
            >
              Bosh sahifa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
