"use client"

import Link from "next/link"

export function TopMenu() {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-warm-gray/20 backdrop-blur-md bg-white/70 supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-charcoal text-alabaster">
            <span className="text-sm font-bold">P</span>
          </div>
          <span className="text-xl font-bold text-charcoal">Pulse</span>
        </Link>
      </div>
    </div>
  )
}
