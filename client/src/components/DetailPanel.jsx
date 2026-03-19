function categoryText(category) {
  if (category === "near") return "Near Stimuli\uff08\u8fd1\u8ddd\u79bb\uff09";
  if (category === "medium") return "Medium Stimuli\uff08\u4e2d\u8ddd\u79bb\uff09";
  return "Far Stimuli\uff08\u8fdc\u8ddd\u79bb\uff09";
}

export default function DetailPanel({ selected }) {
  if (!selected) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">{"\u8be6\u60c5"}</h3>
        <p className="text-sm leading-6 text-slate-500">
          {"\u70b9\u51fb\u4efb\u610f\u523a\u6fc0\u8bcd\u5361\u7247\uff0c\u67e5\u770b\u8be5\u8bcd\u7684\u7b80\u8981\u8bbe\u8ba1\u8bf4\u660e\u3002"}
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{"\u8be6\u60c5"}</h3>
      <dl className="space-y-3 text-sm text-slate-700">
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {"\u8bcd\u6c47"}
          </dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
            {selected.word}
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {"\u7b80\u8981\u8be6\u60c5"}
          </dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 leading-6">
            {selected.detail}
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {"\u5206\u7c7b"}
          </dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            {categoryText(selected.category)}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
