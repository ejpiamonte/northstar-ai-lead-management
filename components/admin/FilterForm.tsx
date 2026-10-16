'use client';

export type FilterSelect = { name: string; label: string; value: string; options: { value: string; label: string }[] };

const field =
  'rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-[#F2B544]';

/** GET form so filters live in the URL. Selects apply on change; search applies on Enter. */
export default function FilterForm({
  action,
  query,
  selects,
}: {
  action: string;
  query: string;
  selects: FilterSelect[];
}) {
  return (
    <form action={action} method="get" role="search" className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Search name, company, email…"
        aria-label="Search leads"
        className={`${field} min-w-0 flex-1 sm:max-w-xs`}
      />
      {selects.map((s) => (
        <select
          key={s.name}
          name={s.name}
          defaultValue={s.value}
          aria-label={s.label}
          className={field}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      <button
        type="submit"
        className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-[#13305a] focus-visible:ring-2 focus-visible:ring-[#F2B544]"
      >
        Search
      </button>
    </form>
  );
}
