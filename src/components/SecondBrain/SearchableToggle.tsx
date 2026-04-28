"use client";

import { FaEye, FaEyeSlash } from "react-icons/fa";

interface SearchableToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export default function SearchableToggle({
  value,
  onChange,
}: SearchableToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={[
          "rounded-lg p-2 transition-colors",
          value
            ? "bg-sky-100 text-sky-500 dark:bg-sky-900/30"
            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
        ].join(" ")}
      >
        {value ? (
          <FaEye className="h-5 w-5" />
        ) : (
          <FaEyeSlash className="h-5 w-5" />
        )}
      </button>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {value ? "Visible in spotlight" : "Hidden from spotlight"}
      </span>
    </div>
  );
}
