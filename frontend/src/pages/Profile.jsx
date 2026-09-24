import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  ShieldCheck,
  CalendarDays,
  Copy,
  Check,
  LogOut,
  LockKeyhole,
} from "lucide-react";

import { useAuth } from "../context/useAuth";

const roleConfig = {
  student: {
    label: "Student",
    className:
      "bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400",
  },
  staff: {
    label: "Staff",
    className:
      "bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/20 dark:text-violet-400",
  },
  admin: {
    label: "Administrator",
    className:
      "bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/20 dark:text-red-400",
  },
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function Profile() {
  const { user, logout } = useAuth();
  console.log(user)
  const [copied, setCopied] = useState(false);

  const role = roleConfig[user?.role] || roleConfig.student;

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  const copyEmail = async () => {
    if (!user?.email) return;

    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Failed to copy email:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-5xl"
    >
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600 dark:text-red-500">
          Account
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Profile
        </h1>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          View your CampusONE account information and access details.
        </p>
      </div>

      {/* Profile Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="relative mb-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#101010] dark:shadow-none"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-red-800 to-red-950 text-2xl font-bold text-white shadow-xl shadow-red-950/20">
                {initials}
              </div>

              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-emerald-500 dark:border-[#101010]">
                <span className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {user.name}
                </h2>

                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${role.className}`}
                >
                  <ShieldCheck size={13} className="mr-1.5" />
                  {role.label}
                </span>
              </div>

              <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Mail size={15} />
                {user.email}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
               

                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active account
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account Information */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSection
          icon={User}
          title="Personal information"
          description="Basic information associated with your CampusONE account."
        >
          <InfoRow label="Full name" value={user.name || "—"} icon={User} />

          <InfoRow
            label="Email address"
            value={user.email || "—"}
            icon={Mail}
            action={
              user.email ? (
                <button
                  onClick={copyEmail}
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-white/[0.05] dark:hover:text-red-400"
                  title="Copy email"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              ) : null
            }
          />

          <InfoRow label="User ID" value={`#${user.id}`} icon={ShieldCheck} />
        </ProfileSection>

        <ProfileSection
          icon={ShieldCheck}
          title="Access & role"
          description="Your current role determines what you can access in CampusONE."
        >
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.025]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Current role
                </p>

                <p className="mt-1 text-base font-bold text-zinc-900 dark:text-white">
                  {role.label}
                </p>
              </div>

              <span
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${role.className}`}
              >
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-white/[0.06]">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <LockKeyhole size={17} />
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Role-based access
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Your permissions are controlled by your assigned CampusONE role.
              </p>
            </div>
          </div>
        </ProfileSection>
      </div>

      {/* Account Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.12 }}
        className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#101010] dark:shadow-none"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Account actions
            </h3>

            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Sign out of your current CampusONE session.
            </p>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-500/30 hover:bg-red-500/15 dark:text-red-400"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProfileSection({ icon: Icon, title, description, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#101010] dark:shadow-none"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

function InfoRow({ label, value, icon: Icon, action }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.025]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400">
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-200">
          {value}
        </p>
      </div>

      {action}
    </div>
  );
}
