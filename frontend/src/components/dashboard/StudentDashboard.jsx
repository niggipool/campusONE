import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MessageSquareWarning,
  Ticket,
  Circle,
  LoaderCircle,
  Clock3,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api } from "../../services/api";

const STATUS_CONFIG = {
  open: {
    label: "Open",
    className:
      "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
  },
  in_progress: {
    label: "In progress",
    className:
      "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
  },
  pending: {
    label: "Waiting for response",
    className:
      "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400",
  },
  resolved: {
    label: "Resolved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  closed: {
    label: "Closed",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400",
  },
};

const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400",
  },
  medium: {
    label: "Medium",
    className:
      "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
  },
  high: {
    label: "High",
    className:
      "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400",
  },
  urgent: {
    label: "Urgent",
    className:
      "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
  },
};

function formatDate(date) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getSlaLabel(ticket) {
  const sla = ticket?.sla;

  if (!sla) {
    return {
      label: "—",
      detail: "",
      className:
        "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500",
    };
  }

  if (sla.status === "breached") {
    return {
      label: "SLA breached",
      detail:
        sla.hours_remaining != null
          ? `Overdue by ${Math.abs(Math.round(sla.hours_remaining))}h`
          : "Overdue",
      className:
        "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
    };
  }

  if (sla.status === "at_risk") {
    return {
      label: "Approaching SLA",
      detail:
        sla.hours_remaining != null
          ? `${Math.round(sla.hours_remaining)}h left`
          : "Due soon",
      className:
        "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
    };
  }

  return {
    label: "Within SLA",
    detail:
      sla.hours_remaining != null
        ? `${Math.round(sla.hours_remaining)}h left`
        : "",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  };
}

function SummaryCard({ label, value, icon: Icon, iconClassName }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        rounded-xl border border-zinc-200
        bg-white p-5 shadow-sm
        dark:border-white/[0.07]
        dark:bg-[#101010]
        dark:shadow-none
      "
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500">
          {label}
        </p>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
        {value}
      </p>
    </motion.div>
  );
}

export default function StudentDashboard({ user }) {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
    try {
      setError("");

      const data = await api.get("/api/tickets");

      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Student dashboard error:", err);
      setError(err?.message || "Failed to load your tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const stats = useMemo(() => {
    return {
      total: tickets.length,

      open: tickets.filter((ticket) => ticket.status === "open").length,

      inProgress: tickets.filter((ticket) => ticket.status === "in_progress")
        .length,

      waiting: tickets.filter((ticket) => ticket.status === "pending").length,

      resolved: tickets.filter(
        (ticket) => ticket.status === "resolved" || ticket.status === "closed",
      ).length,
    };
  }, [tickets]);

  const responseTicket = useMemo(() => {
    return tickets.find((ticket) => ticket.status === "pending");
  }, [tickets]);

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [tickets]);

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Hi, {user?.name || "there"}
          </h1>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
            Here’s where your support requests stand.
          </p>
        </div>

        <button
          onClick={() => navigate("/tickets/new")}
          className="
            inline-flex w-fit items-center gap-2
            rounded-lg bg-red-600 px-4 py-2.5
            text-sm font-semibold text-white
            shadow-sm transition
            hover:bg-red-700
            active:scale-[0.98]
          "
        >
          <Plus size={17} />
          New ticket
        </button>
      </div>

      {/* Response alert */}
      {responseTicket && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            mt-7 flex flex-col gap-4
            rounded-xl border border-orange-200
            bg-orange-50/70 px-5 py-4
            sm:flex-row sm:items-center sm:justify-between
            dark:border-orange-500/20
            dark:bg-orange-500/[0.06]
          "
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-orange-600 dark:text-orange-400">
              <MessageSquareWarning size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                1 ticket needs your response
              </p>

              <p className="mt-1 text-xs text-orange-700/80 dark:text-orange-400/70">
                Staff asked for more information before they can continue.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/tickets/${responseTicket.id}`)}
            className="
              inline-flex w-fit items-center gap-2
              rounded-lg bg-orange-600 px-4 py-2.5
              text-xs font-semibold text-white
              transition hover:bg-orange-700
            "
          >
            Respond now
            <ArrowRight size={14} />
          </button>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="My tickets"
          value={loading ? "—" : stats.total}
          icon={Ticket}
          iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
        />

        <SummaryCard
          label="Open"
          value={loading ? "—" : stats.open}
          icon={Circle}
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
        />

        <SummaryCard
          label="In progress"
          value={loading ? "—" : stats.inProgress}
          icon={LoaderCircle}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
        />

        <SummaryCard
          label="Waiting for response"
          value={loading ? "—" : stats.waiting}
          icon={Clock3}
          iconClassName="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
        />

        <SummaryCard
          label="Resolved"
          value={loading ? "—" : stats.resolved}
          icon={CheckCircle2}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
        />
      </div>

      {/* Recent tickets */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Recent tickets
          </h2>

          <button
            onClick={() => navigate("/tickets")}
            className="text-xs font-medium text-red-600 transition hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
          >
            View all
          </button>
        </div>

        <div
          className="
            overflow-hidden rounded-xl
            border border-zinc-200
            bg-white shadow-sm
            dark:border-white/[0.07]
            dark:bg-[#101010]
            dark:shadow-none
          "
        >
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <LoaderCircle size={22} className="animate-spin text-red-600" />
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Ticket size={28} className="text-zinc-300 dark:text-zinc-700" />

              <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No tickets yet
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Create your first support ticket to get started.
              </p>

              <button
                onClick={() => navigate("/tickets/new")}
                className="mt-4 text-xs font-semibold text-red-600 dark:text-red-500"
              >
                Create ticket
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-white/[0.07]">
                      {[
                        "Ticket",
                        "Subject",
                        "Category",
                        "Priority",
                        "Status",
                        "Created",
                        "SLA",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="
                            whitespace-nowrap px-4 py-3
                            text-left text-[10px]
                            font-semibold uppercase
                            tracking-wider
                            text-zinc-500
                            dark:text-zinc-600
                          "
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {recentTickets.map((ticket) => {
                      const status =
                        STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;

                      const priority =
                        PRIORITY_CONFIG[ticket.priority] ||
                        PRIORITY_CONFIG.medium;

                      const sla = getSlaLabel(ticket);

                      return (
                        <tr
                          key={ticket.id}
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="
                            cursor-pointer
                            border-b border-zinc-100
                            transition hover:bg-zinc-50
                            last:border-b-0
                            dark:border-white/[0.05]
                            dark:hover:bg-white/[0.025]
                          "
                        >
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className="text-xs font-semibold text-red-600 dark:text-red-500">
                              {ticket.ticket_number}
                            </span>
                          </td>

                          <td className="max-w-[280px] px-4 py-4">
                            <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                              {ticket.title}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-xs text-zinc-500">
                            {ticket.category || "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${priority.className}`}
                            >
                              {priority.label}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-xs text-zinc-500">
                            {formatDate(ticket.created_at)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${sla.className}`}
                              >
                                {sla.label}
                              </span>

                              {sla.detail && (
                                <span className="text-[10px] text-zinc-500">
                                  {sla.detail}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-zinc-100 md:hidden dark:divide-white/[0.05]">
                {recentTickets.map((ticket) => {
                  const status =
                    STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;

                  const priority =
                    PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;

                  const sla = getSlaLabel(ticket);

                  return (
                    <button
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="
                        block w-full p-4 text-left
                        transition hover:bg-zinc-50
                        dark:hover:bg-white/[0.025]
                      "
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-500">
                            {ticket.ticket_number}
                          </p>

                          <p className="mt-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {ticket.title}
                          </p>
                        </div>

                        <ArrowRight
                          size={16}
                          className="mt-1 shrink-0 text-zinc-400"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${priority.className}`}
                        >
                          {priority.label}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${sla.className}`}
                        >
                          {sla.label}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{ticket.category || "No category"}</span>
                        <span>{formatDate(ticket.created_at)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
