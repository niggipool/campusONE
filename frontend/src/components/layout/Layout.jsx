import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div
      className="
  min-h-screen
  bg-zinc-50 text-zinc-900
  transition-colors duration-300
  dark:bg-[#080808] dark:text-white
"
    >
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="lg:pl-64">
        <Topbar setMobileOpen={setMobileOpen} />

        <AnimatePresence mode="sync" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -5,
            }}
            transition={{
              duration: 0.1,
              ease: "easeOut",
            }}
            className="
    min-h-[calc(100vh-5rem)]
    bg-white
    p-4
    text-black
    transition-colors
    duration-300
    dark:bg-[#080808]
    dark:text-white
    sm:p-6
    lg:p-8
  "
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
