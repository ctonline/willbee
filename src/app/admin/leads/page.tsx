import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads", robots: { index: false, follow: false } };

const STATUS_STYLES: Record<string, string> = {
  active: "bg-accent text-accent-foreground",
  completed: "bg-muted text-muted-foreground",
  unsubscribed: "bg-destructive/10 text-destructive",
  converted: "bg-success/15 text-success",
};

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function LeadsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const secret = process.env.CRON_SECRET;
  const authed = !!secret && key === secret;

  if (!authed) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Leads dashboard</h1>
          <p className="mt-3 text-muted-foreground">
            This page is private. Append <code className="rounded bg-muted px-1">?key=…</code> with
            your dashboard key to view it.
          </p>
        </main>
      </>
    );
  }

  const [total, byStatus, leads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        email: true,
        name: true,
        source: true,
        stage: true,
        status: true,
        createdAt: true,
        nextEmailAt: true,
      },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const row of byStatus) counts[row.status] = row._count._all;

  const summary = [
    { label: "Total", value: total },
    { label: "Active", value: counts.active ?? 0 },
    { label: "Completed", value: counts.completed ?? 0 },
    { label: "Converted", value: counts.converted ?? 0 },
    { label: "Unsubscribed", value: counts.unsubscribed ?? 0 },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="font-serif text-3xl font-medium tracking-tight">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meta lead-ad captures and their position in the 3-stage sequence.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-5">
          {summary.map((s) => (
            <div key={s.label} className="bg-card p-4">
              <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto rounded-sm border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Captured</th>
                <th className="px-4 py-2.5 font-medium">Next email</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No leads yet.
                  </td>
                </tr>
              )}
              {leads.map((l) => (
                <tr key={l.email} className="border-t border-border">
                  <td className="px-4 py-2.5 font-medium">{l.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.name || "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums">{l.stage}/3</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[l.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{fmt(l.createdAt)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{fmt(l.nextEmailAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Showing up to 200 most recent. Times in your browser locale.
        </p>
      </main>
    </>
  );
}
