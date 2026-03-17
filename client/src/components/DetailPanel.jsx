function categoryText(category) {
  if (category === "near") return "Near Stimuli";
  if (category === "medium") return "Medium Stimuli";
  return "Far Stimuli";
}

export default function DetailPanel({ selected }) {
  if (!selected) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Details</h3>
        <p className="text-sm leading-6 text-slate-500">Click any stimulus card to view details.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Details</h3>
      <dl className="space-y-3 text-sm text-slate-700">
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Word</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-medium">{selected.word}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Inspiration</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">{selected.inspiration}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Direction</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">{selected.direction}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Category</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">{categoryText(selected.category)}</dd>
        </div>
      </dl>
    </aside>
  );
}