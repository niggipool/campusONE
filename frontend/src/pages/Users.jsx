import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Users as UsersIcon,
  ShieldCheck,
  GraduationCap,
  UserRoundCog,
  Mail,
  CalendarDays,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { api } from "../services/api";
import { useAuth } from "../context/useAuth";

// ---------------------------------------------------------
// CONFIG
// ---------------------------------------------------------

const roleConfig = {
  student: {
    label: "Student",
    icon: GraduationCap,
    className:
      "bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400",
  },

  staff: {
    label: "Staff",
    icon: UserRoundCog,
    className:
      "bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/20 dark:text-violet-400",
  },

  admin: {
    label: "Admin",
    icon: ShieldCheck,
    className:
      "bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/20 dark:text-red-400",
  },
};

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ---------------------------------------------------------
// ROLE BADGE
// ---------------------------------------------------------

function RoleBadge({ role }) {
  const config = roleConfig[role] || roleConfig.student;
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-2.5
        py-1
        text-xs
        font-semibold
        ${config.className}
      `}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------
// AVATAR
// ---------------------------------------------------------

function Avatar({ name, role }) {
  const config = roleConfig[role] || roleConfig.student;

  return (
    <div
      className={`
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-full
        text-xs
        font-bold
        ${config.className}
      `}
    >
      {getInitials(name)}
    </div>
  );
}

// ---------------------------------------------------------
// SKELETON
// ---------------------------------------------------------

function UsersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded bg-zinc-200 dark:bg-white/10" />

      <div className="h-24 rounded-2xl bg-zinc-200 dark:bg-white/10" />

      <div className="rounded-2xl bg-zinc-200 p-5 dark:bg-white/10">
        <div className="space-y-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-zinc-300 dark:bg-white/10" />

              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 rounded bg-zinc-300 dark:bg-white/10" />
                <div className="h-3 w-56 rounded bg-zinc-300 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------

export default function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [updatingUserId, setUpdatingUserId] = useState(null);

  const isAdmin = user?.role === "admin";

  // -------------------------------------------------------
  // FETCH USERS
  // -------------------------------------------------------

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.get("/api/users");

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Users error:", err);

      setError(
        err?.response?.data?.detail || err?.message || "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
      setError("Only administrators can access the users directory.");
    }
  }, [isAdmin]);

  // -------------------------------------------------------
  // UPDATE ROLE
  // -------------------------------------------------------

  const updateRole = async (userId, role) => {
    if (!isAdmin || updatingUserId === userId) {
      return;
    }

    setUpdatingUserId(userId);

    try {
      const data = await api.patch(
        `/api/users/${userId}/role?role=${encodeURIComponent(role)}`,
      );

      const updatedUser = data?.user;

      if (updatedUser) {
        setUsers((currentUsers) =>
          currentUsers.map((currentUser) =>
            currentUser.id === userId
              ? {
                  ...currentUser,
                  ...updatedUser,
                }
              : currentUser,
          ),
        );
      } else {
        await fetchUsers();
      }
    } catch (err) {
      console.error("Role update error:", err);

      alert(err?.response?.data?.detail || "Failed to update user role.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // -------------------------------------------------------
  // FILTER
  // -------------------------------------------------------

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query);

      const matchesRole = roleFilter === "all" || item.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // -------------------------------------------------------
  // COUNTS
  // -------------------------------------------------------

  const counts = useMemo(() => {
    return {
      total: users.length,

      students: users.filter((item) => item.role === "student").length,

      staff: users.filter((item) => item.role === "staff").length,

      admins: users.filter((item) => item.role === "admin").length,
    };
  }, [users]);

  // -------------------------------------------------------
  // NOT ADMIN
  // -------------------------------------------------------

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <ShieldCheck size={28} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-zinc-900 dark:text-white">
            Admin access required
          </h1>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            The users directory is only available to administrators.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  if (loading) {
    return <UsersSkeleton />;
  }

  // -------------------------------------------------------
  // ERROR
  // -------------------------------------------------------

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertCircle size={28} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-zinc-900 dark:text-white">
            Unable to load users
          </h2>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {error}
          </p>

          <button
            onClick={fetchUsers}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-7xl"
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600 dark:text-red-500">
          Administration
        </p>

        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Users
            </h1>

            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Manage CampusONE users and their access roles.
            </p>
          </div>

          <button
            onClick={fetchUsers}
            className="
              inline-flex
              w-fit
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
        </div>
      </div>

      {/* ================================================= */}
      {/* STATS */}
      {/* ================================================= */}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={counts.total}
          icon={UsersIcon}
          accent="red"
        />

        <StatCard
          label="Students"
          value={counts.students}
          icon={GraduationCap}
          accent="blue"
        />

        <StatCard
          label="Staff"
          value={counts.staff}
          icon={UserRoundCog}
          accent="violet"
        />

        <StatCard
          label="Administrators"
          value={counts.admins}
          icon={ShieldCheck}
          accent="orange"
        />
      </div>

      {/* ================================================= */}
      {/* TOOLBAR */}
      {/* ================================================= */}

      <div
        className="
          mb-5
          flex
          flex-col
          gap-3
          rounded-2xl
          border
          border-zinc-200
          bg-white
          p-4
          shadow-sm
          dark:border-white/[0.07]
          dark:bg-[#101010]
          dark:shadow-none
          sm:flex-row
        "
      >
        {/* Search */}

        <div className="relative flex-1">
          <Search
            size={17}
            className="
              absolute
              left-3.5
              top-1/2
              -translate-y-1/2
              text-zinc-400
            "
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            className="
              h-11
              w-full
              rounded-xl
              border
              border-zinc-200
              bg-zinc-50
              pl-10
              pr-4
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
        </div>

        {/* Role */}

        <div className="relative">
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="
              h-11
              w-full
              appearance-none
              rounded-xl
              border
              border-zinc-200
              bg-zinc-50
              py-2
              pl-3.5
              pr-10
              text-sm
              font-medium
              text-zinc-700
              outline-none
              transition
              focus:border-red-500
              dark:border-white/10
              dark:bg-white/[0.025]
              dark:text-zinc-300
              sm:w-44
            "
          >
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="staff">Staff</option>
            <option value="admin">Admins</option>
          </select>

          <ChevronDown
            size={16}
            className="
              pointer-events-none
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-zinc-400
            "
          />
        </div>
      </div>

      {/* ================================================= */}
      {/* RESULT COUNT */}
      {/* ================================================= */}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {/* ================================================= */}
      {/* DESKTOP TABLE */}
      {/* ================================================= */}

      <div
        className="
          hidden
          overflow-hidden
          rounded-2xl
          border
          border-zinc-200
          bg-white
          shadow-sm
          dark:border-white/[0.07]
          dark:bg-[#101010]
          dark:shadow-none
          md:block
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/[0.07]">
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  User
                </th>

                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Role
                </th>

                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Joined
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Access
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <Search size={28} className="mx-auto text-zinc-400" />

                    <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      No users found
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Try changing your search or role filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.15,
                      delay: index * 0.02,
                    }}
                    className="
                      border-b
                      border-zinc-100
                      transition
                      last:border-0
                      hover:bg-zinc-50
                      dark:border-white/[0.04]
                      dark:hover:bg-white/[0.02]
                    "
                  >
                    {/* User */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={item.name} role={item.role} />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                            {item.name}
                          </p>

                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-zinc-500">
                            <Mail size={12} />
                            {item.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}

                    <td className="px-5 py-4">
                      <RoleBadge role={item.role} />
                    </td>

                    {/* Joined */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <CalendarDays size={14} />
                        {formatDate(item.created_at)}
                      </div>
                    </td>

                    {/* Access */}

                    <td className="px-5 py-4">
                      <RoleSelector
                        item={item}
                        currentUser={user}
                        updatingUserId={updatingUserId}
                        onChange={updateRole}
                      />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================= */}
      {/* MOBILE CARDS */}
      {/* ================================================= */}

      <div className="space-y-3 md:hidden">
        {filteredUsers.length === 0 ? (
          <div
            className="
              rounded-2xl
              border
              border-zinc-200
              bg-white
              px-5
              py-14
              text-center
              dark:border-white/[0.07]
              dark:bg-[#101010]
            "
          >
            <Search size={28} className="mx-auto text-zinc-400" />

            <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No users found
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Try changing your search or role filter.
            </p>
          </div>
        ) : (
          filteredUsers.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.15,
                delay: index * 0.025,
              }}
              className="
                rounded-2xl
                border
                border-zinc-200
                bg-white
                p-4
                shadow-sm
                dark:border-white/[0.07]
                dark:bg-[#101010]
                dark:shadow-none
              "
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={item.name} role={item.role} />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                      {item.name}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {item.email}
                    </p>
                  </div>
                </div>

                <RoleBadge role={item.role} />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <CalendarDays size={13} />
                  Joined {formatDate(item.created_at)}
                </div>

                <RoleSelector
                  item={item}
                  currentUser={user}
                  updatingUserId={updatingUserId}
                  onChange={updateRole}
                />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------
// STAT CARD
// ---------------------------------------------------------

function StatCard({ label, value, icon: Icon, accent }) {
  const accents = {
    red: {
      wrapper: "bg-red-500/10 text-red-600 dark:text-red-400",
    },

    blue: {
      wrapper: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },

    violet: {
      wrapper: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },

    orange: {
      wrapper: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  };

  return (
    <div
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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500">{label}</p>

          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            ${accents[accent]?.wrapper}
          `}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// ROLE SELECTOR
// ---------------------------------------------------------

function RoleSelector({ item, currentUser, updatingUserId, onChange }) {
  const isOwnAccount = currentUser?.id === item.id;

  const disabled =
    updatingUserId === item.id || (isOwnAccount && item.role === "admin");

  return (
    <div className="relative">
      <select
        value={item.role}
        disabled={disabled}
        onChange={(event) => onChange(item.id, event.target.value)}
        title={
          isOwnAccount && item.role === "admin"
            ? "You cannot remove your own admin role"
            : "Change user role"
        }
        className="
          h-9
          min-w-28
          appearance-none
          rounded-lg
          border
          border-zinc-200
          bg-zinc-50
          py-1.5
          pl-3
          pr-8
          text-xs
          font-semibold
          text-zinc-700
          outline-none
          transition
          hover:border-red-200
          focus:border-red-500
          disabled:cursor-not-allowed
          disabled:opacity-50
          dark:border-white/10
          dark:bg-white/[0.03]
          dark:text-zinc-300
          dark:hover:border-red-500/30
        "
      >
        <option value="student">Student</option>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>

      <ChevronDown
        size={13}
        className="
          pointer-events-none
          absolute
          right-2.5
          top-1/2
          -translate-y-1/2
          text-zinc-400
        "
      />

      {updatingUserId === item.id && (
        <RefreshCw
          size={12}
          className="
            absolute
            -right-5
            top-1/2
            -translate-y-1/2
            animate-spin
            text-red-500
          "
        />
      )}
    </div>
  );
}
