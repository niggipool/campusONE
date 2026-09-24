import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Flag,
  LayoutList,
  MessageSquare,
  Send,
  Tag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api } from "../services/api";

const categories = [
  "Academic",
  "Hostel",
  "IT Support",
  "Facilities",
  "Finance",
  "Library",
  "Transport",
  "Other",
];

const priorities = [
  {
    value: "low",
    label: "Low",
    description: "Can wait a few days",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Needs attention soon",
  },
  {
    value: "high",
    label: "High",
    description: "Needs attention quickly",
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Requires immediate attention",
  },
];

export default function CreateTicket() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

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

    if (!form.title.trim()) {
      setError("Please enter a ticket title.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please describe your issue.");
      return;
    }

    if (form.description.trim().length < 10) {
      setError("Please provide a little more detail about your issue.");
      return;
    }

    try {
      setSubmitting(true);

      const ticket = await api.post("/api/tickets", {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      });

      setCreatedTicket(ticket);
      setSuccess(true);
    } catch (err) {
      console.error("Create ticket error:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to create your ticket. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnother = () => {
    setForm({
      title: "",
      description: "",
      category: "",
      priority: "medium",
    });

    setCreatedTicket(null);
    setSuccess(false);
    setError("");
  };

  if (success) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="
            w-full overflow-hidden rounded-2xl
            border border-zinc-200
            bg-white
            p-8
            text-center
            shadow-xl shadow-zinc-200/50

            dark:border-white/[0.08]
            dark:bg-[#101010]
            dark:shadow-2xl
            dark:shadow-black/40
          "
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 180,
            }}
            className="
              mx-auto flex h-16 w-16 items-center justify-center
              rounded-2xl
              border border-green-200
              bg-green-50
              text-green-600

              dark:border-green-900/40
              dark:bg-green-950/20
              dark:text-green-500
            "
          >
            <CheckCircle2 size={32} />
          </motion.div>

          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">
            Ticket created successfully
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            Your support request has been submitted. You can track its progress
            from your tickets.
          </p>

          {createdTicket?.ticket_number && (
            <div
              className="
                mx-auto mt-6 inline-flex items-center gap-2
                rounded-xl
                border border-zinc-200
                bg-zinc-50
                px-4 py-2
                text-sm font-medium
                text-zinc-700

                dark:border-white/[0.08]
                dark:bg-white/[0.04]
                dark:text-zinc-300
              "
            >
              <Tag size={15} className="text-red-600" />
              {createdTicket.ticket_number}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="
                flex h-11 items-center justify-center gap-2
                rounded-xl
                border border-zinc-200
                bg-white
                px-5
                text-sm font-medium
                text-zinc-700
                transition

                hover:bg-zinc-50

                dark:border-white/[0.08]
                dark:bg-white/[0.04]
                dark:text-zinc-300
                dark:hover:bg-white/[0.08]
              "
            >
              View my tickets
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={handleCreateAnother}
              className="
                flex h-11 items-center justify-center gap-2
                rounded-xl
                bg-red-700
                px-5
                text-sm font-semibold
                text-white
                shadow-lg shadow-red-900/20
                transition
                hover:bg-red-600

                dark:bg-red-800
                dark:hover:bg-red-700
              "
            >
              Create another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <button
          type="button"
          onClick={() => navigate("/tickets")}
          className="
            mb-5 inline-flex items-center gap-2
            text-sm font-medium
            text-zinc-500
            transition-colors
            hover:text-zinc-900

            dark:text-zinc-500
            dark:hover:text-white
          "
        >
          <ArrowLeft size={16} />
          Back to tickets
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-xl
                  border border-red-200
                  bg-red-50
                  text-red-600

                  dark:border-red-900/40
                  dark:bg-red-950/20
                  dark:text-red-500
                "
              >
                <FileText size={20} />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                Support request
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Create a ticket
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Tell us what you need help with and we'll route your request to
              the right team.
            </p>
          </div>
        </div>
      </motion.div>

      {/* =====================================================
          FORM
      ====================================================== */}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="
              relative overflow-hidden
              rounded-2xl
              border border-zinc-200
              bg-white
              p-6
              shadow-sm
              sm:p-8

              dark:border-white/[0.08]
              dark:bg-[#101010]
              dark:shadow-black/20
            "
          >
            {/* Crimson top line */}
            <div
              className="
                absolute left-0 right-0 top-0
                h-[2px]
                bg-gradient-to-r
                from-transparent
                via-red-700
                to-transparent
              "
            />

            {/* Title */}
            <div className="mb-7">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Issue details
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Provide enough information so the support team can understand
                the issue.
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="
                  mb-6 rounded-xl
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

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-zinc-700
                    dark:text-zinc-300
                  "
                >
                  Subject
                </label>

                <div className="group relative">
                  <MessageSquare
                    size={18}
                    className="
                      absolute left-3.5 top-1/2
                      -translate-y-1/2
                      text-zinc-400
                      transition-colors
                      group-focus-within:text-red-600

                      dark:text-zinc-600
                    "
                  />

                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="What do you need help with?"
                    disabled={submitting}
                    maxLength={200}
                    className="
                      h-12 w-full rounded-xl
                      border border-zinc-200
                      bg-zinc-50
                      pl-11 pr-4
                      text-sm text-zinc-900
                      outline-none
                      transition-all

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

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-zinc-700
                    dark:text-zinc-300
                  "
                >
                  Category
                </label>

                <div className="group relative">
                  <LayoutList
                    size={18}
                    className="
                      pointer-events-none
                      absolute left-3.5 top-1/2
                      -translate-y-1/2
                      text-zinc-400
                      transition-colors
                      group-focus-within:text-red-600

                      dark:text-zinc-600
                    "
                  />

                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    disabled={submitting}
                    className="
                      h-12 w-full
                      appearance-none
                      rounded-xl
                      border border-zinc-200
                      bg-zinc-50
                      pl-11 pr-4
                      text-sm
                      outline-none
                      transition-all

                      text-zinc-900
                      hover:border-zinc-300
                      focus:border-red-700
                      focus:bg-white
                      focus:ring-1
                      focus:ring-red-700/20

                      dark:border-white/[0.08]
                      dark:bg-black/30
                      dark:text-white
                      dark:hover:border-white/[0.12]
                      dark:focus:border-red-800/70
                      dark:focus:bg-white/[0.035]
                      dark:focus:ring-red-900/40

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <option value="">Select a category</option>

                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="description"
                    className="
                      block
                      text-sm font-medium
                      text-zinc-700
                      dark:text-zinc-300
                    "
                  >
                    Description
                  </label>

                  <span className="text-xs text-zinc-400">
                    {form.description.length}/2000
                  </span>
                </div>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the issue in detail. Include relevant dates, locations, error messages, or anything else that might help."
                  disabled={submitting}
                  maxLength={2000}
                  rows={7}
                  className="
                    w-full resize-none rounded-xl
                    border border-zinc-200
                    bg-zinc-50
                    px-4 py-3
                    text-sm leading-relaxed
                    text-zinc-900
                    outline-none
                    transition-all

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
          </motion.div>

          {/* =================================================
              SIDEBAR
          ================================================== */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="space-y-6"
          >
            {/* Priority */}
            <div
              className="
                rounded-2xl
                border border-zinc-200
                bg-white
                p-5
                shadow-sm

                dark:border-white/[0.08]
                dark:bg-[#101010]
              "
            >
              <div className="mb-4 flex items-center gap-2">
                <Flag size={17} className="text-red-600" />

                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Priority
                  </h3>

                  <p className="text-xs text-zinc-500">How urgent is this?</p>
                </div>
              </div>

              <div className="space-y-2">
                {priorities.map((priority) => {
                  const selected = form.priority === priority.value;

                  return (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          priority: priority.value,
                        }))
                      }
                      disabled={submitting}
                      className={`
                        w-full rounded-xl border
                        px-3 py-3
                        text-left
                        transition-all

                        ${
                          selected
                            ? "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-white/[0.06] dark:bg-white/[0.025] dark:hover:border-white/[0.12]"
                        }

                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`
                            text-sm font-medium
                            ${
                              selected
                                ? "text-red-700 dark:text-red-400"
                                : "text-zinc-800 dark:text-zinc-300"
                            }
                          `}
                        >
                          {priority.label}
                        </span>

                        <span
                          className={`
                            h-4 w-4 rounded-full border
                            ${
                              selected
                                ? "border-red-600 bg-red-600"
                                : "border-zinc-300 dark:border-zinc-700"
                            }
                          `}
                        >
                          {selected && (
                            <span className="mx-auto mt-[3px] block h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        {priority.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Helpful information */}
            <div
              className="
                rounded-2xl
                border border-zinc-200
                bg-zinc-50
                p-5

                dark:border-white/[0.06]
                dark:bg-white/[0.025]
              "
            >
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Before submitting
              </h3>

              <ul className="mt-4 space-y-3">
                {[
                  "Choose the category that best matches your issue.",
                  "Include enough detail for staff to investigate.",
                  "Avoid creating duplicate tickets for the same issue.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-xs leading-relaxed text-zinc-500"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={!submitting ? { scale: 1.015 } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
              className="
                flex h-12 w-full
                items-center justify-center
                gap-2
                rounded-xl
                bg-red-700
                px-5
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
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit ticket
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
