"use client";

import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  CardGrid,
  EntityListShell,
  TagChip,
} from "@/components/EntityListShell";
import { EditLink, NewEntityButton } from "@/components/EntityListHeader";
import { ListSearchInput, useTextFilter } from "@/components/ListSearch";
import { api } from "@/lib/api";
import { entityKeys, useWishlist } from "@/lib/queries/entities";

export default function WishlistPage() {
  const { data, isLoading, error } = useWishlist();
  const queryClient = useQueryClient();
  const items = data ?? [];
  const { query, setQuery, filtered } = useTextFilter(
    items,
    (i) => `${i.name} ${i.notes ?? ""}`,
  );

  const togglePurchased = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/wishlist/${id}/toggle-purchased`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.wishlist });
    },
  });

  return (
    <EntityListShell
      title="Wishlist"
      isLoading={isLoading}
      error={error}
      empty={items.length === 0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex-1 min-w-[200px]">
            <ListSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter items…"
              count={filtered.length}
              total={items.length}
            />

          </div>
          <NewEntityButton href="/wishlist/new" label="New item" />

        </div>
        <CardGrid>
          {filtered.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <span
                  className={[
                    "font-medium",
                    item.is_purchased ? "text-zinc-400 line-through" : "",
                  ].join(" ")}
                >
                  {item.name}
                </span>
                <EditLink href={`/wishlist/${item.id}`} />
              </div>
              {item.notes ? (
                <p className="line-clamp-2 text-sm text-zinc-500">
                  {item.notes}
                </p>
              ) : null}
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-primary hover:underline"
                >
                  {item.link}
                </a>
              ) : null}
              {item.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <TagChip key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                </div>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                isDisabled={togglePurchased.isPending}
                onClick={() => togglePurchased.mutate(item.id)}
              >
                {item.is_purchased ? "Mark unpurchased" : "Mark purchased"}
              </Button>
            </Card>
          ))}
        </CardGrid>
      </div>
    </EntityListShell>
  );
}
