'use client';

import { Shield, Server, Database, HardDrive, Cpu, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Environment & Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Infrastructure configurations for Railway Worker, Backblaze B2, and Supabase Postgres.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Worker Diagnostics */}
        <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Scheduler & Cron Worker</h3>
                <p className="text-xs text-zinc-400">Railway Cron endpoint: POST /worker/publish-due</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Active
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-white/5 font-mono text-[11px] text-zinc-400 space-y-1">
            <div>Schedule: */5 * * * * (Every 5 minutes)</div>
            <div>Auth: X-Worker-Secret Protected</div>
            <div>Atomicity: UPDATE publish_targets SET status = &apos;PROCESSING&apos; WHERE status = &apos;SCHEDULED&apos;</div>
          </div>
        </div>

        {/* B2 Storage Diagnostics */}
        <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Backblaze B2 Object Storage</h3>
                <p className="text-xs text-zinc-400">Direct S3-compatible browser upload pipeline</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Configured
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-white/5 font-mono text-[11px] text-zinc-400 space-y-1">
            <div>Bucket Name: social-scheduler-media</div>
            <div>Upload Strategy: Backend Presigned URL (PUT)</div>
            <div>Payload Limit: 10 MB Image / 200 MB Video</div>
          </div>
        </div>

        {/* Database Diagnostics */}
        <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Database & ORM</h3>
                <p className="text-xs text-zinc-400">Supabase Postgres managed database with Prisma ORM</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Schema Drafted
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-white/5 font-mono text-[11px] text-zinc-400 space-y-1">
            <div>Schema Path: apps/api/prisma/schema.prisma</div>
            <div>Models: User, SocialAccount, Post, MediaAsset, PublishTarget, PublishAttempt</div>
            <div>Connection: DATABASE_URL (runtime pool) &amp; DIRECT_URL (migrations)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
