"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownTrigger,
} from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HiBars3,
  HiBeaker,
  HiCalendarDays,
  HiChatBubbleLeftRight,
  HiChevronDown,
  HiCurrencyDollar,
  HiDocumentText,
  HiFunnel,
  HiHome,
  HiMagnifyingGlass,
  HiNewspaper,
  HiPlayCircle,
  HiTag,
  HiVideoCamera,
  HiXMark,
} from "react-icons/hi2";

import ApplicationLogo from "@/components/ApplicationLogo";
import { FastNoteModal } from "@/components/FastNoteModal";
import { PushNotificationBell } from "@/components/PushNotificationBell";
import { SpotlightSearch } from "@/components/SpotlightSearch";
import { useAuth } from "@/contexts/AuthContext";
import { env } from "@/lib/env";

type Icon = React.ComponentType<{ className?: string }>;

type NavLink = {
  href: string;
  label: string;
  icon?: Icon;
  iconColor?: string;
  privilege?: string;
};

type NavEntry =
  | {
      type: "link";
      href: string;
      label: string;
      icon?: Icon;
      iconColor?: string;
      privilege?: string;
    }
  | {
      type: "group";
      label: string;
      icon?: Icon;
      iconColor?: string;
      privilege?: string;
      items: NavLink[];
    };

const NAV: NavEntry[] = [
  {
    type: "link",
    href: "/calendar",
    label: "Calendar",
    icon: HiCalendarDays,
    iconColor: "text-sky-500 dark:text-sky-400",
  },
  {
    type: "group",
    label: "Planning",
    icon: HiCalendarDays,
    iconColor: "text-violet-500 dark:text-violet-400",
    items: [
      {
        href: "/planning",
        label: "Plannings",
        icon: HiCalendarDays,
        iconColor: "text-violet-500 dark:text-violet-400",
      },
      {
        href: "/out-of-plan",
        label: "Out of Plan",
        icon: HiFunnel,
        iconColor: "text-orange-500 dark:text-orange-400",
      },
      {
        href: "/reviews",
        label: "Reviews",
        icon: HiChatBubbleLeftRight,
        iconColor: "text-pink-500 dark:text-pink-400",
      },
    ],
  },
  {
    type: "link",
    href: "/second-brain",
    label: "Second Brain",
    icon: HiHome,
    iconColor: "text-fuchsia-500 dark:text-fuchsia-400",
  },
  {
    type: "group",
    label: "Media",
    icon: HiPlayCircle,
    iconColor: "text-rose-500 dark:text-rose-400",
    items: [
      {
        href: "/media",
        label: "Media Tasks",
        icon: HiPlayCircle,
        iconColor: "text-rose-500 dark:text-rose-400",
      },
      {
        href: "/youtube",
        label: "YouTube",
        icon: HiPlayCircle,
        iconColor: "text-red-500 dark:text-red-400",
        privilege: "youtube_track",
      },
      {
        href: "/twitch",
        label: "Twitch",
        icon: HiVideoCamera,
        iconColor: "text-purple-500 dark:text-purple-400",
        privilege: "twitch_track",
      },
      {
        href: "/news",
        label: "News",
        icon: HiNewspaper,
        iconColor: "text-blue-500 dark:text-blue-400",
        privilege: "rss_news",
      },
    ],
  },
  {
    type: "group",
    label: "Task",
    icon: HiDocumentText,
    iconColor: "text-emerald-500 dark:text-emerald-400",
    items: [
      {
        href: "/auto-tasks",
        label: "Auto Tasks",
        icon: HiFunnel,
        iconColor: "text-emerald-500 dark:text-emerald-400",
      },
      {
        href: "/event-tasks",
        label: "Event Tasks",
        icon: HiCalendarDays,
        iconColor: "text-teal-500 dark:text-teal-400",
      },
      {
        href: "/pills",
        label: "Pills",
        icon: HiBeaker,
        iconColor: "text-green-500 dark:text-green-400",
      },
      {
        href: "/task-categories",
        label: "Categorie Task",
        icon: HiTag,
        iconColor: "text-lime-500 dark:text-lime-400",
      },
    ],
  },
  {
    type: "group",
    label: "Cashflow",
    icon: HiCurrencyDollar,
    iconColor: "text-amber-500 dark:text-amber-400",
    privilege: "cashflow_track",
    items: [
      {
        href: "/cashflow",
        label: "Cashflow",
        icon: HiCurrencyDollar,
        iconColor: "text-amber-500 dark:text-amber-400",
      },
      {
        href: "/cashflow-options",
        label: "Cashflow Options",
        icon: HiTag,
        iconColor: "text-yellow-600 dark:text-yellow-400",
      },
      {
        href: "/budgets",
        label: "Budgets",
        icon: HiCurrencyDollar,
        iconColor: "text-orange-500 dark:text-orange-400",
      },
      {
        href: "/subscriptions",
        label: "Subscriptions",
        icon: HiCurrencyDollar,
        iconColor: "text-amber-600 dark:text-amber-300",
      },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/calendar": "Calendar",
  "/planning": "Planning",
  "/out-of-plan": "Out of Plan",
  "/reviews": "Reviews",
  "/second-brain": "Second Brain",
  "/media": "Media",
  "/youtube": "YouTube",
  "/twitch": "Twitch",
  "/news": "News",
  "/auto-tasks": "Auto Tasks",
  "/event-tasks": "Event Tasks",
  "/pills": "Pills",
  "/task-categories": "Task Categories",
  "/cashflow": "Cashflow",
  "/cashflow-options": "Cashflow Options",
  "/budgets": "Budgets",
  "/subscriptions": "Subscriptions",
  "/profile": "Profile",
  "/persons": "Persons",
  "/notes": "Notes",
  "/note-categories": "Note Categories",
  "/bookmarks": "Bookmarks",
  "/bookmark-categories": "Bookmark Categories",
  "/tags": "Tags",
  "/bags": "Bags",
  "/hardware": "Hardware",
  "/software": "Software",
  "/mega-files": "Mega Files",
  "/places": "Places",
  "/recipes": "Recipes",
  "/trips": "Trips",
  "/wishlist": "Wishlist",
  "/untagged": "Untagged",
};

function pageTitleFor(pathname: string): string | null {
  const firstSegment = "/" + (pathname.split("/")[1] ?? "");
  return PAGE_TITLES[firstSegment] ?? null;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

const linkClasses = (active: boolean) =>
  [
    "inline-flex items-center border-b-2 px-1 pt-1 pb-1 text-sm font-medium leading-5 transition focus:outline-none",
    active
      ? "border-indigo-400 text-zinc-900 dark:text-zinc-100"
      : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300",
  ].join(" ");

const dropdownItemClasses =
  "flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 outline-none";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, privileges, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fastNoteOpen, setFastNoteOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    const pageTitle = pageTitleFor(pathname);
    document.title = pageTitle ? `${env.appName} - ${pageTitle}` : env.appName;
  }, [pathname]);

  const hasPrivilege = (privilege?: string) =>
    !privilege || privileges.includes(privilege);

  const allowed = NAV.flatMap<NavEntry>((entry) => {
    if (!hasPrivilege(entry.privilege)) return [];
    if (entry.type === "link") return [entry];
    const items = entry.items.filter((item) => hasPrivilege(item.privilege));
    if (items.length === 0) return [];
    return [{ ...entry, items }];
  });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center">
            <button
              type="button"
              onClick={() => setFastNoteOpen(true)}
              className="shrink-0 transition-opacity hover:opacity-80"
              aria-label="Open Fast Note"
            >
              <ApplicationLogo className="block h-12 w-auto" />
            </button>

            <div className="hidden lg:ms-10 lg:flex lg:items-center lg:gap-7">
              {allowed.map((entry) => {
                if (entry.type === "link") {
                  const active = isActive(pathname, entry.href);
                  const Icon = entry.icon;
                  return (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      className={linkClasses(active)}
                    >
                      {Icon && (
                        <Icon
                          className={`me-2 h-4 w-4 ${entry.iconColor ?? ""}`}
                        />
                      )}
                      {entry.label}
                    </Link>
                  );
                }
                const active = entry.items.some((item) =>
                  isActive(pathname, item.href),
                );
                const Icon = entry.icon;
                return (
                  <Dropdown key={entry.label}>
                    <DropdownTrigger
                      className={`${linkClasses(active)} group cursor-pointer`}
                    >
                      {Icon && (
                        <Icon
                          className={`me-2 h-4 w-4 ${entry.iconColor ?? ""}`}
                        />
                      )}
                      <span>{entry.label}</span>
                      <HiChevronDown className="ms-1 h-4 w-4 transition-transform duration-200 group-data-[expanded=true]:rotate-180" />
                    </DropdownTrigger>
                    <DropdownPopover className="min-w-56 rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                      <DropdownMenu className="outline-none">
                        {entry.items.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <DropdownItem
                              key={item.href}
                              href={item.href}
                              className={dropdownItemClasses}
                            >
                              {ItemIcon && (
                                <ItemIcon
                                  className={`h-4 w-4 ${item.iconColor ?? "text-zinc-400"}`}
                                />
                              )}
                              <span>{item.label}</span>
                            </DropdownItem>
                          );
                        })}
                      </DropdownMenu>
                    </DropdownPopover>
                  </Dropdown>
                );
              })}

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={linkClasses(false)}
              >
                <HiMagnifyingGlass className="me-2 h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                Search
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <HiMagnifyingGlass className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
            </button>
            <PushNotificationBell />
            <div className="hidden lg:block">
              <Dropdown>
                <DropdownTrigger className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                  {user?.name ?? "Account"}
                  <HiChevronDown className="ms-2 h-4 w-4" />
                </DropdownTrigger>
                <DropdownPopover className="min-w-44 rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                  <DropdownMenu className="outline-none">
                    <DropdownItem
                      href="/profile"
                      className={dropdownItemClasses}
                    >
                      Profile
                    </DropdownItem>
                    <DropdownItem
                      onAction={() => logout()}
                      className={dropdownItemClasses}
                    >
                      Log out
                    </DropdownItem>
                  </DropdownMenu>
                </DropdownPopover>
              </Dropdown>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              {mobileOpen ? (
                <HiXMark className="h-6 w-6" />
              ) : (
                <HiBars3 className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-zinc-200 lg:hidden dark:border-zinc-800">
            <div className="space-y-4 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(true);
                  closeMobile();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <HiMagnifyingGlass className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                Search
              </button>
              {allowed.map((entry) => {
                if (entry.type === "link") {
                  const active = isActive(pathname, entry.href);
                  const Icon = entry.icon;
                  return (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      onClick={closeMobile}
                      className={[
                        "flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium",
                        active
                          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                      ].join(" ")}
                    >
                      {Icon && (
                        <Icon
                          className={`h-4 w-4 ${entry.iconColor ?? ""}`}
                        />
                      )}
                      {entry.label}
                    </Link>
                  );
                }
                return (
                  <div key={entry.label} className="space-y-1">
                    <div className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {entry.label}
                    </div>
                    {entry.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMobile}
                          className={[
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                            active
                              ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                          ].join(" ")}
                        >
                          {Icon && (
                            <Icon
                              className={`h-4 w-4 ${item.iconColor ?? "text-zinc-400"}`}
                            />
                          )}
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <Link
                  href="/profile"
                  onClick={closeMobile}
                  className="block rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                >
                  {user?.name ?? "Profile"}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    closeMobile();
                    logout();
                  }}
                  fullWidth
                  className="mt-2"
                >
                  Log out
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 overflow-y-auto">{children}</main>

      <SpotlightSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        showTrigger={false}
      />
      <FastNoteModal
        open={fastNoteOpen}
        onClose={() => setFastNoteOpen(false)}
      />
    </div>
  );
}
