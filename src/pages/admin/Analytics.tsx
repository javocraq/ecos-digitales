import { useEffect, useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  subMonths,
  eachMonthOfInterval,
  eachDayOfInterval,
  subDays,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";

// Slack brand palette
const SLACK = {
  aubergine: "#4A154B",
  blue: "#36C5F0",
  green: "#2EB67D",
  yellow: "#ECB22E",
  red: "#E01E5A",
  // additional tones for category donut overflow
  aubergineDark: "#350D36",
  blueDark: "#1D9BD1",
  greenDark: "#1F8554",
};

const CATEGORY_COLORS = [
  SLACK.aubergine,
  SLACK.blue,
  SLACK.green,
  SLACK.yellow,
  SLACK.red,
  SLACK.aubergineDark,
  SLACK.blueDark,
  SLACK.greenDark,
];

interface ChartArticle {
  id: string;
  status: string;
  source: string | null;
  published_at: string | null;
  author_id: string | null;
  categories: { name: string } | null;
}

const PAGE_SIZE = 1000;

/** Paginate a Supabase query that may exceed the default 1000-row cap. */
async function fetchAllRows<T>(
  buildQuery: () => ReturnType<typeof supabase.from>
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  // Safety cap so we never spin forever if the schema grows unexpectedly
  for (let pages = 0; pages < 50; pages++) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error || !data) break;
    all.push(...(data as unknown as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

const Analytics = () => {
  const [chartArticles, setChartArticles] = useState<ChartArticle[]>([]);
  const [counts, setCounts] = useState({
    totalPublished: 0,
    publishedThisMonth: 0,
    publishedLastMonth: 0,
    publishedThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);

      const now = new Date();
      const monthStartIso = startOfMonth(now).toISOString();
      const lastMonthStartIso = startOfMonth(subMonths(now, 1)).toISOString();
      const sevenDaysAgoIso = subDays(now, 7).toISOString();

      // Counts via head:true count queries — return the real total without pulling rows
      const [
        totalRes,
        thisMonthRes,
        lastMonthRes,
        thisWeekRes,
        chartRows,
      ] = await Promise.all([
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .gte("published_at", monthStartIso),
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .gte("published_at", lastMonthStartIso)
          .lt("published_at", monthStartIso),
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .gte("published_at", sevenDaysAgoIso),
        // Chart rows: all published articles, projecting only the fields we need
        fetchAllRows<ChartArticle>(() =>
          supabase
            .from("articles")
            .select("id, status, source, published_at, author_id, categories(name)")
            .eq("status", "published")
            .order("published_at", { ascending: false, nullsFirst: false })
        ),
      ]);

      if (cancelled) return;

      setCounts({
        totalPublished: totalRes.count ?? 0,
        publishedThisMonth: thisMonthRes.count ?? 0,
        publishedLastMonth: lastMonthRes.count ?? 0,
        publishedThisWeek: thisWeekRes.count ?? 0,
      });
      setChartArticles(chartRows);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const { monthlyData, monthlyMode } = useMemo(() => {
    if (chartArticles.length === 0) {
      return { monthlyData: [] as Array<{ label: string; Humano: number; AI: number }>, monthlyMode: "monthly" as "monthly" | "yearly" };
    }

    const now = new Date();
    const dated = chartArticles.filter((a) => a.published_at);
    const earliest = new Date(
      Math.min(...dated.map((a) => new Date(a.published_at!).getTime()))
    );
    const monthsSpan =
      (now.getFullYear() - earliest.getFullYear()) * 12 +
      (now.getMonth() - earliest.getMonth()) +
      1;

    // > 24 months of history → aggregate by year (otherwise too many bars)
    if (monthsSpan > 24) {
      const byYear = new Map<number, { Humano: number; AI: number }>();
      for (const a of dated) {
        const year = new Date(a.published_at!).getFullYear();
        const entry = byYear.get(year) || { Humano: 0, AI: 0 };
        if (a.source === "AI") entry.AI += 1;
        else entry.Humano += 1;
        byYear.set(year, entry);
      }
      const data = Array.from(byYear.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, counts]) => ({ label: String(year), ...counts }));
      return { monthlyData: data, monthlyMode: "yearly" as const };
    }

    // Otherwise show every month from earliest publication to today
    const start = startOfMonth(earliest);
    const months = eachMonthOfInterval({ start, end: now });
    const data = months.map((monthDate) => {
      const monthEnd = startOfMonth(subMonths(monthDate, -1));
      const inMonth = dated.filter((a) => {
        const d = new Date(a.published_at!);
        return d >= monthDate && d < monthEnd;
      });
      const human = inMonth.filter((a) => a.source !== "AI").length;
      const ai = inMonth.filter((a) => a.source === "AI").length;
      return {
        label: format(monthDate, "MMM yy", { locale: es }),
        Humano: human,
        AI: ai,
      };
    });
    return { monthlyData: data, monthlyMode: "monthly" as const };
  }, [chartArticles]);

  const dailyData = useMemo(() => {
    const now = new Date();
    const start = startOfDay(subDays(now, 29));
    const days = eachDayOfInterval({ start, end: now });

    return days.map((dayDate) => {
      const dayEnd = startOfDay(subDays(dayDate, -1));
      const count = chartArticles.filter((a) => {
        if (!a.published_at) return false;
        const d = new Date(a.published_at);
        return d >= dayDate && d < dayEnd;
      }).length;
      return {
        day: format(dayDate, "d MMM", { locale: es }),
        publicadas: count,
      };
    });
  }, [chartArticles]);

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of chartArticles) {
      const name = a.categories?.name || "—";
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [chartArticles]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 sm:px-10 py-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-neutral-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Visión general del trabajo editorial ·{" "}
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <KpiCard
            label="Total publicadas"
            value={formatCompact(counts.totalPublished)}
          />
          <KpiCard
            label="Este mes"
            value={counts.publishedThisMonth}
            hint={
              counts.publishedLastMonth > 0
                ? `${
                    counts.publishedThisMonth >= counts.publishedLastMonth ? "+" : ""
                  }${(
                    ((counts.publishedThisMonth - counts.publishedLastMonth) /
                      counts.publishedLastMonth) *
                    100
                  ).toFixed(0)}% vs mes anterior`
                : undefined
            }
          />
          <KpiCard
            label="Mes anterior"
            value={counts.publishedLastMonth}
            hint={format(subMonths(new Date(), 1), "MMMM yyyy", { locale: es })}
          />
          <KpiCard
            label="Esta semana"
            value={counts.publishedThisWeek}
            hint="últimos 7 días"
          />
        </div>

        {/* Monthly publication chart */}
        <Panel
          title={monthlyMode === "yearly" ? "Notas publicadas por año" : "Notas publicadas por mes"}
          subtitle={
            monthlyMode === "yearly"
              ? "Histórico completo · desglose Humano vs AI"
              : `${monthlyData.length} meses · desglose Humano vs AI`
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#a3a3a3"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={monthlyData.length > 14 ? Math.floor(monthlyData.length / 12) : 0}
              />
              <YAxis
                stroke="#a3a3a3"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: "rgba(74,21,75,0.06)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Bar dataKey="Humano" stackId="a" fill={SLACK.aubergine} />
              <Bar dataKey="AI" stackId="a" fill={SLACK.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Two-column row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Panel title="Actividad reciente" subtitle="Notas publicadas por día · últimos 30 días">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#a3a3a3"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.ceil(dailyData.length / 8)}
                />
                <YAxis
                  stroke="#a3a3a3"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e5e5e5",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="publicadas"
                  stroke={SLACK.green}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: SLACK.green }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Distribución por categoría" subtitle="Top 8 categorías publicadas">
            {categoryData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {categoryData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e5e5e5",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: 11, paddingLeft: 12 }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      </div>
    </AdminLayout>
  );
};

const KpiCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <div className="rounded-xl border border-black/[0.06] bg-white p-4">
    <div className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
      {label}
    </div>
    <div className="mt-2 text-2xl font-bold text-neutral-900 tabular-nums">{value}</div>
    {hint && <div className="text-[11px] text-neutral-400 mt-0.5">{hint}</div>}
  </div>
);

const Panel = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-black/[0.06] bg-white p-5">
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
      {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const EmptyState = () => (
  <div className="flex items-center justify-center h-[200px] text-sm text-neutral-400">
    Sin datos para mostrar
  </div>
);

const formatCompact = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
};

export default Analytics;
