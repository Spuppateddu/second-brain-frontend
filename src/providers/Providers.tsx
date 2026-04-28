"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RouterProvider } from "react-aria-components";

import { InactivityLockModal } from "@/components/InactivityLockModal";
import { AuthProvider } from "@/contexts/AuthContext";
import { InactivityProvider } from "@/contexts/InactivityContext";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: { scroll?: boolean };
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <RouterProvider navigate={router.push}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InactivityProvider>
            {children}
            <InactivityLockModal />
          </InactivityProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </RouterProvider>
  );
}
