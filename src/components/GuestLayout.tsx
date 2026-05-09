"use client";

import Link from "next/link";
import { PropsWithChildren } from "react";

import ApplicationLogo from "@/components/ApplicationLogo";
import Footer from "@/components/Footer";

export default function GuestLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <div className="flex flex-1 flex-col items-center pt-6 sm:justify-center sm:pt-0">
        <div>
          <Link href="/">
            <ApplicationLogo className="h-20 w-20" />
          </Link>
        </div>

        <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
