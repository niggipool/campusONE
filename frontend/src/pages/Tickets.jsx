import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Ticket as TicketIcon,
  User,
  X,
} from "lucide-react";

import { api } from "../services/api";

/* ---------------------------------- */
/* Constants                          */
/* ---------------------------------- */

const STATUSES = ["open", "in_progress", "pending", "resolved", "closed"];

const PRIORITIES = ["low", "medium", "high", "urgent"];

/* ---------------------------------- */
/* Helpers                            */
/* ---------------------------------- */

function formatLabel(value) {
  if (!value) return "Unknown";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(value);
}

/* ---------------------------------- */
/* Animation                          */
/* ---------------------------------- */

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

/* ---------------------------------- */
/* Status Badge                       */
/* ---------------------------------- */

function StatusBadge({ status }) {
  const styles = {
    open: `
      bg-blue-50 text-blue-700
      dark:bg-blue-950/30 dark:text-blue-400
    `,
    in_progress: `
      bg-violet-50 text-violet-700
      dark:bg-violet-950/30 dark:text-violet-400
    `,
    pending: `
      bg-orange-50 text-orange-700
      dark:bg-orange-950/30 dark:text-orange-400
    `,
    resolved: `
      bg-emerald-50 text-emerald-700
      dark:bg-emerald-950/30 dark:text-emerald-400
    `,
    closed: `
      bg-zinc-100 text-zinc-600
      dark:bg-white/[0.06] dark:text-zinc-400
    `,
  };

  return (
    <span
      className={`
        inline-flex items-center
        rounded-md
        px-2.5 py-1
        text-[10px]
        font-semibold
        ${styles[status] || styles.closed}
      `}
    >
      {formatLabel(status)}
    </span>
  );
}

/* ---------------------------------- */
/* Priority Badge                     */
/* ---------------------------------- */

function PriorityBadge({ priority }) {
  const styles = {
    low: `
      bg-zinc-100 text-zinc-600
      dark:bg-white/[0.06] dark:text-zinc-400
    `,
    medium: `
      bg-blue-50 text-blue-700
      dark:bg-blue-950/30 dark:text-blue-400
    `,
    high: `
      bg-orange-50 text-orange-700
      dark:bg-orange-950/30 dark:text-orange-400
    `,
    urgent: `
      bg-red-50 text-red-700
      dark:bg-red-950/30 dark:text-red-400
    `,
  };

  return (
    <span
      className={`
        inline-flex items-center
        rounded-md
        px-2.5 py-1
        text-[10px]
        font-semibold
        ${styles[priority] || styles.low}
      `}
    >
      {formatLabel(priority)}
    </span>
  );
}

/* ---------------------------------- */
/* SLA Badge                          */
/* ---------------------------------- */

function SLABadge({ sla }) {
  if (!sla) return null;

  const status = String(sla.status || "").toLowerCase();

  const isOverdue = status === "overdue";

  const isRisk = status === "at_risk" || status === "warning";

  let className = `
    bg-emerald-50 text-emerald-700
    dark:bg-emerald-950/30 dark:text-emerald-400
  `;

  if (isOverdue) {
    className = `
      bg-red-50 text-red-700
      dark:bg-red-950/30 dark:text-red-400
    `;
  } else if (isRisk) {
    className = `
      bg-orange-50 text-orange-700
      dark:bg-orange-950/30 dark:text-orange-400
    `;
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded-md
        px-2 py-1
        text-[10px]
        font-semibold
        ${className}
      `}
    >
      <Clock3 size={11} />
      {formatLabel(sla.status)}
    </span>
  );
}

/* ---------------------------------- */
/* Loading Skeleton                   */
/* ---------------------------------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="
            h-16
            animate-pulse
            rounded-xl
            bg-zinc-100
            dark:bg-white/[0.04]
          "
        />
      ))}
    </div>
  );
}

/* ---------------------------------- */
/* Tickets Page                       */
/* ---------------------------------- */

export default function Tickets() {
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");

  const [page, setPage] = useState(1);

  const pageSize = 8;

  /* -------------------------------- */
  /* Fetch Tickets                    */
  /* -------------------------------- */

  const fetchTickets = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (status) {
        params.set("status", status);
      }

      if (priority) {
        params.set("priority", priority);
      }

      if (category) {
        params.set("category", category);
      }

      const query = params.toString();

      const response = await api.get(
        query ? `/api/tickets?${query}` : "/api/tickets",
      );

      setTickets(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Tickets error:", err);

      if (err?.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err?.response?.status === 403) {
        setError("You do not have permission to view these tickets.");
      } else {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load tickets.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [status, priority, category]);

  /* -------------------------------- */
  /* Categories                       */
  /* -------------------------------- */

  const categories = useMemo(() => {
    const values = tickets.map((ticket) => ticket.category).filter(Boolean);

    return [...new Set(values)].sort();
  }, [tickets]);

  /* -------------------------------- */
  /* Search                           */
  /* -------------------------------- */

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      return (
        ticket.ticket_number?.toLowerCase().includes(query) ||
        ticket.title?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.category?.toLowerCase().includes(query) ||
        ticket.student?.name?.toLowerCase().includes(query) ||
        ticket.student?.email?.toLowerCase().includes(query) ||
        ticket.assigned_to?.name?.toLowerCase().includes(query)
      );
    });
  }, [tickets, search]);

  /* -------------------------------- */
  /* Pagination                       */
  /* -------------------------------- */

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority, category]);

  /* -------------------------------- */
  /* Reset Filters                    */
  /* -------------------------------- */

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategory("");
    setPage(1);
  };

  const hasFilters = search || status || priority || category;

  /* -------------------------------- */
  /* Error                            */
  /* -------------------------------- */

  if (error) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <PageHeader
          onRefresh={() => fetchTickets(true)}
          refreshing={refreshing}
        />

        <div
          className="
            mt-6
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
                Tickets unavailable
              </h2>

              <p className="mt-1 text-sm text-red-700/80 dark:text-red-400/70">
                {error}
              </p>

              <button
                onClick={() => fetchTickets()}
                className="
                  mt-4
                  inline-flex items-center gap-2
                  rounded-lg
                  bg-red-600
                  px-4 py-2
                  text-sm font-medium
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

  /* -------------------------------- */
  /* Main                             */
  /* -------------------------------- */

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-[1600px]"
    >
      <PageHeader
        onRefresh={() => fetchTickets(true)}
        refreshing={refreshing}
      />

      {/* Filters */}
      <motion.div
        variants={itemVariants}
        className="
          mt-6
          rounded-2xl
          border border-zinc-200
          bg-white
          p-4
          shadow-sm
          dark:border-white/[0.07]
          dark:bg-[#101010]
          dark:shadow-none
        "
      >
        <div className="flex flex-col gap-3 xl:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={17}
              className="
                pointer-events-none
                absolute left-3 top-1/2
                -translate-y-1/2
                text-zinc-400
                dark:text-zinc-600
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets, titles, students..."
              className="
                h-11
                w-full
                rounded-xl
                border border-zinc-200
                bg-zinc-50
                pl-10 pr-4
                text-sm
                text-zinc-900
                outline-none
                transition
                placeholder:text-zinc-400
                focus:border-red-400
                focus:ring-2
                focus:ring-red-500/10
                dark:border-white/[0.07]
                dark:bg-white/[0.025]
                dark:text-zinc-100
                dark:placeholder:text-zinc-600
                dark:focus:border-red-900
              "
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="
              h-11
              rounded-xl
              border border-zinc-200
              bg-zinc-50
              px-3
              text-sm
              text-zinc-700
              outline-none
              focus:border-red-400
              dark:border-white/[0.07]
              dark:bg-white/[0.025]
              dark:text-zinc-300
              dark:focus:border-red-900
            "
          >
            <option value="">All statuses</option>

            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="
              h-11
              rounded-xl
              border border-zinc-200
              bg-zinc-50
              px-3
              text-sm
              text-zinc-700
              outline-none
              focus:border-red-400
              dark:border-white/[0.07]
              dark:bg-white/[0.025]
              dark:text-zinc-300
              dark:focus:border-red-900
            "
          >
            <option value="">All priorities</option>

            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="
              h-11
              rounded-xl
              border border-zinc-200
              bg-zinc-50
              px-3
              text-sm
              text-zinc-700
              outline-none
              focus:border-red-400
              dark:border-white/[0.07]
              dark:bg-white/[0.025]
              dark:text-zinc-300
              dark:focus:border-red-900
            "
          >
            <option value="">All categories</option>

            {categories.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </select>

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                border border-zinc-200
                px-4
                text-sm
                font-medium
                text-zinc-600
                transition
                hover:bg-zinc-100
                hover:text-zinc-900
                dark:border-white/[0.07]
                dark:text-zinc-400
                dark:hover:bg-white/[0.05]
                dark:hover:text-zinc-200
              "
            >
              <X size={15} />
              Reset
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-600">
          <Filter size={13} />

          <span>
            {filteredTickets.length} ticket
            {filteredTickets.length !== 1 ? "s" : ""}
            {hasFilters ? " matching your filters" : ""}
          </span>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        variants={itemVariants}
        className="
          mt-6
          overflow-hidden
          rounded-2xl
          border border-zinc-200
          bg-white
          shadow-sm
          dark:border-white/[0.07]
          dark:bg-[#101010]
          dark:shadow-none
        "
      >
        {loading ? (
          <div className="p-5">
            <LoadingSkeleton />
          </div>
        ) : paginatedTickets.length === 0 ? (
          <EmptyTickets
            hasFilters={Boolean(hasFilters)}
            onReset={resetFilters}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-white/[0.06]">
                    <TableHeader>Ticket</TableHeader>
                    <TableHeader>Title</TableHeader>
                    <TableHeader>Category</TableHeader>
                    <TableHeader>Priority</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>SLA</TableHeader>
                    <TableHeader>Assigned To</TableHeader>
                    <TableHeader>Updated</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTickets.map((ticket, index) => (
                    <TicketRow key={ticket.id} ticket={ticket} index={index} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-zinc-100 dark:divide-white/[0.06] lg:hidden">
              {paginatedTickets.map((ticket, index) => (
                <MobileTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------------- */
/* Page Header                        */
/* ---------------------------------- */

function PageHeader({ onRefresh, refreshing }) {
  return (
    <motion.div
      variants={itemVariants}
      className="
        flex flex-col gap-4
        sm:flex-row
        sm:items-end
        sm:justify-between
      "
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600 dark:text-red-700">
          Workspace
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Tickets
        </h1>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-600">
          Manage and track campus support requests.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="
            inline-flex
            h-11
            items-center
            justify-center
            gap-2
            rounded-xl
            border border-zinc-200
            bg-white
            px-4
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

          <span className="hidden sm:inline">Refresh</span>
        </button>

        <Link
          to="/tickets/new"
          className="
            inline-flex
            h-11
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-red-600
            px-4
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-red-700
            hover:shadow-red-600/20
          "
        >
          <Plus size={17} />
          Create Ticket
        </Link>
      </div>
    </motion.div>
  );
}

/* ---------------------------------- */
/* Table Header                       */
/* ---------------------------------- */

function TableHeader({ children }) {
  return (
    <th
      className="
        whitespace-nowrap
        px-5 py-3
        text-left
        text-[10px]
        font-semibold
        uppercase
        tracking-[0.12em]
        text-zinc-500
        dark:text-zinc-600
      "
    >
      {children}
    </th>
  );
}

/* ---------------------------------- */
/* Ticket Row                         */
/* ---------------------------------- */

function TicketRow({ ticket, index }) {
  return (
    <motion.tr
      initial={{
        opacity: 0,
        y: 5,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.025,
        duration: 0.25,
      }}
      onClick={() => (window.location.href = `/tickets/${ticket.id}`)}
      className="
        cursor-pointer
        border-b border-zinc-100
        transition-colors
        hover:bg-zinc-50
        dark:border-white/[0.04]
        dark:hover:bg-white/[0.025]
      "
    >
      {/* Ticket */}
      <td className="whitespace-nowrap px-5 py-4">
        <span className="text-xs font-semibold text-red-600 dark:text-red-500">
          {ticket.ticket_number}
        </span>
      </td>

      {/* Title */}
      <td className="max-w-[250px] px-5 py-4">
        <div>
          <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {ticket.title || "Untitled ticket"}
          </p>

          {ticket.student?.name && (
            <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-600">
              {ticket.student.name}
            </p>
          )}
        </div>
      </td>

      {/* Category */}
      <td className="whitespace-nowrap px-5 py-4">
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {formatLabel(ticket.category)}
        </span>
      </td>

      {/* Priority */}
      <td className="whitespace-nowrap px-5 py-4">
        <PriorityBadge priority={ticket.priority} />
      </td>

      {/* Status */}
      <td className="whitespace-nowrap px-5 py-4">
        <StatusBadge status={ticket.status} />
      </td>

      {/* SLA */}
      <td className="whitespace-nowrap px-5 py-4">
        <SLABadge sla={ticket.sla} />
      </td>

      {/* Assignee */}
      <td className="whitespace-nowrap px-5 py-4">
        {ticket.assigned_to ? (
          <div className="flex items-center gap-2">
            <div
              className="
                flex h-7 w-7
                items-center justify-center
                rounded-full
                bg-red-100
                text-[10px]
                font-bold
                text-red-700
                dark:bg-red-950/40
                dark:text-red-500
              "
            >
              {ticket.assigned_to.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {ticket.assigned_to.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-700">
            Unassigned
          </span>
        )}
      </td>

      {/* Updated */}
      <td className="whitespace-nowrap px-5 py-4">
        <span className="text-xs text-zinc-500 dark:text-zinc-600">
          {formatRelativeDate(ticket.updated_at)}
        </span>
      </td>
    </motion.tr>
  );
}

/* ---------------------------------- */
/* Mobile Ticket Card                 */
/* ---------------------------------- */

function MobileTicketCard({ ticket, index }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.025,
        duration: 0.25,
      }}
    >
      <Link
        to={`/tickets/${ticket.id}`}
        className="
          block
          p-4
          transition-colors
          hover:bg-zinc-50
          dark:hover:bg-white/[0.025]
        "
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-red-600 dark:text-red-500">
              {ticket.ticket_number}
            </p>

            <h3 className="mt-1 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {ticket.title || "Untitled ticket"}
            </h3>

            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
              {formatLabel(ticket.category)}
            </p>
          </div>

          <StatusBadge status={ticket.status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={ticket.priority} />

          <SLABadge sla={ticket.sla} />

          {ticket.assigned_to && (
            <span
              className="
                inline-flex items-center gap-1
                rounded-md
                bg-zinc-100
                px-2 py-1
                text-[10px]
                text-zinc-600
                dark:bg-white/[0.05]
                dark:text-zinc-400
              "
            >
              <User size={10} />
              {ticket.assigned_to.name}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-700">
            {ticket.student?.name || "Unknown student"}
          </span>

          <span className="text-[10px] text-zinc-400 dark:text-zinc-700">
            {formatRelativeDate(ticket.updated_at)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ---------------------------------- */
/* Empty Tickets                      */
/* ---------------------------------- */

function EmptyTickets({ hasFilters, onReset }) {
  return (
    <div className="flex min-h-[350px] items-center justify-center p-8">
      <div className="text-center">
        <div
          className="
            mx-auto flex h-12 w-12
            items-center justify-center
            rounded-2xl
            bg-zinc-100
            text-zinc-400
            dark:bg-white/[0.04]
            dark:text-zinc-600
          "
        >
          <TicketIcon size={21} />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          No tickets found
        </h3>

        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
          {hasFilters
            ? "Try changing your search or filters."
            : "There are no tickets to display yet."}
        </p>

        {hasFilters && (
          <button
            onClick={onReset}
            className="
              mt-4
              text-xs
              font-medium
              text-red-600
              hover:text-red-700
              dark:text-red-500
            "
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* Pagination                         */
/* ---------------------------------- */

function Pagination({ page, totalPages, total, pageSize, onPageChange }) {
  if (total === 0) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      className="
        flex flex-col gap-3
        border-t border-zinc-100
        px-5 py-4
        sm:flex-row
        sm:items-center
        sm:justify-between
        dark:border-white/[0.06]
      "
    >
      <p className="text-xs text-zinc-500 dark:text-zinc-600">
        Showing{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-400">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-400">
          {total}
        </span>
      </p>

      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="
            flex h-8 w-8
            items-center justify-center
            rounded-lg
            border border-zinc-200
            text-zinc-500
            transition
            hover:bg-zinc-100
            disabled:pointer-events-none
            disabled:opacity-30
            dark:border-white/[0.07]
            dark:hover:bg-white/[0.05]
          "
        >
          <ChevronLeft size={15} />
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1)
          .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
          .map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`
                flex h-8 min-w-8
                items-center justify-center
                rounded-lg
                px-2
                text-xs
                font-medium
                transition
                ${
                  pageNumber === page
                    ? `
                      bg-red-600
                      text-white
                    `
                    : `
                      text-zinc-500
                      hover:bg-zinc-100
                      hover:text-zinc-900
                      dark:text-zinc-500
                      dark:hover:bg-white/[0.05]
                      dark:hover:text-zinc-200
                    `
                }
              `}
            >
              {pageNumber}
            </button>
          ))}

        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="
            flex h-8 w-8
            items-center justify-center
            rounded-lg
            border border-zinc-200
            text-zinc-500
            transition
            hover:bg-zinc-100
            disabled:pointer-events-none
            disabled:opacity-30
            dark:border-white/[0.07]
            dark:hover:bg-white/[0.05]
          "
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
