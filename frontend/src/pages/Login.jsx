import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Moon, Sun } from "lucide-react";

import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Where the user was trying to go before being redirected to login.
  const from = location.state?.from?.pathname || "/";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);

      await login(form.email.trim(), form.password);

      navigate(from, { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Invalid email or password.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="
        relative min-h-screen overflow-hidden
        bg-zinc-50 text-zinc-900
        transition-colors duration-500
        dark:bg-[#080808] dark:text-white
      "
    >
      {/* =====================================================
          THEME TOGGLE
      ====================================================== */}

      <motion.button
        type="button"
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="
          absolute right-5 top-5 z-30
          flex h-10 w-10 items-center justify-center
          rounded-xl
          border border-zinc-200
          bg-white/80
          text-zinc-600
          shadow-sm
          backdrop-blur
          transition-all duration-300

          hover:bg-zinc-100
          hover:text-zinc-900

          dark:border-white/[0.08]
          dark:bg-white/[0.04]
          dark:text-zinc-400
          dark:shadow-none
          dark:hover:bg-white/[0.08]
          dark:hover:text-white
        "
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </motion.button>

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      {/* Top crimson glow */}
      <motion.div
        className="
          pointer-events-none absolute
          left-1/2 top-[-18rem]
          h-[42rem] w-[42rem]
          -translate-x-1/2
          rounded-full
          bg-red-600/10
          blur-[150px]
          dark:bg-red-900/20
        "
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Bottom crimson glow */}
      <motion.div
        className="
          pointer-events-none absolute
          bottom-[-18rem] left-[-10rem]
          h-[35rem] w-[35rem]
          rounded-full
          bg-red-600/[0.06]
          blur-[140px]
          dark:bg-red-950/20
        "
        animate={{
          x: [0, 40, 0],
          y: [0, -25, 0],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Right crimson glow */}
      <motion.div
        className="
          pointer-events-none absolute
          right-[-12rem] top-1/3
          h-[28rem] w-[28rem]
          rounded-full
          bg-red-600/[0.04]
          blur-[130px]
          dark:bg-red-900/10
        "
        animate={{
          x: [0, -30, 0],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle grid */}
      <div
        className="
          pointer-events-none absolute inset-0
          opacity-[0.025]
          dark:opacity-[0.025]
        "
        style={{
          backgroundImage:
            "linear-gradient(rgba(80,80,80,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(80,80,80,0.7) 1px, transparent 1px)",
          backgroundSize: "45px 45px",
        }}
      />

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="w-full max-w-md"
        >
          {/* =================================================
              BRAND
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: -15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.15,
              duration: 0.5,
            }}
            className="mb-8 text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                delay: 0.2,
                duration: 0.45,
                type: "spring",
                stiffness: 180,
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 35px rgba(139, 0, 0, 0.35)",
              }}
              className="
                mx-auto mb-5
                flex h-16 w-16
                cursor-default
                items-center justify-center
                rounded-2xl
                border
                border-red-200
                bg-red-50
                shadow-xl shadow-red-100/50

                dark:border-red-900/40
                dark:bg-red-950/20
                dark:shadow-2xl
                dark:shadow-red-950/20
              "
            >
              <span className="text-2xl font-black tracking-tight text-red-600 dark:text-red-600">
                C
              </span>
            </motion.div>

            {/* Brand */}
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              CAMPUS
              <span className="text-red-700">ONE</span>
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Your campus. One platform.
            </p>
          </motion.div>

          {/* =================================================
              LOGIN CARD
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
              duration: 0.55,
            }}
            className="
              relative overflow-hidden
              rounded-2xl
              border border-zinc-200
              bg-white/90
              p-6
              shadow-xl shadow-zinc-200/50
              backdrop-blur-xl
              transition-colors duration-500
              sm:p-8

              dark:border-white/[0.08]
              dark:bg-[#101010]/90
              dark:shadow-2xl
              dark:shadow-black/50
            "
          >
            {/* Top red line */}
            <motion.div
              initial={{
                scaleX: 0,
              }}
              animate={{
                scaleX: 1,
              }}
              transition={{
                delay: 0.45,
                duration: 0.7,
                ease: "easeOut",
              }}
              className="
                absolute left-0 right-0 top-0
                h-[2px]
                origin-left
                bg-gradient-to-r
                from-transparent
                via-red-700
                to-transparent
              "
            />

            {/* Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Sign in to continue to your CampusONE account.
              </p>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.25,
                }}
                className="
                  mb-5
                  rounded-xl
                  border border-red-200
                  bg-red-50
                  px-4 py-3
                  text-sm text-red-600

                  dark:border-red-900/40
                  dark:bg-red-950/30
                  dark:text-red-400
                "
              >
                {error}
              </motion.div>
            )}

            {/* =================================================
                FORM
            ================================================== */}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-zinc-700
                    dark:text-zinc-300
                  "
                >
                  Email
                </label>

                <div className="group relative">
                  <Mail
                    size={18}
                    className="
                      absolute left-3.5 top-1/2
                      -translate-y-1/2
                      text-zinc-400
                      transition-colors
                      group-focus-within:text-red-600

                      dark:text-zinc-600
                      dark:group-focus-within:text-red-600
                    "
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    disabled={submitting}
                    className="
                      h-12 w-full rounded-xl
                      border border-zinc-200
                      bg-zinc-50
                      pl-11 pr-4
                      text-sm text-zinc-900
                      outline-none
                      transition-all duration-200
                      placeholder:text-zinc-400
                      hover:border-zinc-300
                      focus:border-red-700
                      focus:bg-white
                      focus:ring-1
                      focus:ring-red-700/20

                      dark:border-white/[0.08]
                      dark:bg-black/30
                      dark:text-white
                      dark:placeholder:text-zinc-700
                      dark:hover:border-white/[0.12]
                      dark:focus:border-red-800/70
                      dark:focus:bg-white/[0.035]
                      dark:focus:ring-red-900/40

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="
                      block text-sm font-medium
                      text-zinc-700
                      dark:text-zinc-300
                    "
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="
                      text-xs
                      text-zinc-500
                      transition-colors
                      hover:text-red-600

                      dark:text-zinc-600
                      dark:hover:text-red-500
                    "
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="group relative">
                  <Lock
                    size={18}
                    className="
                      absolute left-3.5 top-1/2
                      -translate-y-1/2
                      text-zinc-400
                      transition-colors
                      group-focus-within:text-red-600

                      dark:text-zinc-600
                      dark:group-focus-within:text-red-600
                    "
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={submitting}
                    className="
                      h-12 w-full rounded-xl
                      border border-zinc-200
                      bg-zinc-50
                      pl-11 pr-12
                      text-sm text-zinc-900
                      outline-none
                      transition-all duration-200
                      placeholder:text-zinc-400
                      hover:border-zinc-300
                      focus:border-red-700
                      focus:bg-white
                      focus:ring-1
                      focus:ring-red-700/20

                      dark:border-white/[0.08]
                      dark:bg-black/30
                      dark:text-white
                      dark:placeholder:text-zinc-700
                      dark:hover:border-white/[0.12]
                      dark:focus:border-red-800/70
                      dark:focus:bg-white/[0.035]
                      dark:focus:ring-red-900/40

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    disabled={submitting}
                    className="
                      absolute right-3.5 top-1/2
                      -translate-y-1/2
                      text-zinc-400
                      transition-colors
                      hover:text-zinc-700

                      dark:text-zinc-600
                      dark:hover:text-zinc-300

                      disabled:opacity-40
                    "
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* =================================================
                  SUBMIT
              ================================================== */}

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={
                  !submitting
                    ? {
                        scale: 1.015,
                        boxShadow: "0 0 30px rgba(139, 0, 0, 0.3)",
                      }
                    : {}
                }
                whileTap={
                  !submitting
                    ? {
                        scale: 0.98,
                      }
                    : {}
                }
                transition={{
                  duration: 0.2,
                }}
                className="
                  group
                  mt-2
                  flex h-12 w-full
                  items-center justify-center
                  gap-2
                  rounded-xl
                  bg-red-700
                  px-4
                  text-sm font-semibold
                  text-white
                  shadow-lg
                  shadow-red-900/20
                  transition-colors

                  hover:bg-red-600

                  dark:bg-red-800
                  dark:shadow-red-950/30
                  dark:hover:bg-red-700

                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {submitting ? (
                  <>
                    <span
                      className="
                        h-4 w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-white/30
                        border-t-white
                      "
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight
                      size={17}
                      className="
                        transition-transform
                        duration-200
                        group-hover:translate-x-1
                      "
                    />
                  </>
                )}
              </motion.button>
            </form>

            {/* =================================================
                REGISTER
            ================================================== */}

            <div
              className="
                mt-7
                border-t
                border-zinc-200
                pt-6
                text-center

                dark:border-white/[0.07]
              "
            >
              <p className="text-sm text-zinc-500 dark:text-zinc-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="
                    font-medium
                    text-red-600
                    transition-colors
                    hover:text-red-500
                  "
                >
                  Create one
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.6,
              duration: 0.5,
            }}
            className="
              mt-6
              text-center
              text-xs
              text-zinc-400

              dark:text-zinc-700
            "
          >
            CAMPUSONE · CAMPUS MANAGEMENT PLATFORM
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
