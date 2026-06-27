import { useEffect, useState } from 'react';
import { adminFetch } from './adminApi';

interface Unit {
  id: number;
  title: string;
  order: number;
  emoji: string;
  wordCount: number;
}

interface Word {
  id: number;
  en: string;
  ipa: string;
  uz: string;
  example: string;
  emoji: string;
  order: number;
}

export function AdminUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);

  // Add unit form
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  const [unitError, setUnitError] = useState('');

  // Add word form
  const [wEn, setWEn] = useState('');
  const [wIpa, setWIpa] = useState('');
  const [wUz, setWUz] = useState('');
  const [wExample, setWExample] = useState('');
  const [wEmoji, setWEmoji] = useState('');
  const [addingWord, setAddingWord] = useState(false);
  const [wordError, setWordError] = useState('');

  async function fetchUnits() {
    setLoading(true);
    try {
      const data = await adminFetch('/units');
      if (data) setUnits(data.units as Unit[]);
    } catch {
      setError('Failed to load units');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchUnits();
  }, []);

  async function fetchWords(unitId: number) {
    setWordsLoading(true);
    try {
      const data = await adminFetch(`/units/${unitId}/words`);
      if (data) setWords(data.words as Word[]);
    } catch {
      setWords([]);
    } finally {
      setWordsLoading(false);
    }
  }

  function selectUnit(unitId: number) {
    setSelectedUnitId(unitId);
    setWords([]);
    void fetchWords(unitId);
  }

  async function deleteUnit(id: number) {
    if (!confirm('Delete this unit?')) return;
    await adminFetch(`/units/${id}`, { method: 'DELETE' });
    if (selectedUnitId === id) {
      setSelectedUnitId(null);
      setWords([]);
    }
    void fetchUnits();
  }

  async function addUnit() {
    setUnitError('');
    if (!newTitle.trim()) { setUnitError('Title required'); return; }
    setAddingUnit(true);
    try {
      await adminFetch('/units', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), emoji: newEmoji.trim() || '📖', order: parseInt(newOrder) || 99 }),
      });
      setNewTitle('');
      setNewEmoji('');
      setNewOrder('');
      void fetchUnits();
    } catch {
      setUnitError('Failed to add unit');
    } finally {
      setAddingUnit(false);
    }
  }

  async function deleteWord(id: number) {
    if (!confirm('Delete this word?')) return;
    await adminFetch(`/words/${id}`, { method: 'DELETE' });
    if (selectedUnitId != null) void fetchWords(selectedUnitId);
  }

  async function addWord() {
    setWordError('');
    if (!wEn.trim() || !wUz.trim()) { setWordError('English and translation required'); return; }
    if (selectedUnitId == null) return;
    setAddingWord(true);
    try {
      await adminFetch(`/units/${selectedUnitId}/words`, {
        method: 'POST',
        body: JSON.stringify({ en: wEn.trim(), ipa: wIpa.trim(), uz: wUz.trim(), example: wExample.trim(), emoji: wEmoji.trim() || '📝' }),
      });
      setWEn(''); setWIpa(''); setWUz(''); setWExample(''); setWEmoji('');
      void fetchWords(selectedUnitId);
    } catch {
      setWordError('Failed to add word');
    } finally {
      setAddingWord(false);
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">Units</h2>

      {/* Add unit form */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Unit</h3>
        <div className="flex gap-2 flex-wrap">
          <input
            className="border border-slate-300 rounded px-3 py-2 text-sm flex-1 min-w-[180px]"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            className="border border-slate-300 rounded px-3 py-2 text-sm w-20"
            placeholder="Emoji"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
          />
          <input
            className="border border-slate-300 rounded px-3 py-2 text-sm w-20"
            placeholder="Order"
            type="number"
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value)}
          />
          <button
            onClick={addUnit}
            disabled={addingUnit}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            Add
          </button>
        </div>
        {unitError && <p className="text-red-600 text-xs mt-2">{unitError}</p>}
      </div>

      {/* Units table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-semibold">#</th>
              <th className="text-left px-4 py-3 text-slate-600 font-semibold">Emoji</th>
              <th className="text-left px-4 py-3 text-slate-600 font-semibold">Title</th>
              <th className="text-left px-4 py-3 text-slate-600 font-semibold">Words</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr
                key={u.id}
                className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${selectedUnitId === u.id ? 'bg-blue-50' : ''}`}
                onClick={() => selectUnit(u.id)}
              >
                <td className="px-4 py-3 text-slate-500">{u.order}</td>
                <td className="px-4 py-3">{u.emoji}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{u.title}</td>
                <td className="px-4 py-3 text-slate-500">{u.wordCount}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); void deleteUnit(u.id); }}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No units yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Words for selected unit */}
      {selectedUnit && (
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-3">
            Words in "{selectedUnit.emoji} {selectedUnit.title}"
          </h3>

          {/* Add word form */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Add Word</h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input className="border border-slate-300 rounded px-3 py-2 text-sm" placeholder="English (en)" value={wEn} onChange={(e) => setWEn(e.target.value)} />
              <input className="border border-slate-300 rounded px-3 py-2 text-sm" placeholder="IPA (optional)" value={wIpa} onChange={(e) => setWIpa(e.target.value)} />
              <input className="border border-slate-300 rounded px-3 py-2 text-sm" placeholder="Translation (uz/kaa)" value={wUz} onChange={(e) => setWUz(e.target.value)} />
              <input className="border border-slate-300 rounded px-3 py-2 text-sm" placeholder="Emoji (optional)" value={wEmoji} onChange={(e) => setWEmoji(e.target.value)} />
              <input className="border border-slate-300 rounded px-3 py-2 text-sm col-span-2" placeholder="Example sentence (optional)" value={wExample} onChange={(e) => setWExample(e.target.value)} />
            </div>
            {wordError && <p className="text-red-600 text-xs mb-2">{wordError}</p>}
            <button
              onClick={addWord}
              disabled={addingWord}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              Add Word
            </button>
          </div>

          {wordsLoading ? (
            <p className="text-slate-500 text-sm">Loading words…</p>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-600 font-semibold">English</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-semibold">IPA</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-semibold">Translation</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-semibold">Example</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((w) => (
                    <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{w.emoji} {w.en}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{w.ipa}</td>
                      <td className="px-4 py-3 text-slate-600">{w.uz}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">{w.example}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => void deleteWord(w.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {words.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No words yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
