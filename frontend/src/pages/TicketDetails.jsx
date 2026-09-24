import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MessageSquare,
  Send,
  ShieldAlert,
  User,
  UserRound,
  UserRoundCog,
  AlertCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";

import { api } from "../services/api";
import { useAuth } from "../context/useAuth";

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

const statusConfig = {
  open: {
    label: "Open",
    className:
      "bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/20 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  pending: {
    label: "Pending",
    className:
      "bg-orange-500/10 text-orange-600 ring-1 ring-inset ring-orange-500/20 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    className:
      "bg-zinc-500/10 text-zinc-600 ring-1 ring-inset ring-zinc-500/20 dark:text-zinc-400",
    dot: "bg-zinc-500",
  },
};

const priorityConfig = {
  low: {
    label: "Low",
    className:
      "bg-zinc-500/10 text-zinc-600 ring-1 ring-inset ring-zinc-500/20 dark:text-zinc-400",
  },
  medium: {
    label: "Medium",
    className:
      "bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400",
  },
  high: {
    label: "High",
    className:
      "bg-orange-500/10 text-orange-600 ring-1 ring-inset ring-orange-500/20 dark:text-orange-400",
  },
  urgent: {
    label: "Urgent",
    className:
      "bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/20 dark:text-red-400",
  },
};

const formatStatus = (status) =>
  status?.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ---------------------------------------------------------
// BADGES
// ---------------------------------------------------------

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.open;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------
// SKELETON
// ---------------------------------------------------------

function TicketSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6">
      <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-white/10" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="h-52 rounded-2xl bg-zinc-200 dark:bg-white/10" />
          <div className="h-72 rounded-2xl bg-zinc-200 dark:bg-white/10" />
        </div>

        <div className="h-96 rounded-2xl bg-zinc-200 dark:bg-white/10" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// ERROR
// ---------------------------------------------------------

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <AlertCircle size={28} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-zinc-900 dark:text-white">
          Unable to load ticket
        </h2>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {message || "Something went wrong while loading this ticket."}
        </p>

        <button
          onClick={onRetry}
          className="
            mt-6
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-red-700
            px-4
            py-2.5
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-red-600
          "
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------

export default function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");

  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [internalNote, setInternalNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  const isStaff = user?.role === "staff" || user?.role === "admin";

  const isAdmin = user?.role === "admin";

  // -------------------------------------------------------
  // FETCH TICKET
  // -------------------------------------------------------

  const fetchTicket = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.get(`/api/tickets/${ticketId}`);

      setTicket(data);
      setSelectedStatus(data.status);
      setSelectedPriority(data.priority);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Ticket could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // FETCH ACTIVITY
  // -------------------------------------------------------

  const fetchActivity = async () => {
    setActivityLoading(true);

    try {
      const data = await api.get(`/api/tickets/${ticketId}/activity`);

      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Activity error:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (!ticketId) return;

    fetchTicket();
    fetchActivity();
  }, [ticketId]);

  // -------------------------------------------------------
  // REFRESH
  // -------------------------------------------------------

  const refreshTicket = async () => {
    await Promise.all([fetchTicket(), fetchActivity()]);
  };

  // -------------------------------------------------------
  // REPLY
  // -------------------------------------------------------

  const handleReply = async (event) => {
    event.preventDefault();

    const content = reply.trim();

    if (!content || sendingReply) return;

    setSendingReply(true);

    try {
      await api.post(`/api/tickets/${ticketId}/replies`, {
        content,
      });

      setReply("");

      await Promise.all([fetchTicket(), fetchActivity()]);
    } catch (err) {
      console.error(err);

      alert(err?.response?.data?.detail || "Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  // -------------------------------------------------------
  // INTERNAL NOTE
  // -------------------------------------------------------

  const handleInternalNote = async (event) => {
    event.preventDefault();

    const content = internalNote.trim();

    if (!content || sendingNote) return;

    setSendingNote(true);

    try {
      await api.post(`/api/tickets/${ticketId}/notes`, {
        content,
      });

      setInternalNote("");

      await fetchActivity();
    } catch (err) {
      console.error(err);

      alert(err?.response?.data?.detail || "Failed to add internal note.");
    } finally {
      setSendingNote(false);
    }
  };

  // -------------------------------------------------------
  // UPDATE TICKET
  // -------------------------------------------------------

  const handleUpdate = async (field, value) => {
    if (!isStaff || !ticket || updating) return;

    setUpdating(true);

    try {
      const payload = {
        [field]: value,
      };

      const updated = await api.patch(`/api/tickets/${ticketId}`, payload);

      setTicket((current) => ({
        ...current,
        ...updated,
      }));

      if (field === "status") {
        setSelectedStatus(value);
      }

      if (field === "priority") {
        setSelectedPriority(value);
      }

      await fetchActivity();
    } catch (err) {
      console.error(err);

      console.error("Status update error:", err);
      console.error("Status update response:", err?.message);

      setError(err?.message || "Failed to update status.");

      // Restore the current ticket value
      if (field === "status") {
        setSelectedStatus(ticket.status);
      }

      if (field === "priority") {
        setSelectedPriority(ticket.priority);
      }
    } finally {
      setUpdating(false);
    }
  };

  // -------------------------------------------------------
  // DELETE
  // -------------------------------------------------------

  const handleDelete = async () => {
    if (!isAdmin || deleting) return;

    const confirmed = window.confirm(
      `Delete ${ticket?.ticket_number}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await api.delete(`/api/tickets/${ticketId}`);

      navigate("/tickets", {
        replace: true,
      });
    } catch (err) {
      console.error(err);

      alert(err?.response?.data?.detail || "Failed to delete ticket.");
    } finally {
      setDeleting(false);
    }
  };

  // -------------------------------------------------------
  // DERIVED DATA
  // -------------------------------------------------------

  const sla = ticket?.sla;

  const slaInfo = useMemo(() => {
    const status = sla?.status;

    if (status === "breached" || status === "overdue" || status === "at_risk") {
      return {
        label:
          status === "breached"
            ? "SLA Breached"
            : status === "at_risk"
              ? "At Risk"
              : "Overdue",
        className: "bg-red-500/10 text-red-600 dark:text-red-400",
        icon: ShieldAlert,
      };
    }

    if (status === "met" || status === "resolved" || status === "closed") {
      return {
        label: "SLA Met",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        icon: CheckCircle2,
      };
    }

    return {
      label: "On Track",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      icon: Clock3,
    };
  }, [sla]);

  // -------------------------------------------------------
  // LOADING / ERROR
  // -------------------------------------------------------

  if (loading) {
    return <TicketSkeleton />;
  }

  if (error || !ticket) {
    return <ErrorState message={error} onRetry={refreshTicket} />;
  }

  const SlaIcon = slaInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-7xl"
    >
      {/* ------------------------------------------------- */}
      {/* HEADER */}
      {/* ------------------------------------------------- */}

      <div className="mb-6">
        <Link
          to="/tickets"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-medium
            text-zinc-500
            transition
            hover:text-red-600
            dark:text-zinc-400
            dark:hover:text-red-400
          "
        >
          <ArrowLeft size={16} />
          Back to tickets
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
                {ticket.ticket_number}
              </span>

              <StatusBadge status={ticket.status} />

              <PriorityBadge priority={ticket.priority} />
            </div>

            <h1 className="mt-3 max-w-4xl text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              {ticket.title}
            </h1>

            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Created {formatRelativeTime(ticket.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshTicket}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-zinc-200
                bg-white
                px-3.5
                py-2.5
                text-sm
                font-medium
                text-zinc-700
                transition
                hover:border-red-200
                hover:text-red-600
                dark:border-white/10
                dark:bg-white/[0.03]
                dark:text-zinc-300
                dark:hover:border-red-500/30
                dark:hover:text-red-400
              "
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-red-500/20
                  bg-red-500/5
                  px-3.5
                  py-2.5
                  text-sm
                  font-medium
                  text-red-600
                  transition
                  hover:bg-red-500/10
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:text-red-400
                "
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------- */}
      {/* MAIN GRID */}
      {/* ------------------------------------------------- */}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ================================================= */}
        {/* LEFT */}
        {/* ================================================= */}

        <div className="min-w-0 space-y-6">
          {/* --------------------------------------------- */}
          {/* DESCRIPTION */}
          {/* --------------------------------------------- */}

          <section
            className="
              rounded-2xl
              border
              border-zinc-200
              bg-white
              p-5
              shadow-sm
              dark:border-white/[0.07]
              dark:bg-[#101010]
              dark:shadow-none
              sm:p-6
            "
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <FileText size={18} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Issue description
                </h2>

                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Details provided with this ticket
                </p>
              </div>
            </div>

            <div className="mt-5 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-7 text-zinc-700 dark:border-white/[0.06] dark:bg-white/[0.025] dark:text-zinc-300">
              {ticket.description || "No description provided."}
            </div>
          </section>

          {/* --------------------------------------------- */}
          {/* ACTIVITY */}
          {/* --------------------------------------------- */}

          <section
            className="
              rounded-2xl
              border
              border-zinc-200
              bg-white
              shadow-sm
              dark:border-white/[0.07]
              dark:bg-[#101010]
              dark:shadow-none
            "
          >
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/[0.07] sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                    <MessageSquare size={18} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Activity
                    </h2>

                    <p className="text-xs text-zinc-500">
                      Ticket conversation and updates
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400">
                  {activities.length}{" "}
                  {activities.length === 1 ? "entry" : "entries"}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {activityLoading ? (
                <div className="space-y-5">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex gap-3 animate-pulse">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-200 dark:bg-white/10" />

                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-white/10" />
                        <div className="h-12 rounded-xl bg-zinc-200 dark:bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare size={28} className="mx-auto text-zinc-400" />

                  <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No activity yet
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Replies and ticket updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[17px] top-4 bottom-4 w-px bg-zinc-200 dark:bg-white/[0.07]" />

                  <div className="space-y-6">
                    {activities.map((activity, index) => {
                      const activityName =
                        activity.user?.name ||
                        activity.user_name ||
                        activity.author?.name ||
                        "User";

                      const internal = activity.is_internal === true;

                      return (
                        <motion.div
                          key={activity.id || `${activity.created_at}-${index}`}
                          initial={{
                            opacity: 0,
                            x: -8,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            duration: 0.2,
                            delay: index * 0.03,
                          }}
                          className="relative flex gap-3"
                        >
                          <div
                            className={`
                              relative
                              z-10
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              border
                              text-xs
                              font-bold
                              ${
                                internal
                                  ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
                              }
                            `}
                          >
                            {internal ? (
                              <ShieldAlert size={16} />
                            ) : (
                              getInitials(activityName) || <User size={15} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                                {activityName}
                              </span>

                              {internal && (
                                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                  Internal note
                                </span>
                              )}

                              <span className="text-xs text-zinc-400">
                                {formatRelativeTime(activity.created_at)}
                              </span>
                            </div>

                            <div
                              className={`
                                mt-2
                                rounded-xl
                                border
                                p-3.5
                                text-sm
                                leading-6
                                ${
                                  internal
                                    ? "border-amber-500/15 bg-amber-500/[0.04] text-zinc-700 dark:text-zinc-300"
                                    : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-white/[0.06] dark:bg-white/[0.025] dark:text-zinc-300"
                                }
                              `}
                            >
                              {activity.content}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* --------------------------------------------- */}
          {/* REPLY */}
          {/* --------------------------------------------- */}

          <section
            className="
              rounded-2xl
              border
              border-zinc-200
              bg-white
              p-5
              shadow-sm
              dark:border-white/[0.07]
              dark:bg-[#101010]
              dark:shadow-none
              sm:p-6
            "
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <Send size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Add a reply
                </h2>

                <p className="text-xs text-zinc-500">
                  Send a public response to this ticket
                </p>
              </div>
            </div>

            <form onSubmit={handleReply} className="mt-5">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={4}
                placeholder="Write your reply..."
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-zinc-200
                  bg-zinc-50
                  px-4
                  py-3
                  text-sm
                  text-zinc-900
                  outline-none
                  transition
                  placeholder:text-zinc-400
                  focus:border-red-500
                  focus:ring-2
                  focus:ring-red-500/10
                  dark:border-white/10
                  dark:bg-white/[0.025]
                  dark:text-white
                  dark:placeholder:text-zinc-600
                "
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!reply.trim() || sendingReply}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-red-700
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-red-600
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <Send size={15} />

                  {sendingReply ? "Sending..." : "Send reply"}
                </button>
              </div>
            </form>
          </section>

          {/* --------------------------------------------- */}
          {/* INTERNAL NOTE — STAFF / ADMIN */}
          {/* --------------------------------------------- */}

          {isStaff && (
            <section
              className="
                rounded-2xl
                border
                border-amber-500/20
                bg-amber-500/[0.025]
                p-5
                dark:bg-amber-500/[0.02]
                sm:p-6
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShieldAlert size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Internal note
                  </h2>

                  <p className="text-xs text-zinc-500">
                    Only staff and admins can see these notes
                  </p>
                </div>
              </div>

              <form onSubmit={handleInternalNote} className="mt-5">
                <textarea
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value)}
                  rows={3}
                  placeholder="Add an internal note..."
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-amber-500/20
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-zinc-900
                    outline-none
                    transition
                    placeholder:text-zinc-400
                    focus:border-amber-500
                    focus:ring-2
                    focus:ring-amber-500/10
                    dark:bg-black/20
                    dark:text-white
                    dark:placeholder:text-zinc-600
                  "
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={!internalNote.trim() || sendingNote}
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-amber-600
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-amber-500
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <ShieldAlert size={15} />

                    {sendingNote ? "Adding..." : "Add note"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* ================================================= */}
        {/* RIGHT SIDEBAR */}
        {/* ================================================= */}

        <aside className="space-y-6">
          {/* --------------------------------------------- */}
          {/* SLA */}
          {/* --------------------------------------------- */}

          <section
            className="
              rounded-2xl
              border
              border-zinc-200
              bg-white
              p-5
              shadow-sm
              dark:border-white/[0.07]
              dark:bg-[#101010]
              dark:shadow-none
            "
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                SLA
              </h2>

              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${slaInfo.className}`}
              >
                <SlaIcon size={16} />
              </div>
            </div>

            <div className={`mt-4 rounded-xl px-4 py-3 ${slaInfo.className}`}>
              <p className="text-sm font-semibold">{slaInfo.label}</p>

              <p className="mt-1 text-xs opacity-80">
                {sla?.hours_remaining != null
                  ? sla.hours_remaining > 0
                    ? `${
                        sla.hours_remaining.toFixed
                          ? sla.hours_remaining.toFixed(1)
                          : sla.hours_remaining
                      } hours remaining`
                    : "SLA time has elapsed"
                  : "No SLA information"}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <InfoRow
                icon={<Clock3 size={15} />}
                label="Ticket age"
                value={
                  sla?.age_hours != null
                    ? `${Number(sla.age_hours).toFixed(1)} hours`
                    : "—"
                }
              />

              <InfoRow
                icon={<CalendarDays size={15} />}
                label="Due date"
                value={formatDate(ticket.due_at)}
              />

              <InfoRow
                icon={<CalendarDays size={15} />}
                label="Created"
                value={formatDate(ticket.created_at)}
              />
            </div>
          </section>

          {/* --------------------------------------------- */}
          {/* TICKET DETAILS */}
          {/* --------------------------------------------- */}

          <section
            className="
              rounded-2xl
              border
              border-zinc-200
              bg-white
              p-5
              shadow-sm
              dark:border-white/[0.07]
              dark:bg-[#101010]
              dark:shadow-none
            "
          >
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Ticket details
            </h2>

            <div className="mt-5 space-y-4">
              <InfoRow
                icon={<FileText size={15} />}
                label="Category"
                value={ticket.category || "—"}
              />

              <InfoRow
                icon={<CalendarDays size={15} />}
                label="Last updated"
                value={formatDate(ticket.updated_at)}
              />

              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">Status</p>

                {isStaff ? (
                  <select
                    value={selectedStatus}
                    disabled={updating}
                    onChange={(event) =>
                      handleUpdate("status", event.target.value)
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-zinc-200
                      bg-zinc-50
                      px-3
                      py-2.5
                      text-sm
                      font-medium
                      text-zinc-800
                      outline-none
                      focus:border-red-500
                      dark:border-white/10
                      dark:bg-white/[0.03]
                      dark:text-zinc-200
                    "
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <StatusBadge status={ticket.status} />
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  Priority
                </p>

                {isStaff ? (
                  <select
                    value={selectedPriority}
                    disabled={updating}
                    onChange={(event) =>
                      handleUpdate("priority", event.target.value)
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-zinc-200
                      bg-zinc-50
                      px-3
                      py-2.5
                      text-sm
                      font-medium
                      text-zinc-800
                      outline-none
                      focus:border-red-500
                      dark:border-white/10
                      dark:bg-white/[0.03]
                      dark:text-zinc-200
                    "
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                ) : (
                  <PriorityBadge priority={ticket.priority} />
                )}
              </div>
            </div>
          </section>

          {/* --------------------------------------------- */}
          {/* STUDENT */}
          {/* --------------------------------------------- */}

          <section
            className="
              rounded-2xl
              border
              border-zinc-200
              bg-white
              p-5
              shadow-sm
              dark:border-white/[0.07]
              dark:bg-[#101010]
              dark:shadow-none
            "
          >
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Requester
            </h2>

            <div className="mt-4 flex items-center gap-3">
              <Avatar name={ticket.student?.name} />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                  {ticket.student?.name || "Unknown"}
                </p>

                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500">
                  <Mail size={12} />
                  {ticket.student?.email || "—"}
                </p>
              </div>
            </div>
          </section>

          {/* --------------------------------------------- */}
          {/* ASSIGNEE */}
          {/* --------------------------------------------- */}

          <section
            className="
              rounded-2xl
              border
              border-zinc-200
              bg-white
              p-5
              shadow-sm
              dark:border-white/[0.07]
              dark:bg-[#101010]
              dark:shadow-none
            "
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Assigned to
              </h2>

              <UserRoundCog size={16} className="text-zinc-400" />
            </div>

            {ticket.assigned_to ? (
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={ticket.assigned_to.name} />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                    {ticket.assigned_to.name}
                  </p>

                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500">
                    <Mail size={12} />
                    {ticket.assigned_to.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-4 text-center dark:border-white/10">
                <UserRound size={20} className="mx-auto text-zinc-400" />

                <p className="mt-2 text-xs font-medium text-zinc-500">
                  No staff member assigned
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------
// SMALL COMPONENTS
// ---------------------------------------------------------

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-zinc-400">{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-500">{label}</p>

        <p className="mt-1 break-words text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-600 dark:text-red-400">
      {getInitials(name) || <User size={16} />}
    </div>
  );
}
