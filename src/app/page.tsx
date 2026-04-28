"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import ApplicationLogo from "@/components/ApplicationLogo";
import { Button } from "@/components/UI";
import { useAuth } from "@/contexts/AuthContext";

export default function Welcome() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/calendar");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-zinc-500">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <ApplicationLogo className="h-10 w-10" />
          <span className="text-xl font-bold text-gray-900">SecondBrain</span>
        </div>
        <div className="flex space-x-4">
          <Link href="/login">
            <Button variant="primary">Login</Button>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Digital
              <span className="text-indigo-600"> Second Brain</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Organize your thoughts, manage your tasks, and build your
              knowledge base. Transform daily chaos into structured productivity
              with our intelligent note-taking system.
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="border-t border-slate-600 mt-8 pt-8 text-center">
            <p className="text-slate-300">
              © 2024 SecondBrain. Your digital companion for organized
              thinking.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
