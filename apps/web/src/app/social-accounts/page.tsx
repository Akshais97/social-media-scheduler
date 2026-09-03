'use client';

import { useState } from 'react';
import { MOCK_ACCOUNTS } from '../../lib/mock-storage';
import PlatformIcon from '../../components/PlatformIcon';
import StatusBadge from '../../components/StatusBadge';
import { ShieldCheck, Plus, RefreshCw, Unlink } from 'lucide-react';

export default function SocialAccountsPage() {
  const [accounts] = useState(MOCK_ACCOUNTS);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Connected Social Accounts</h1>
        <p className="text-xs text-zinc-400 mt-1">
          OAuth accounts configured for publisher adapters (Instagram Graph API, Facebook Pages).
        </p>
      </div>

      <div className="rounded-xl bg-zinc-950/80 border border-white/10 overflow-hidden divide-y divide-white/5">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                {acc.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={acc.avatarUrl} alt={acc.displayName} className="h-full w-full object-cover" />
                ) : (
                  <PlatformIcon platform={acc.platform} className="h-5 w-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-100">{acc.displayName}</span>
                  <StatusBadge status={acc.status} size="sm" />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-zinc-500">
                  <PlatformIcon platform={acc.platform} className="h-3.5 w-3.5" />
                  <span>{acc.platform}</span>
                  <span>•</span>
                  <span>ID: {acc.platformAccountId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {acc.status === 'REAUTH_REQUIRED' && (
                <button
                  type="button"
                  onClick={() => alert('OAuth Reconnection is stubbed for Sprint 1.')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reconnect</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => alert('Account disconnection is disabled in test mode.')}
                className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                title="Disconnect account"
              >
                <Unlink className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          Access tokens are encrypted at rest with AES-256 before database storage.
        </span>
        <button
          type="button"
          onClick={() => alert('OAuth flow is planned for subsequent sprints.')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-600/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Connect Platform</span>
        </button>
      </div>
    </div>
  );
}
