'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Layers,
  Users,
  Activity,
  CheckCircle2,
  Sliders,
  FileCheck2,
  Plus,
  ChevronDown,
  UploadCloud,
  FileText,
} from 'lucide-react';

export default function SchedulerSubNav() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    {
      label: 'Overview',
      href: '/app/social-scheduler',
      active: pathname === '/app/social-scheduler',
      icon: LayoutDashboard,
    },
    {
      label: 'Calendar',
      href: '/app/social-scheduler/calendar',
      active: pathname.startsWith('/app/social-scheduler/calendar'),
      icon: CalendarIcon,
    },
    {
      label: 'Bulk Drafts',
      href: '/app/social-scheduler/bulk',
      active: pathname.startsWith('/app/social-scheduler/bulk'),
      icon: Layers,
    },
    {
      label: 'Review',
      href: '/app/social-scheduler/review',
      active: pathname.startsWith('/app/social-scheduler/review') || pathname.startsWith('/app/social-scheduler/approvals'),
      icon: FileCheck2,
    },
    {
      label: 'Accounts',
      href: '/app/social-accounts',
      active: pathname.startsWith('/app/social-accounts'),
      icon: Users,
    },
    {
      label: 'Health',
      href: '/app/social-scheduler/health',
      active: pathname.startsWith('/app/social-scheduler/health'),
      icon: Activity,
    },
    {
      label: 'Platform QA',
      href: '/app/social-scheduler/qa',
      active: pathname.startsWith('/app/social-scheduler/qa'),
      icon: CheckCircle2,
    },
    {
      label: 'Settings',
      href: '/app/social-scheduler/settings',
      active: pathname.startsWith('/app/social-scheduler/settings'),
      icon: Sliders,
    },
  ];

  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-6 gap-2">
      <div className="flex items-center gap-1 overflow-x-auto py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                tab.active
                  ? 'bg-[#D6B46A]/10 text-[#D6B46A] border border-[#D6B46A]/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create</span>
          <ChevronDown className="h-3 w-3 opacity-80" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <Link
              href="/app/social-scheduler/new"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Create scheduled post</span>
            </Link>
            <Link
              href="/app/social-scheduler/bulk"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              <span>Bulk create drafts</span>
            </Link>
            <Link
              href="/app/social-scheduler/bulk?stage=upload"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <UploadCloud className="h-3.5 w-3.5 text-amber-400" />
              <span>Upload media</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
