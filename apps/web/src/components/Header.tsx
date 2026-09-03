'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, LayoutDashboard, Send, Radio, Settings } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Posts', href: '/posts', icon: Send },
    { label: 'Connected Accounts', href: '/social-accounts', icon: Radio },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative h-8 w-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden transition-colors group-hover:border-indigo-500/50">
            <div className="h-3.5 w-3.5 border-2 border-indigo-400 rotate-45" />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent pointer-events-none" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider text-white uppercase">
                Sakhaa Scheduler
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                MVP
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Publishing Core
            </span>
          </div>
        </Link>

        <div className="hidden md:block h-6 w-px bg-white/10" />

        {/* Worker Status Pill */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Railway Worker: Active</span>
        </div>
      </div>

      {/* Center: Navigation */}
      <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-white/5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/posts/new"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Post</span>
        </Link>
      </div>
    </header>
  );
}
