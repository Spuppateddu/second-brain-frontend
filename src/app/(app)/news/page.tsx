"use client";

import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  CardGrid,
  EntityListShell,
} from "@/components/EntityListShell";
import { api } from "@/lib/api";
import { heavyKeys, useRssFeeds, useRssNews } from "@/lib/queries/heavy";
import type { RssNewsItem } from "@/types/heavy";

const DATE = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function NewsRow({ item }: { item: RssNewsItem }) {
  const queryClient = useQueryClient();
  const toggleRead = useMutation({
    mutationFn: async () => {
      await api.patch(`/rss-news/${item.id}/toggle-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.rssNews });
    },
  });

  return (
    <li
      className={[
        "flex items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950",
        item.is_read ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <a
          href={item.link ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate font-medium hover:underline"
        >
          {item.title}
        </a>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {item.rss_feed ? <span>{item.rss_feed.name}</span> : null}
          {item.published_at ? (
            <span>{DATE.format(new Date(item.published_at))}</span>
          ) : null}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        isDisabled={toggleRead.isPending}
        onClick={() => toggleRead.mutate()}
      >
        {item.is_read ? "Unread" : "Mark read"}
      </Button>
    </li>
  );
}

export default function NewsPage() {
  const news = useRssNews();
  const feeds = useRssFeeds();
  const queryClient = useQueryClient();

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.post("/rss-news/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.rssNews });
    },
  });

  const items = news.data?.items ?? [];
  const feedList = feeds.data?.feeds ?? [];

  return (
    <EntityListShell
      title="News"
      description={`${feedList.length} feed${feedList.length === 1 ? "" : "s"} tracked.`}
      isLoading={news.isLoading || feeds.isLoading}
      error={news.error || feeds.error}
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Latest ({items.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              isDisabled={markAllRead.isPending || items.length === 0}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">No news items right now.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <NewsRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Feeds ({feedList.length})
          </h2>
          <CardGrid>
            {feedList.map((entry) => (
              <Card key={entry.id}>
                <div className="font-medium">{entry.rss_feed.name}</div>
                <a
                  href={entry.rss_feed.website_url ?? entry.rss_feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-primary hover:underline"
                >
                  {entry.rss_feed.website_url ?? entry.rss_feed.url}
                </a>
                {entry.rss_feed.description ? (
                  <p className="line-clamp-2 text-sm text-zinc-500">
                    {entry.rss_feed.description}
                  </p>
                ) : null}
                <span className="text-xs text-zinc-500">
                  {entry.is_active ? "active" : "paused"}
                </span>
              </Card>
            ))}
          </CardGrid>
        </section>
      </div>
    </EntityListShell>
  );
}
