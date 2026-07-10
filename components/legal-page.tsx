import { PageHeader } from "@/components/page-header";

/** Shared layout for Terms / Privacy / Licenses screens. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: { h: string; p: string }[];
}) {
  return (
    <>
      <PageHeader title={title} />
      <div className="px-4 pb-12 pt-4">
        <p className="text-xs text-faint">Last updated {updated}</p>
        <p className="mt-2 text-muted">{intro}</p>
        <div className="mt-5 space-y-5">
          {sections.map((s, i) => (
            <section key={s.h}>
              <h2 className="font-display text-base font-bold">
                {i + 1}. {s.h}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.p}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 rounded-tile bg-surface-2 p-3 text-xs text-faint">
          This is a demo application. The text here is illustrative and does not constitute a binding
          agreement, legal advice, or a real financial product.
        </p>
      </div>
    </>
  );
}
