'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Facebook,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
} from 'lucide-react';
import { sprint1Storage } from '@/lib/mock-storage';
import { Workspace } from '@/types/scheduler';

interface DiscoveredPage {
  id: string;
  name: string;
  category?: string;
  tasks?: string[];
  maskedId: string;
}

function SelectPagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectionId = searchParams.get('connectionId');
  const workspaceId = searchParams.get('workspaceId') || sprint1Storage.getActiveWorkspace().id;

  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [pages, setPages] = useState<DiscoveredPage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const ws = sprint1Storage.getWorkspaces().find((w) => w.id === workspaceId) || sprint1Storage.getActiveWorkspace();
    setActiveWorkspace(ws);

    if (!connectionId) {
      setError('Missing connection session ID');
      setIsLoading(false);
      return;
    }

    const fetchPages = async () => {
      try {
        const res = await fetch(`/api/v0/social-accounts/meta/select-pages?connectionId=${connectionId}`);
        const data = await res.json();

        if (res.ok && data.pages) {
          setPages(data.pages);
          // Pre-select the first page by default
          if (data.pages.length > 0) {
            setSelectedPageIds([data.pages[0].id]);
          }
        } else {
          setError(data.error || 'Failed to load discovered pages');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, [connectionId, workspaceId]);

  const togglePageSelection = (pageId: string) => {
    setSelectedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
    );
  };

  const handleSavePages = async () => {
    if (selectedPageIds.length === 0) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/v0/social-accounts/meta/select-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          connectionId,
          selectedPageIds,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setError(data.error || 'Failed to connect selected pages');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Facebook Pages Connected!</h1>
          <p className="text-xs text-zinc-300 max-w-md mx-auto">
            The selected Pages have been bound to <strong className="text-white">{activeWorkspace?.name}</strong>. You can
            now select them when scheduling Facebook posts.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/app/social-scheduler/new"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-blue-600/20"
          >
            Create Scheduled Post
          </Link>
          <Link
            href="/app/social-accounts"
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-medium transition-colors"
          >
            Back to Accounts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="border-b border-white/5 pb-6">
        <Link
          href="/app/social-accounts"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-2 font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Cancel & Return</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Select Facebook Pages</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Choose which Facebook Pages this workspace is allowed to publish to.
            </p>
          </div>

          {activeWorkspace && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 self-start sm:self-auto">
              <Building2 className="h-3.5 w-3.5 text-[#D6B46A]" />
              <span className="text-xs font-medium text-white">{activeWorkspace.name}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-500 font-mono">
          Discovering managed Facebook Pages...
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center bg-zinc-950/40 space-y-3">
          <h3 className="text-sm font-semibold text-white">No Facebook Pages Found</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            The connected Meta account does not administer any Facebook Pages with post management permissions.
          </p>
          <Link
            href="/app/social-accounts"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
          >
            Back to Accounts
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden divide-y divide-white/5">
            {pages.map((page) => {
              const isSelected = selectedPageIds.includes(page.id);

              return (
                <div
                  key={page.id}
                  onClick={() => togglePageSelection(page.id)}
                  className={`p-5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-600/5 hover:bg-blue-600/10' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Facebook className="h-5 w-5" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{page.name}</span>
                        {page.category && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {page.category}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">
                        Page ID: {page.maskedId} • Permissions: Manage &amp; Publish Posts
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400">
                    {isSelected ? 'Selected' : 'Click to select'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Link
              href="/app/social-accounts"
              className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              disabled={selectedPageIds.length === 0 || isSaving}
              onClick={handleSavePages}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-blue-600/20"
            >
              {isSaving ? 'Connecting Pages...' : `Save ${selectedPageIds.length} Selected Page(s)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SelectPagesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-zinc-500 font-mono">
          Loading page selection...
        </div>
      }
    >
      <SelectPagesContent />
    </Suspense>
  );
}
