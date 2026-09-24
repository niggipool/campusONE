import { useEffect, useMemo, useState } from "react";
import StudentDashboard from "../components/dashboard/StudentDashboard";
import {
  getDashboardCache,
  setDashboardCache,
} from "../services/dashboardCache";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../services/api";
import { useAuth } from "../context/useAuth";

/* ---------------------------------- */
/* Helpers                            */
/* ---------------------------------- */

const formatLabel = (value) => {
  if (!value) return "Unknown";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

/* ---------------------------------- */
/* Animation                          */
/* ---------------------------------- */

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

/* ---------------------------------- */
/* Chart Tooltip                      */
/* ---------------------------------- */

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className="
        rounded-xl
        border border-zinc-200
        bg-white
        px-3 py-2
        shadow-lg
        dark:border-white/[0.08]
        dark:bg-[#181818]
      "
    >
      {label && (
        <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {formatLabel(label)}
        </p>
      )}

      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
        >
          {formatLabel(entry.dataKey)}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/* ---------------------------------- */
/* Dashboard Card                     */
/* ---------------------------------- */

function DashboardCard({ title, subtitle, children }) {
  return (
    <motion.section
      variants={itemVariants}
      className="
        overflow-hidden
        rounded-2xl
        border border-zinc-200
        bg-white
        shadow-sm
        transition-colors duration-300
        dark:border-white/[0.07]
        dark:bg-[#101010]
        dark:shadow-none
      "
    >
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-600">
            {subtitle}
          </p>
        )}
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </motion.section>
  );
}

/* ---------------------------------- */
/* Metric Card                        */
/* ---------------------------------- */

function MetricCard({ title, value, subtitle, icon: Icon, iconStyle }) {
  return (
    <motion.div
      variants={itemVariants}
      className="
        rounded-2xl
        border border-zinc-200
        bg-white
        p-5
        shadow-sm
        transition-colors duration-300
        dark:border-white/[0.07]
        dark:bg-[#101010]
        dark:shadow-none
      "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-600">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {value ?? 0}
          </p>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------------------------- */
/* Empty State                        */
/* ---------------------------------- */

function EmptyState({ message = "No data available." }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center">
      <p className="text-xs text-zinc-500 dark:text-zinc-600">{message}</p>
    </div>
  );
}

/* ---------------------------------- */
/* Dashboard                          */
/* ---------------------------------- */

export default function Dashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState({
    summary: null,
    priority: [],
    status: [],
    category: [],
    sla: [],
    workload: [],
    trends: [],
    resolution: null,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* -------------------------------- */
  /* Fetch Dashboard                  */
  /* -------------------------------- */

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      setError("");

      // 1. Load the summary FIRST
      const summary = await api.get("/api/dashboard/summary");

      setDashboard((current) => ({
        ...current,
        summary: summary || {},
      }));

      setLoading(false);

      // 2. Load the heavier analytics AFTER the summary is visible
      const [priority, status, category, sla, workload, trends, resolution] =
        await Promise.all([
          api.get("/api/dashboard/by-priority"),
          api.get("/api/dashboard/by-status"),
          api.get("/api/dashboard/by-category"),
          api.get("/api/dashboard/sla"),
          api.get("/api/dashboard/staff-workload"),
          api.get("/api/dashboard/trends"),
          api.get("/api/dashboard/resolution"),
        ]);

      const dashboardData = {
        summary: summary || {},
        priority: Array.isArray(priority) ? priority : [],
        status: Array.isArray(status) ? status : [],
        category: Array.isArray(category) ? category : [],
        sla: Array.isArray(sla) ? sla : [],
        workload: Array.isArray(workload) ? workload : [],
        trends: Array.isArray(trends) ? trends : [],
        resolution: resolution || {},
      };

      setDashboard(dashboardData);
      setDashboardCache(dashboardData);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === "student") {
      setLoading(false);
      return;
    }

    const cached = getDashboardCache();

    if (cached) {
      setDashboard(cached.data);
      setLoading(false);
      return;
    }

    fetchDashboard();
  }, [user?.role]);
  /* -------------------------------- */
  /* Chart Data                       */
  /* -------------------------------- */

  const statusData = useMemo(() => {
    return dashboard.status.map((item) => ({
      status: item.status,
      count: Number(item.count || 0),
    }));
  }, [dashboard.status]);

  const categoryData = useMemo(() => {
    return dashboard.category.map((item) => ({
      category: item.category,
      count: Number(item.count || 0),
    }));
  }, [dashboard.category]);

  const priorityData = useMemo(() => {
    const priorityOrder = ["low", "medium", "high", "critical"];

    return [...dashboard.priority].sort((a, b) => {
      return (
        priorityOrder.indexOf(String(a.priority).toLowerCase()) -
        priorityOrder.indexOf(String(b.priority).toLowerCase())
      );
    });
  }, [dashboard.priority]);

  const workloadData = useMemo(() => {
    return dashboard.workload.map((staff) => {
      const active = Number(staff.active || 0);

      /*
       * If the backend already returns sla_breached,
       * use it. Otherwise default to 0.
       */
      const slaBreached = Number(staff.sla_breached || 0);

      return {
        ...staff,
        active: Math.max(active - slaBreached, 0),
        sla_breached: slaBreached,
      };
    });
  }, [dashboard.workload]);

  /* -------------------------------- */
  /* Colors                           */
  /* -------------------------------- */

  const statusColors = [
    "#587ff0",
    "#8756e8",
    "#eda51b",
    "#eb7424",
    "#51b77f",
    "#94a3b8",
  ];

  const priorityColors = {
    low: "#94a3b8",
    medium: "#587ff0",
    high: "#ed7625",
    critical: "#df454b",
  };

  if (user?.role === "student") {
    return <StudentDashboard user={user} />;
  }

  /* -------------------------------- */
  /* Loading                          */
  /* -------------------------------- */

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-7">
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-white/[0.06]" />

          <div className="mt-3 h-9 w-48 animate-pulse rounded bg-zinc-200 dark:bg-white/[0.06]" />

          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200 dark:bg-white/[0.06]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="
                h-32
                animate-pulse
                rounded-2xl
                bg-zinc-200
                dark:bg-white/[0.05]
              "
            />
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="
                h-[350px]
                animate-pulse
                rounded-2xl
                bg-zinc-200
                dark:bg-white/[0.05]
              "
            />
          ))}
        </div>
      </div>
    );
  }

  /* -------------------------------- */
  /* Error                            */
  /* -------------------------------- */

  if (error) {
    return (
      <div className="mx-auto max-w-[900px] pt-10">
        <div
          className="
            rounded-2xl
            border border-red-200
            bg-red-50
            p-6
            dark:border-red-900/40
            dark:bg-red-950/20
          "
        >
          <div className="flex items-start gap-4">
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl
                bg-red-100
                text-red-600
                dark:bg-red-950/40
                dark:text-red-500
              "
            >
              <AlertTriangle size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-red-800 dark:text-red-400">
                Dashboard unavailable
              </h2>

              <p className="mt-1 text-sm text-red-700/80 dark:text-red-400/70">
                {error}
              </p>

              <button
                onClick={() => fetchDashboard()}
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-red-600
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-red-700
                "
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === "student") {
    return <StudentDashboard user={user} />;
  }

  /* -------------------------------- */
  /* Main Dashboard                   */
  /* -------------------------------- */

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-[1600px]"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="
          mb-7
          flex flex-col gap-4
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600 dark:text-red-700">
            Overview
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-600">
            Welcome back, {user?.name || "User"}. Here's what's happening across
            CampusONE.
          </p>
        </div>

        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border border-zinc-200
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-zinc-700
            shadow-sm
            transition
            hover:bg-zinc-50
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-white/[0.07]
            dark:bg-white/[0.03]
            dark:text-zinc-300
            dark:hover:bg-white/[0.06]
            dark:shadow-none
          "
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* -------------------------------- */}
      {/* Summary Cards                    */}
      {/* -------------------------------- */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Tickets"
          value={dashboard.summary?.total}
          subtitle="All submitted tickets"
          icon={Ticket}
          iconStyle="
            bg-red-50
            text-red-600
            dark:bg-red-950/30
            dark:text-red-500
          "
        />

        <MetricCard
          title="Open"
          value={dashboard.summary?.open}
          subtitle="Awaiting action"
          icon={Clock3}
          iconStyle="
            bg-orange-50
            text-orange-600
            dark:bg-orange-950/30
            dark:text-orange-500
          "
        />

        <MetricCard
          title="In Progress"
          value={dashboard.summary?.in_progress}
          subtitle="Currently being handled"
          icon={RefreshCw}
          iconStyle="
            bg-blue-50
            text-blue-600
            dark:bg-blue-950/30
            dark:text-blue-500
          "
        />

        <MetricCard
          title="Resolved"
          value={dashboard.summary?.resolved}
          subtitle="Successfully resolved"
          icon={CheckCircle2}
          iconStyle="
            bg-emerald-50
            text-emerald-600
            dark:bg-emerald-950/30
            dark:text-emerald-500
          "
        />
      </div>

      {/* -------------------------------- */}
      {/* Alerts                           */}
      {/* -------------------------------- */}

      {(dashboard.summary?.overdue > 0 || dashboard.summary?.at_risk > 0) && (
        <motion.div
          variants={itemVariants}
          className="mt-6 grid gap-4 sm:grid-cols-2"
        >
          {dashboard.summary?.overdue > 0 && (
            <div
              className="
                flex items-center gap-4
                rounded-2xl
                border border-red-200
                bg-red-50
                p-4
                dark:border-red-900/40
                dark:bg-red-950/20
              "
            >
              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-red-100
                  text-red-600
                  dark:bg-red-950/40
                  dark:text-red-500
                "
              >
                <XCircle size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-400">
                  {dashboard.summary.overdue} overdue ticket
                  {dashboard.summary.overdue !== 1 ? "s" : ""}
                </p>

                <p className="mt-0.5 text-xs text-red-700/70 dark:text-red-400/60">
                  These tickets have exceeded their SLA.
                </p>
              </div>
            </div>
          )}

          {dashboard.summary?.at_risk > 0 && (
            <div
              className="
                flex items-center gap-4
                rounded-2xl
                border border-orange-200
                bg-orange-50
                p-4
                dark:border-orange-900/40
                dark:bg-orange-950/20
              "
            >
              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-orange-100
                  text-orange-600
                  dark:bg-orange-950/40
                  dark:text-orange-500
                "
              >
                <AlertTriangle size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-400">
                  {dashboard.summary.at_risk} ticket
                  {dashboard.summary.at_risk !== 1 ? "s" : ""} at risk
                </p>

                <p className="mt-0.5 text-xs text-orange-700/70 dark:text-orange-400/60">
                  These tickets are approaching their SLA limit.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ================================== */}
      {/* FIRST ROW                          */}
      {/* ================================== */}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* -------------------------------- */}
        {/* Tickets by Status                */}
        {/* -------------------------------- */}

        <DashboardCard title="Tickets by status">
          <div className="h-[300px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-zinc-200 dark:stroke-white/[0.06]"
                  />

                  <XAxis
                    dataKey="status"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatLabel}
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar dataKey="count" radius={[5, 5, 0, 0]} barSize={48}>
                    {statusData.map((entry, index) => (
                      <Cell
                        key={entry.status}
                        fill={statusColors[index % statusColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No status data available." />
            )}
          </div>
        </DashboardCard>

        {/* -------------------------------- */}
        {/* Tickets by Category              */}
        {/* -------------------------------- */}

        <DashboardCard title="Tickets by category">
          <div className="h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 10,
                    left: 60,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    className="stroke-zinc-200 dark:stroke-white/[0.06]"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                  />

                  <YAxis
                    type="category"
                    dataKey="category"
                    width={90}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatLabel}
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={20}>
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={
                          [
                            "#6366e8", // Indigo
                            "#3b82f6", // Blue
                            "#8b5cf6", // Violet
                            "#f59e0b", // Amber
                            "#10b981", // Emerald
                            "#f97316", // Orange
                            "#ec4899", // Pink
                            "#64748b", // Slate
                          ][index % 8]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No category data available." />
            )}
          </div>
        </DashboardCard>
      </div>

      {/* ================================== */}
      {/* SECOND ROW                         */}
      {/* ================================== */}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* -------------------------------- */}
        {/* Tickets by Priority              */}
        {/* -------------------------------- */}

        <DashboardCard title="Tickets by priority">
          <div className="h-[300px]">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="count"
                    nameKey="priority"
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {priorityData.map((entry) => {
                      const priority = String(
                        entry.priority || "",
                      ).toLowerCase();

                      return (
                        <Cell
                          key={entry.priority}
                          fill={priorityColors[priority] || "#94a3b8"}
                        />
                      );
                    })}
                  </Pie>

                  <Tooltip content={<CustomTooltip />} />

                  <Legend
                    verticalAlign="bottom"
                    height={30}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatLabel(value)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No priority data available." />
            )}
          </div>
        </DashboardCard>

        {/* -------------------------------- */}
        {/* Staff Workload                   */}
        {/* -------------------------------- */}

        <DashboardCard
          title="Staff workload"
          subtitle="Active tickets per staff member"
        >
          <div className="h-[300px]">
            {workloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workloadData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-zinc-200 dark:stroke-white/[0.06]"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Legend
                    verticalAlign="bottom"
                    height={30}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {value === "active" ? "On track" : "SLA breached"}
                      </span>
                    )}
                  />

                  <Bar
                    dataKey="active"
                    stackId="workload"
                    fill="#6366e8"
                    barSize={55}
                  />

                  <Bar
                    dataKey="sla_breached"
                    stackId="workload"
                    fill="#df454b"
                    radius={[5, 5, 0, 0]}
                    barSize={55}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No staff workload data available." />
            )}
          </div>
        </DashboardCard>
      </div>

      {/* ================================== */}
      {/* LOWER INFORMATION                  */}
      {/* ================================== */}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* -------------------------------- */}
        {/* SLA Overview                     */}
        {/* -------------------------------- */}

        <DashboardCard
          title="SLA overview"
          subtitle="Active tickets requiring attention"
        >
          {dashboard.sla.length > 0 ? (
            <div className="space-y-3">
              {dashboard.sla.slice(0, 6).map((ticket) => {
                const status = String(ticket.sla_status || "").toLowerCase();

                const overdue = status === "overdue";

                const atRisk = status === "at_risk" || status === "warning";

                return (
                  <div
                    key={ticket.id}
                    className="
                      rounded-xl
                      border border-zinc-100
                      bg-zinc-50
                      p-4
                      dark:border-white/[0.05]
                      dark:bg-white/[0.025]
                    "
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {ticket.ticket_number || "Ticket"}{" "}
                          <span className="text-zinc-400">·</span>{" "}
                          {ticket.title || "Untitled ticket"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-md bg-zinc-200 px-2 py-1 text-[10px] text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-400">
                            {formatLabel(ticket.status)}
                          </span>

                          <span className="rounded-md bg-zinc-200 px-2 py-1 text-[10px] text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-400">
                            {formatLabel(ticket.priority)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`
                          shrink-0
                          rounded-md
                          px-2
                          py-1
                          text-[10px]
                          font-semibold
                          uppercase
                          ${
                            overdue
                              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                              : atRisk
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          }
                        `}
                      >
                        {formatLabel(ticket.sla_status)}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-600">
                      <span>
                        Age: {Number(ticket.age_hours || 0).toFixed(1)}h
                      </span>

                      <span>
                        {overdue
                          ? `${Math.abs(
                              Number(ticket.hours_remaining || 0),
                            ).toFixed(1)}h overdue`
                          : `${Number(ticket.hours_remaining || 0).toFixed(
                              1,
                            )}h remaining`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No active SLA tickets." />
          )}
        </DashboardCard>

        {/* -------------------------------- */}
        {/* Resolution                       */}
        {/* -------------------------------- */}

        <DashboardCard
          title="Resolution performance"
          subtitle="Current ticket resolution metrics"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="
                rounded-xl
                border border-zinc-100
                bg-zinc-50
                p-5
                dark:border-white/[0.05]
                dark:bg-white/[0.025]
              "
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-600">
                Resolved tickets
              </p>

              <p className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {dashboard.resolution?.resolved_count ?? 0}
              </p>

              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-500">
                <CheckCircle2 size={14} />
                Successfully resolved
              </div>
            </div>

            <div
              className="
                rounded-xl
                border border-zinc-100
                bg-zinc-50
                p-5
                dark:border-white/[0.05]
                dark:bg-white/[0.025]
              "
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-600">
                Avg. resolution time
              </p>

              <div className="mt-3 flex items-end gap-2">
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {Number(
                    dashboard.resolution?.average_resolution_hours || 0,
                  ).toFixed(1)}
                </p>

                <span className="mb-1 text-xs text-zinc-500 dark:text-zinc-600">
                  hours
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-600">
                <Clock3 size={14} />
                Average completion time
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* -------------------------------- */}
      {/* Footer summary                   */}
      {/* -------------------------------- */}

      <motion.div
        variants={itemVariants}
        className="
          mt-6
          flex flex-wrap
          items-center
          justify-between
          gap-3
          rounded-2xl
          border border-zinc-200
          bg-white
          px-5
          py-4
          dark:border-white/[0.07]
          dark:bg-[#101010]
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-xl
              bg-red-50
              text-red-600
              dark:bg-red-950/30
              dark:text-red-500
            "
          >
            <Users size={17} />
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
              CampusONE Support Workspace
            </p>

            <p className="text-[10px] text-zinc-500 dark:text-zinc-600">
              Real-time operational overview
            </p>
          </div>
        </div>

        <p className="text-[10px] text-zinc-400 dark:text-zinc-700">
          Dashboard data is synced with the backend
        </p>
      </motion.div>
    </motion.div>
  );
}
