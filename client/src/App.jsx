import { useMemo, useState } from "react";
import { generateStimuli } from "./api";
import StimulusGroup from "./components/StimulusGroup";
import DetailPanel from "./components/DetailPanel";
import EmptyState from "./components/EmptyState";

const MIN_CHARS = 8;
const PLACEHOLDER =
  "\u4f8b\u5982\uff1a\u4e3a\u8001\u5e74\u4eba\u8bbe\u8ba1\u4e00\u6b3e\u96c6\u6210\u7076\uff0c\u63d0\u5347\u5b89\u5168\u6027\u3001\u6613\u6e05\u6d01\u4e0e\u64cd\u4f5c\u53ef\u7406\u89e3\u6027\u3002";

export default function App() {
  const [requirement, setRequirement] = useState("");
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentChars = requirement.trim().length;
  const canGenerate = currentChars >= MIN_CHARS && !loading;

  const groups = useMemo(() => {
    if (!result) return [];
    return [
      {
        key: "near",
        title: "Near Stimuli\uff08\u8fd1\u8ddd\u79bb\uff09",
        items: result.near || [],
      },
      {
        key: "medium",
        title: "Medium Stimuli\uff08\u4e2d\u8ddd\u79bb\uff09",
        items: result.medium || [],
      },
      {
        key: "far",
        title: "Far Stimuli\uff08\u8fdc\u8ddd\u79bb\uff09",
        items: result.far || [],
      },
    ];
  }, [result]);

  async function handleGenerate() {
    setLoading(true);
    setError("");

    try {
      const data = await generateStimuli(requirement.trim());
      setResult(data);
      setSelected(null);
    } catch (err) {
      setError(err.message || "\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="mb-6 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            {"AI \u8bbe\u8ba1\u523a\u6fc0\u8bcd\u751f\u6210\u5668"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {
              "\u6bcf\u6b21\u8fd4\u56de\u4e09\u7ec4\u7ed3\u679c\uff0c\u6bcf\u7ec4 10 \u4e2a\u8bcd\uff1b\u8bcd\u957f\u4e0d\u8d85\u8fc7 4 \u4e2a\u5b57\uff0c\u70b9\u51fb\u5361\u7247\u67e5\u770b\u7b80\u8981\u8be6\u60c5\u3002"
            }
          </p>
        </header>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <label htmlFor="requirement" className="mb-2 block text-sm font-medium text-slate-700">
            {"\u8bbe\u8ba1\u9700\u6c42"}
          </label>

          <textarea
            id="requirement"
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            rows={5}
            placeholder={PLACEHOLDER}
            className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-slate-500"
          />

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={currentChars < MIN_CHARS ? "text-amber-700" : "text-slate-500"}>
              {`\u81f3\u5c11\u8f93\u5165 ${MIN_CHARS} \u4e2a\u5b57\u7b26\u540e\u53ef\u751f\u6210`}
            </span>
            <span className="text-slate-500">
              {currentChars} / {MIN_CHARS}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-slate-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
            >
              {loading ? "\u751f\u6210\u4e2d..." : "\u751f\u6210\u523a\u6fc0\u8bcd"}
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!result || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {"\u91cd\u65b0\u751f\u6210"}
            </button>
          </div>

          {!canGenerate && !loading ? (
            <p className="mt-2 text-xs text-amber-700">
              {"\u8bf7\u5148\u8865\u5145\u9700\u6c42\u63cf\u8ff0\uff0c\u518d\u70b9\u51fb\u201c\u751f\u6210\u523a\u6fc0\u8bcd\u201d\u3002"}
            </p>
          ) : null}

          {error ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </section>

        {!result && !loading ? (
          <EmptyState />
        ) : (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="grid grid-cols-1 gap-4 lg:col-span-3 xl:grid-cols-3">
              {groups.map((group) => (
                <StimulusGroup
                  key={group.key}
                  type={group.key}
                  title={group.title}
                  items={group.items}
                  selected={selected}
                  onSelect={(category, item) => setSelected({ category, ...item })}
                />
              ))}
            </div>

            <div className="lg:col-span-1">
              <DetailPanel selected={selected} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
