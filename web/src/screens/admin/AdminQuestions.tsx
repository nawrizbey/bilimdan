import { useEffect, useState } from 'react';
import { adminFetch } from './adminApi';

type QuestionType = 'quiz' | 'battle' | 'listen';

interface Question {
  id: number;
  question?: string;
  sentence?: string;
  options: string[];
  correctIndex: number;
  order: number;
}

const TABS: { key: QuestionType; label: string }[] = [
  { key: 'quiz', label: 'Quiz' },
  { key: 'battle', label: 'Battle' },
  { key: 'listen', label: 'Listen' },
];

export function AdminQuestions() {
  const [tab, setTab] = useState<QuestionType>('quiz');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add form
  const [formText, setFormText] = useState('');
  const [formOptions, setFormOptions] = useState(['', '', '', '']);
  const [formCorrect, setFormCorrect] = useState(0);
  const [formOrder, setFormOrder] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  async function fetchQuestions(type: QuestionType) {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch(`/questions/${type}`);
      if (data) setQuestions(data.questions as Question[]);
    } catch {
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchQuestions(tab);
  }, [tab]);

  function resetForm() {
    setFormText('');
    setFormOptions(['', '', '', '']);
    setFormCorrect(0);
    setFormOrder('');
    setAddError('');
  }

  async function addQuestion() {
    setAddError('');
    if (!formText.trim()) { setAddError('Question text required'); return; }
    if (formOptions.some((o) => !o.trim())) { setAddError('All 4 options required'); return; }
    setAdding(true);
    try {
      const body: Record<string, unknown> = {
        options: formOptions.map((o) => o.trim()),
        correctIndex: formCorrect,
        order: parseInt(formOrder) || 99,
      };
      if (tab === 'listen') {
        body.sentence = formText.trim();
      } else {
        body.question = formText.trim();
      }
      await adminFetch(`/questions/${tab}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      resetForm();
      void fetchQuestions(tab);
    } catch {
      setAddError('Failed to add question');
    } finally {
      setAdding(false);
    }
  }

  async function deleteQuestion(id: number) {
    if (!confirm('Delete this question?')) return;
    await adminFetch(`/questions/${id}/${tab}`, { method: 'DELETE' });
    void fetchQuestions(tab);
  }

  const textLabel = tab === 'listen' ? 'Sentence' : 'Question';

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">Questions</h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); resetForm(); }}
            className={`px-4 py-2 text-sm font-medium rounded-t ${
              tab === t.key
                ? 'bg-white border border-b-white border-slate-200 text-blue-600 -mb-px'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add question form */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Add {tab.charAt(0).toUpperCase() + tab.slice(1)} Question</h3>
        <div className="flex flex-col gap-2">
          <input
            className="border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder={textLabel}
            value={formText}
            onChange={(e) => setFormText(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            {formOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={formCorrect === i}
                  onChange={() => setFormCorrect(i)}
                  title="Mark as correct"
                />
                <input
                  className="border border-slate-300 rounded px-3 py-2 text-sm flex-1"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...formOptions];
                    next[i] = e.target.value;
                    setFormOptions(next);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="border border-slate-300 rounded px-3 py-2 text-sm w-24"
              placeholder="Order"
              type="number"
              value={formOrder}
              onChange={(e) => setFormOrder(e.target.value)}
            />
            <span className="text-xs text-slate-400">Correct: Option {String.fromCharCode(65 + formCorrect)} (select radio)</span>
          </div>
          {addError && <p className="text-red-600 text-xs">{addError}</p>}
          <button
            onClick={addQuestion}
            disabled={adding}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60 self-start"
          >
            Add Question
          </button>
        </div>
      </div>

      {/* Questions list */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">#</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">{textLabel}</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Options</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">Correct</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{q.order}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-xs">
                    {q.sentence ?? q.question}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {q.options.map((o, i) => (
                      <span key={i} className={i === q.correctIndex ? 'font-bold text-green-700' : ''}>
                        {String.fromCharCode(65 + i)}: {o}
                        {i < q.options.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-green-700 font-semibold">
                    {String.fromCharCode(65 + q.correctIndex)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => void deleteQuestion(q.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No questions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
