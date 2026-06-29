import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Clock, CheckCircle, FileCheck, Calendar } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, FunnelChart, Funnel, LabelList, Cell,
} from "recharts";
import { format, subDays, startOfDay, differenceInHours, startOfWeek } from "date-fns";

type App = {
  id: string;
  status: string;
  last_grade: string;
  created_at: string;
  updated_at: string;
  report_url: string | null;
  birth_cert_url: string | null;
  parent_id_url: string | null;
};

const InsightsPanel = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("applications")
        .select("id,status,last_grade,created_at,updated_at,report_url,birth_cert_url,parent_id_url")
        .order("created_at", { ascending: false });
      setApps((data as App[]) || []);
      setLoading(false);
    })();
  }, []);

  const kpis = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const total = apps.length;
    const today = apps.filter(a => new Date(a.created_at) >= todayStart).length;
    const thisWeek = apps.filter(a => new Date(a.created_at) >= weekStart).length;
    const pending = apps.filter(a => a.status === "pending").length;
    const approved = apps.filter(a => a.status === "approved").length;
    const decided = apps.filter(a => a.status === "approved" || a.status === "rejected");
    const approvalRate = decided.length ? Math.round((approved / decided.length) * 100) : 0;

    const responseHours = decided
      .map(a => differenceInHours(new Date(a.updated_at), new Date(a.created_at)))
      .filter(h => h >= 0);
    const avgResponse = responseHours.length
      ? Math.round(responseHours.reduce((s, h) => s + h, 0) / responseHours.length)
      : 0;

    return { total, today, thisWeek, pending, approvalRate, avgResponse };
  }, [apps]);

  const overTime = useMemo(() => {
    const days = 30;
    const buckets: { date: string; label: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      buckets.push({ date: d.toISOString(), label: format(d, "MMM d"), count: 0 });
    }
    apps.forEach(a => {
      const d = startOfDay(new Date(a.created_at)).toISOString();
      const b = buckets.find(x => x.date === d);
      if (b) b.count++;
    });
    return buckets;
  }, [apps]);

  const byGrade = useMemo(() => {
    const map: Record<string, number> = {};
    apps.forEach(a => {
      const g = a.last_grade || "Unknown";
      map[g] = (map[g] || 0) + 1;
    });
    return Object.entries(map)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => a.grade.localeCompare(b.grade));
  }, [apps]);

  const funnel = useMemo(() => {
    const submitted = apps.length;
    const reviewed = apps.filter(a => a.status !== "pending").length;
    const approved = apps.filter(a => a.status === "approved").length;
    return [
      { name: "Submitted", value: submitted, fill: "hsl(var(--primary))" },
      { name: "Reviewed", value: reviewed, fill: "hsl(var(--primary) / 0.7)" },
      { name: "Approved", value: approved, fill: "hsl(var(--primary) / 0.4)" },
    ];
  }, [apps]);

  if (loading) {
    return <p className="text-muted-foreground text-center py-12">Loading insights...</p>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Users} label="Total" value={kpis.total} />
        <KpiCard icon={Calendar} label="Today" value={kpis.today} />
        <KpiCard icon={TrendingUp} label="This Week" value={kpis.thisWeek} />
        <KpiCard icon={Clock} label="Pending Review" value={kpis.pending} accent="primary" />
        <KpiCard icon={CheckCircle} label="Approval Rate" value={`${kpis.approvalRate}%`} accent="success" />
        <KpiCard icon={FileCheck} label="Avg Response" value={`${kpis.avgResponse}h`} />
      </div>

      {/* Applications over time */}
      <ChartCard title="Applications — Last 30 Days">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={overTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={Math.floor(overTime.length / 8)} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By grade */}
        <ChartCard title="Applications by Grade">
          {byGrade.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byGrade}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="grade" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Funnel */}
        <ChartCard title="Conversion Funnel">
          {funnel[0].value === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <FunnelChart>
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Funnel dataKey="value" data={funnel} isAnimationActive>
                  <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="name" fontSize={12} />
                  <LabelList position="center" fill="hsl(var(--primary-foreground))" stroke="none" dataKey="value" fontSize={14} />
                  {funnel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

const KpiCard = ({
  icon: Icon, label, value, accent,
}: { icon: any; label: string; value: string | number; accent?: "primary" | "success" }) => {
  const accentClass =
    accent === "primary" ? "text-primary" :
    accent === "success" ? "text-green-600" :
    "text-foreground";
  return (
    <div className="bg-muted border border-border p-4 card-elevated">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-4 w-4 ${accentClass}`} />
      </div>
      <p className={`text-2xl font-bold ${accentClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-background border border-border p-4 card-elevated">
    <h3 className="font-heading text-sm font-bold text-foreground mb-4">{title}</h3>
    {children}
  </div>
);

const EmptyChart = () => (
  <div className="h-[260px] flex items-center justify-center">
    <p className="text-sm text-muted-foreground">Not enough data yet.</p>
  </div>
);

export default InsightsPanel;
