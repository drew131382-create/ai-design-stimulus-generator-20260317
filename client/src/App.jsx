import { useMemo, useState } from "react";
import { generateStimuli } from "./api";
import StimulusGroup from "./components/StimulusGroup";
import DetailPanel from "./components/DetailPanel";
import EmptyState from "./components/EmptyState";

const SAMPLE_PLACEHOLDER =
  "Example: Design an innovative mobile storage product for shared offices that improves adaptability, efficiency, and sustainability.";

export default function App() {
  const [requirement, setRequirement] = useState("");
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canGenerate = requirement.trim().length >= 8 && !loading;

  const groups = useMemo(() => {
    if (!result) return [];

    return [
      { key: "near", title: "Near Stimuli", items: result.near || [] },
      { key: "medium", title: "Medium Stimuli", items: result.medium || [] },
      { key: "far", title: "Far Stimuli", items: result.far || [] },
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
      setError(err.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="mb-6 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-semibold text-slate-900">AI Design Stimulus Generator</h1>
          <p className="mt-2 text-sm text-slate-600">
            A tool for design research that generates Near, Medium, and Far stimuli from your design requirement.
          </p>
        </header>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <label htmlFor="requirement" className="mb-2 block text-sm font-medium text-slate-700">
            Design Requirement
          </label>
          <textarea
            id="requirement"
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            rows={5}
            placeholder={SAMPLE_PLACEHOLDER}
            className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-slate-500"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-slate-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
            >
              {loading ? "Generating..." : "Generate Stimuli"}
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!result || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Regenerate
            </button>

            <span className="text-xs text-slate-500">Three groups, 10 stimuli each.</span>
          </div>

          {error ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
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