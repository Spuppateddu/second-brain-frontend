"use client";

import Link from "next/link";
import { HiEnvelope, HiHeart } from "react-icons/hi2";

import ApplicationLogo from "@/components/ApplicationLogo";
import { env } from "@/lib/env";

const CONTACT_EMAIL = "alessiogedda@yahoo.com";

export default function Footer() {
  const year = new Date().getFullYear();
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `I want to try ${env.appName}`,
  )}`;

  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <ApplicationLogo className="h-8 w-8" />
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {env.appName}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              Personal knowledge system to organize notes, plan your time and
              keep your second brain in one place.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Try this site
            </h3>
            <p className="mt-3 text-sm">
              Want a test account? Send me an email and I&apos;ll set you up.
            </p>
            <a
              href={mailto}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            >
              <HiEnvelope className="h-4 w-4" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-6 text-xs sm:flex-row dark:border-zinc-800">
          <p className="flex items-center gap-1">
            © {year} {env.appName}. Built with
            <HiHeart className="h-3 w-3 text-rose-500" />
            for organized thinking.
          </p>
          <p className="text-zinc-500">
            <a
              href={mailto}
              className="hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Contact
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
