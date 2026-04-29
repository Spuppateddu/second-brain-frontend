import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import EntityModalsProvider from "@/components/SecondBrain/EntityModalsProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <EntityModalsProvider>
        <AppShell>{children}</AppShell>
      </EntityModalsProvider>
    </AuthGate>
  );
}
