import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ContentLoader } from '../components/ContentLoader';
import { ApiError } from '../lib/api';
import { getErrorMessage } from '../lib/errorMessage';
import { createTeacherClass, getClassHardWords, getClassRoster, getTeacherClasses } from '../lib/teacherApi';
import type { ClassRosterEntry, HardWordAggregate, TeacherClass } from '../types/api';

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString();
}

export function TeacherScreen() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<TeacherClass[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [roster, setRoster] = useState<ClassRosterEntry[] | null>(null);
  const [hardWords, setHardWords] = useState<HardWordAggregate[] | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getTeacherClasses()
      .then((res) => {
        setClasses(res.classes);
        if (res.classes.length > 0) setSelectedId(res.classes[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? getErrorMessage(t, err) : String(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setRoster(null);
      setHardWords(null);
      return;
    }
    setRosterLoading(true);
    Promise.all([getClassRoster(selectedId), getClassHardWords(selectedId)])
      .then(([r, h]) => {
        setRoster(r.roster);
        setHardWords(h.hardWords);
      })
      .catch((err) => setError(err instanceof ApiError ? getErrorMessage(t, err) : String(err)))
      .finally(() => setRosterLoading(false));
  }, [selectedId, t]);

  async function handleCreateClass() {
    if (!newName.trim() || creating) return;
    setCreating(true);
    setError('');
    try {
      const { class: cls } = await createTeacherClass(newName.trim());
      setClasses((prev) => [cls, ...(prev ?? [])]);
      setSelectedId(cls.id);
      setNewName('');
    } catch (err) {
      setError(err instanceof ApiError ? getErrorMessage(t, err) : String(err));
    } finally {
      setCreating(false);
    }
  }

  if (classes === null) {
    return <ContentLoader />;
  }

  return (
    <div className="animate-pop max-w-[900px] mx-auto">
      <h2 className="font-display font-extrabold text-[25px] mb-[18px] text-text">{t('teacher.title')}</h2>

      {error && (
        <div className="bg-danger-light text-danger-dark border border-[#FECACA] rounded-[14px] p-3 mb-4 text-[13.5px] font-bold">
          {error}
        </div>
      )}

      <div className="bg-white border border-border-2 rounded-[22px] p-[18px] mb-5" style={{ boxShadow: '0 2px 10px rgba(15,23,42,.04)' }}>
        <div className="text-[11px] font-extrabold text-text-softer tracking-[.06em] mb-3">{t('teacher.myClasses')}</div>

        {classes.length === 0 && <div className="text-[13.5px] font-bold text-text-softer mb-3">{t('teacher.noClasses')}</div>}

        {classes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {classes.map((c) => {
              const active = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="rounded-[13px] px-4 py-3 cursor-pointer text-left transition-all"
                  style={
                    active
                      ? { background: '#F5F3FF', border: '2px solid #7C3AED' }
                      : { background: '#F8FAFC', border: '2px solid #E8EDF3' }
                  }
                >
                  <div className="font-display font-extrabold text-[15px] text-text">{c.name}</div>
                  <div className="text-[12px] font-bold text-text-softer">
                    {t('teacher.memberCount', { count: c.memberCount })} · {t('teacher.joinCodeLabel')}: <span className="font-mono">{c.joinCode}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('teacher.createClassPlaceholder') ?? undefined}
            className="flex-1 rounded-[12px] border-2 border-border-2 px-3 py-2 text-[14px] font-bold outline-none focus:border-[#7C3AED]"
          />
          <button
            onClick={handleCreateClass}
            disabled={creating || !newName.trim()}
            className="rounded-[12px] px-4 py-2 font-display font-extrabold text-[14px] text-white cursor-pointer disabled:opacity-50"
            style={{ background: '#7C3AED' }}
          >
            {t('teacher.createClassBtn')}
          </button>
        </div>
      </div>

      {selectedId != null && (
        <>
          <div className="bg-white border border-border-2 rounded-[22px] p-[18px] mb-5 overflow-x-auto" style={{ boxShadow: '0 2px 10px rgba(15,23,42,.04)' }}>
            <div className="text-[11px] font-extrabold text-text-softer tracking-[.06em] mb-3">{t('teacher.rosterTitle')}</div>
            {rosterLoading && <ContentLoader />}
            {!rosterLoading && roster && roster.length === 0 && (
              <div className="text-[13.5px] font-bold text-text-softer">{t('teacher.rosterEmpty')}</div>
            )}
            {!rosterLoading && roster && roster.length > 0 && (
              <table className="w-full text-[13.5px] min-w-[560px]">
                <thead>
                  <tr className="text-left text-[11px] font-extrabold text-text-softer tracking-[.04em] border-b border-border-3">
                    <th className="py-2 pr-3">{t('teacher.rosterName')}</th>
                    <th className="py-2 pr-3">{t('teacher.rosterWords')}</th>
                    <th className="py-2 pr-3">{t('teacher.rosterXp')}</th>
                    <th className="py-2 pr-3">{t('teacher.rosterStreak')}</th>
                    <th className="py-2 pr-3">{t('teacher.rosterBlocksWeek')}</th>
                    <th className="py-2 pr-3">{t('teacher.rosterLastActive')}</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => (
                    <tr key={r.userId} className="border-b border-border-3 last:border-b-0">
                      <td className="py-[10px] pr-3 font-bold text-text">{r.fullName}</td>
                      <td className="py-[10px] pr-3 font-bold text-text-softer">{r.wordsKnownCount}</td>
                      <td className="py-[10px] pr-3 font-extrabold text-[#EAB308]">{r.xp}</td>
                      <td className="py-[10px] pr-3 font-bold text-text-softer">{r.streak}</td>
                      <td className="py-[10px] pr-3 font-bold text-text-softer">{r.blocksThisWeek}</td>
                      <td className="py-[10px] pr-3 font-bold text-text-softer">{formatDate(r.lastActiveDate) ?? t('teacher.rosterNever')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white border border-border-2 rounded-[22px] p-[18px]" style={{ boxShadow: '0 2px 10px rgba(15,23,42,.04)' }}>
            <div className="text-[11px] font-extrabold text-text-softer tracking-[.06em] mb-3">{t('teacher.hardWordsTitle')}</div>
            {!rosterLoading && hardWords && hardWords.length === 0 && (
              <div className="text-[13.5px] font-bold text-text-softer">{t('teacher.hardWordsEmpty')}</div>
            )}
            {!rosterLoading && hardWords && hardWords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hardWords.map((w) => (
                  <div key={w.wordId} className="rounded-[13px] border border-border-2 bg-danger-light px-3 py-2">
                    <div className="font-display font-extrabold text-[14px] text-danger-dark">{w.en}</div>
                    <div className="text-[12px] font-bold text-text-softer">{w.kaa} · {w.totalLapses}×</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
