function categoryText(category) {
  if (category === "near") return "Near Stimuli（近距离）";
  if (category === "medium") return "Medium Stimuli（中距离）";
  return "Far Stimuli（远距离）";
}

export default function DetailPanel({ selected }) {
  if (!selected) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">详情</h3>
        <p className="text-sm leading-6 text-slate-500">点击任意刺激词卡片查看更详细的启发说明与落地方向。</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">详情</h3>
      <dl className="space-y-3 text-sm text-slate-700">
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">词语</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-medium">{selected.word}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">启发来源</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 leading-6">{selected.inspiration}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">设计方向</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 leading-6">{selected.direction}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">应用建议</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 leading-6">{selected.application}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">设计提醒</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 leading-6">{selected.risk}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">分类</dt>
          <dd className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">{categoryText(selected.category)}</dd>
        </div>
      </dl>
    </aside>
  );
}