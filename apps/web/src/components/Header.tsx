'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, ChevronDown, Check, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { sprint1Storage } from '../lib/mock-storage';
import { Workspace } from '../types/scheduler';

export default function Header() {
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const list = sprint1Storage.getWorkspaces();
    setWorkspaces(list);
    setActiveWorkspace(sprint1Storage.getActiveWorkspace());
  }, []);

  const handleSelectWorkspace = (ws: Workspace) => {
    const updated = sprint1Storage.setActiveWorkspace(ws.id);
    setActiveWorkspace(updated);
    setIsDropdownOpen(false);
    // Trigger custom event so active pages refresh their workspace-isolated list
    window.dispatchEvent(new CustomEvent('workspace-changed', { detail: updated }));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#050507]/90 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
      {/* Left: Brand & Workspace Selector */}
      <div className="flex items-center gap-5">
        <Link href="/app/social-scheduler" className="flex items-center gap-3 group">
          <div className="relative h-8 w-8 rounded bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#D6B46A]/50">
            <div className="h-3 w-3 border border-[#D6B46A] rotate-45" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#D6B46A]/10 to-transparent pointer-events-none" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-widest text-white uppercase">
                Sakhaa Forge
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#D6B46A]/10 text-[#D6B46A] border border-[#D6B46A]/20">
                Studio
              </span>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              Social Scheduler MVP
            </span>
          </div>
        </Link>

        <div className="hidden md:block h-6 w-px bg-white/10" />

        {/* Workspace Selector Dropdown */}
        {activeWorkspace && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-left transition-all"
            >
              <Building2 className="h-3.5 w-3.5 text-[#D6B46A]" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-zinc-200">{activeWorkspace.name}</span>
                  {activeWorkspace.brandApproved && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Brand Approved" />
                  )}
                </div>
                <span className="text-[9px] font-mono text-zinc-500">
                  {activeWorkspace.brandName} • {activeWorkspace.permission}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500 ml-1" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl p-1.5 z-50 divide-y divide-white/5">
                <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Select Active Workspace
                </div>
                <div className="py-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleSelectWorkspace(ws)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                        activeWorkspace.id === ws.id
                          ? 'bg-[#D6B46A]/10 text-white font-medium'
                          : 'text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5">
                          {ws.name}
                          {ws.brandApproved && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">
                              Approved
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{ws.brandName}</span>
                      </div>
                      {activeWorkspace.id === ws.id && <Check className="h-3.5 w-3.5 text-[#D6B46A]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-white/5">
        <Link
          href="/app/social-scheduler"
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            pathname === '/app/social-scheduler' || pathname === '/posts'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          Scheduler Queue
        </Link>
        <Link
          href="/app/social-scheduler/new"
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            pathname === '/app/social-scheduler/new' || pathname === '/posts/new'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          Creation Studio
        </Link>
        <Link
          href="/settings"
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            pathname === '/settings'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          Infrastructure
        </Link>
      </nav>

      {/* Right: Quick Action CTA */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/social-scheduler/new"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D6B46A] hover:bg-[#c4a259] text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-lg shadow-[#D6B46A]/20"
        >
          <Plus className="h-4 w-4" />
          <span>Create Post</span>
        </Link>
      </div>
    </header>
  );
}
