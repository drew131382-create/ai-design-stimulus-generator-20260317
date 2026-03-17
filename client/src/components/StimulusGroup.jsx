function getGroupStyle(type) {
  if (type === "near") {
    return {
      tag: "bg-near-bg border-near-border text-near-text",
      card: "border-near-border hover:bg-near-bg",
      active: "bg-near-bg border-near-text text-near-text",
    };
  }

  if (type === "medium") {
    return {
      tag: "bg-medium-bg border-medium-border text-medium-text",
      card: "border-medium-border hover:bg-medium-bg",
      active: "bg-medium-bg border-medium-text text-medium-text",
    };
  }

  return {
    tag: "bg-far-bg border-far-border text-far-text",
    card: "border-far-border hover:bg-far-bg",
    active: "bg-far-bg border-far-text text-far-text",
  };
}

export default function StimulusGroup({ type, title, items, selected, onSelect }) {
  const style = getGroupStyle(type);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800">{title}</h2>
        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${style.tag}`}>
          {items.length}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const isActive = selected?.word === item.word && selected?.category === type;

          return (
            <button
              key={`${type}-${item.word}`}
              type="button"
              onClick={() => onSelect(type, item)}
              className={`rounded-md border px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 ${
                isActive ? style.active : `bg-white ${style.card}`
              }`}
            >
              <span className="block truncate font-medium">{item.word}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

