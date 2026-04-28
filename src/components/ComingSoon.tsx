"use client";

export function ComingSoon({
  title,
  apiPath,
}: {
  title: string;
  apiPath: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-prose text-sm text-zinc-500">
        This page hasn&rsquo;t been ported yet. The backend already exposes the
        JSON endpoints under{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
          {apiPath}
        </code>
        . Build the UI for it the same way <code>/calendar</code> and{" "}
        <code>/profile</code> are wired: a TanStack Query hook in{" "}
        <code>src/lib/queries</code>, types in <code>src/types</code>, and a{" "}
        <code>page.tsx</code> here.
      </p>
    </div>
  );
}
