import { motion } from "framer-motion";
import { Bell, Menu, Moon, Sun } from "lucide-react";

import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/useTheme";

export default function Topbar({ setMobileOpen }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="
      sticky top-0 z-30 h-20
      border-b border-zinc-200
      bg-white/80 backdrop-blur-xl
      dark:border-white/[0.06]
      dark:bg-[#080808]/80
    "
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="
              rounded-lg p-2
              text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900
              dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white
              lg:hidden
            "
          >
            <Menu size={21} />
          </button>

          <div>
            <p
              className="
              text-sm font-semibold text-zinc-900
              dark:text-zinc-100
            "
            >
              CampusONE
            </p>

            <p
              className="
              hidden text-xs text-zinc-500
              dark:text-zinc-600 sm:block
            "
            >
              Campus Support Platform
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="
              relative flex h-10 w-10 items-center justify-center
              rounded-xl
              border border-zinc-200
              bg-zinc-100
              text-zinc-700
              transition-colors
              hover:bg-zinc-200
              dark:border-white/[0.07]
              dark:bg-white/[0.04]
              dark:text-zinc-300
              dark:hover:bg-white/[0.08]
            "
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>

          {/* Notifications */}
          <button
            className="
              relative flex h-10 w-10 items-center justify-center
              rounded-xl
              border border-zinc-200
              bg-zinc-100
              text-zinc-600
              hover:bg-zinc-200
              dark:border-white/[0.07]
              dark:bg-white/[0.04]
              dark:text-zinc-400
              dark:hover:bg-white/[0.08]
            "
          >
            <Bell size={18} />

            <span
              className="
              absolute right-2 top-2
              h-1.5 w-1.5 rounded-full
              bg-red-600
            "
            />
          </button>

          {/* User */}
          <div
            className="
            hidden items-center gap-3 border-l
            border-zinc-200 pl-4
            dark:border-white/[0.07]
            sm:flex
          "
          >
            <div
              className="
              flex h-9 w-9 items-center justify-center
              rounded-full
              bg-red-100
              text-sm font-bold text-red-700
              dark:bg-red-950/40
              dark:text-red-500
            "
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="hidden md:block">
              <p
                className="
                text-sm font-medium text-zinc-900
                dark:text-zinc-200
              "
              >
                {user?.name || "User"}
              </p>

              <p
                className="
                max-w-[180px] truncate text-xs text-zinc-500
                dark:text-zinc-600
              "
              >
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
