import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  Ticket,
  Users,
  UserCircle,
  LogOut,
  X,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();

  const navigation = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Tickets",
      path: "/tickets",
      icon: Ticket,
    },
    ...(user?.role === "admin"
      ? [
          {
            label: "Users",
            path: "/users",
            icon: Users,
          },
        ]
      : []),
    {
      label: "Profile",
      path: "/profile",
      icon: UserCircle,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileOpen(false)}
          className="
            fixed inset-0 z-40
            bg-black/40 backdrop-blur-sm
            dark:bg-black/70
            lg:hidden
          "
        />
      )}

      <motion.aside
        initial={{ x: -20, opacity: 1 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-64 flex-col
          border-r border-zinc-200
          bg-white
          shadow-sm
          transition-colors duration-300
          dark:border-white/[0.07]
          dark:bg-[#0b0b0b]
          dark:shadow-none
          lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div
          className="
            flex h-20 items-center justify-between
            border-b border-zinc-200
            px-6
            dark:border-white/[0.07]
          "
        >
          <div>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
              CAMPUS
              <span className="text-red-700">ONE</span>
            </h1>

            <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-600">
              Campus Platform
            </p>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="
              rounded-lg p-2
              text-zinc-500
              transition
              hover:bg-zinc-100 hover:text-zinc-900
              dark:hover:bg-white/5 dark:hover:text-white
              lg:hidden
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-600">
            Workspace
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className="relative block"
              >
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15 }}
                    className={`
                      relative flex items-center gap-3
                      rounded-xl px-3 py-3
                      text-sm font-medium
                      transition-all

                      ${
                        isActive
                          ? `
                            bg-red-50 text-red-700
                            dark:bg-red-950/30 dark:text-red-500
                          `
                          : `
                            text-zinc-600
                            hover:bg-zinc-100
                            hover:text-zinc-900
                            dark:text-zinc-500
                            dark:hover:bg-white/[0.035]
                            dark:hover:text-zinc-200
                          `
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-sidebar"
                        className="
                          absolute left-0 top-2 bottom-2
                          w-0.5 rounded-full
                          bg-red-700
                        "
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}

                    <Icon size={18} />

                    <span>{item.label}</span>
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div
          className="
            border-t border-zinc-200
            p-3
            dark:border-white/[0.07]
          "
        >
          <div
            className="
              mb-2 flex items-center gap-3
              rounded-xl px-3 py-3
            "
          >
            <div
              className="
                flex h-9 w-9 shrink-0 items-center
                justify-center rounded-full
                bg-red-100
                text-sm font-bold text-red-700
                dark:bg-red-950/40
                dark:text-red-500
              "
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {user?.name || "User"}
              </p>

              <p className="truncate text-xs text-zinc-500 dark:text-zinc-600">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="
              flex w-full items-center gap-3
              rounded-xl px-3 py-3
              text-sm font-medium
              text-zinc-600
              transition
              hover:bg-red-50
              hover:text-red-600
              dark:text-zinc-500
              dark:hover:bg-red-950/20
              dark:hover:text-red-500
            "
          >
            <LogOut size={18} />
            Sign out
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}
