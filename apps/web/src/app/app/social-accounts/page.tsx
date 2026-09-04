'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Facebook,
  Instagram,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Unlink,
  ExternalLink,
  ArrowLeft,
  X,
  Lock,
  Building2,
  Check,
  Search,
  Pin,
  FolderTree,
  Youtube,
  Video,
} from 'lucide-react';
import { sprint1Storage } from '@/lib/mock-storage';
import { Workspace, SocialAccount, SocialAccountStatus, SocialSchedulerPlatform } from '@/types/scheduler';

interface DiscoveredInstagram {
  facebookPageId: string;
  facebookPageName: string;
  instagramAccount: {
    id: string;
    username: string;
    displayName: string;
    accountType: string;
    profilePictureUrl: string | null;
  } | null;
  canPublish: boolean;
  missingPermissions: string[];
}

export default function SocialAccountsPage() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [confirmWorkspace, setConfirmWorkspace] = useState(false);
  const [confirmPermission, setConfirmPermission] = useState(false);
  const [confirmLivePublish, setConfirmLivePublish] = useState(false);
  const [isStartingOAuth, setIsStartingOAuth] = useState(false);

  // Instagram Discovery state
  const [isDiscoveringInstagram, setIsDiscoveringInstagram] = useState(false);
  const [discoveredInstagramAccounts, setDiscoveredInstagramAccounts] = useState<DiscoveredInstagram[]>([]);
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [savingIgUserId, setSavingIgUserId] = useState<string | null>(null);

  // Pinterest state
  const [isPinterestModalOpen, setIsPinterestModalOpen] = useState(false);
  const [confirmPinWorkspace, setConfirmPinWorkspace] = useState(false);
  const [confirmPinPermission, setConfirmPinPermission] = useState(false);
  const [confirmPinBoard, setConfirmPinBoard] = useState(false);
  const [isStartingPinterestOAuth, setIsStartingPinterestOAuth] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [selectedPinterestAccount, setSelectedPinterestAccount] = useState<SocialAccount | null>(null);
  const [pinterestBoards, setPinterestBoards] = useState<any[]>([]);
  const [isRefreshingBoards, setIsRefreshingBoards] = useState(false);

  // YouTube state (Sprint 6)
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [confirmYtWorkspace, setConfirmYtWorkspace] = useState(false);
  const [confirmYtManage, setConfirmYtManage] = useState(false);
  const [confirmYtUploadPermission, setConfirmYtUploadPermission] = useState(false);
  const [confirmYtPrivateMode, setConfirmYtPrivateMode] = useState(false);
  const [isStartingYouTubeOAuth, setIsStartingYouTubeOAuth] = useState(false);

  // Twitter/X state (Sprint 7)
  const [isXModalOpen, setIsXModalOpen] = useState(false);
  const [confirmXWorkspace, setConfirmXWorkspace] = useState(false);
  const [confirmXManage, setConfirmXManage] = useState(false);
  const [confirmXPostPermission, setConfirmXPostPermission] = useState(false);
  const [confirmXMediaPermission, setConfirmXMediaPermission] = useState(false);
  const [confirmXPaidCost, setConfirmXPaidCost] = useState(false);
  const [isStartingXOauth, setIsStartingXOauth] = useState(false);

  const [isCostLedgerModalOpen, setIsCostLedgerModalOpen] = useState(false);
  const [costLedgers, setCostLedgers] = useState<{ items: any[]; estimatedTotalUsd: string; actualTotalUsd: string }>({
    items: [],
    estimatedTotalUsd: '0.000',
    actualTotalUsd: '0.000',
  });
  const [isLoadingCostLedgers, setIsLoadingCostLedgers] = useState(false);

  const [disconnectingAccount, setDisconnectingAccount] = useState<SocialAccount | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    const ws = sprint1Storage.getActiveWorkspace();
    setActiveWorkspace(ws);
    const list = sprint1Storage.getSocialAccounts(ws.id);
    setAccounts(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Check query params for error
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setBannerMessage({ type: 'error', text: decodeURIComponent(errorParam) });
    }

    const handleWsChange = () => {
      loadData();
    };

    window.addEventListener('workspace-changed', handleWsChange);
    return () => window.removeEventListener('workspace-changed', handleWsChange);
  }, []);

  const handleStartMetaConnect = async () => {
    if (!activeWorkspace) return;
    setIsStartingOAuth(true);

    try {
      const res = await fetch('/api/v0/social-accounts/meta/connect/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          returnPath: '/app/social-accounts',
        }),
      });

      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || 'Failed to generate Meta connection URL');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setBannerMessage({ type: 'error', text: msg });
      setIsStartingOAuth(false);
      setIsConnectModalOpen(false);
    }
  };

  const handleDiscoverInstagram = async () => {
    if (!activeWorkspace) return;
    setIsDiscoveringInstagram(true);
    setIsDiscoverModalOpen(true);

    try {
      const res = await fetch('/api/v0/social-accounts/meta/discover-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace.id }),
      });
      const data = await res.json();
      if (data.success && data.accounts) {
        setDiscoveredInstagramAccounts(data.accounts);
      } else {
        setDiscoveredInstagramAccounts([]);
      }
    } catch {
      setDiscoveredInstagramAccounts([]);
    } finally {
      setIsDiscoveringInstagram(false);
    }
  };

  const handleConnectInstagram = async (item: DiscoveredInstagram) => {
    if (!activeWorkspace || !item.instagramAccount) return;
    setSavingIgUserId(item.instagramAccount.id);

    try {
      const res = await fetch('/api/v0/social-accounts/meta/select-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          facebookPageId: item.facebookPageId,
          instagramUserId: item.instagramAccount.id,
          username: item.instagramAccount.username,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBannerMessage({
          type: 'success',
          text: `Connected Instagram Professional account @${item.instagramAccount.username} to ${activeWorkspace.name}!`,
        });
        setIsDiscoverModalOpen(false);
        loadData();
      } else {
        setBannerMessage({ type: 'error', text: data.error || 'Failed to connect Instagram account' });
      }
    } catch (err: unknown) {
      setBannerMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to connect' });
    } finally {
      setSavingIgUserId(null);
    }
  };

  const handleValidateAccount = async (account: SocialAccount) => {
    setValidatingId(account.id);
    const isIg = account.platform === SocialSchedulerPlatform.INSTAGRAM;
    const isPin = account.platform === SocialSchedulerPlatform.PINTEREST;
    const isYt = account.platform === SocialSchedulerPlatform.YOUTUBE;
    const isX = account.platform === SocialSchedulerPlatform.X || (account.provider as any) === 'X';
    const url = isX
      ? `/api/v0/social-accounts/${account.id}/validate-x`
      : isYt
      ? `/api/v0/social-accounts/${account.id}/validate-youtube`
      : isPin
      ? `/api/v0/social-accounts/${account.id}/validate-pinterest`
      : isIg
      ? `/api/v0/social-accounts/${account.id}/validate-instagram`
      : `/api/v0/social-accounts/${account.id}/validate`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: account.workspaceId }),
      });
      const data = await res.json();

      if (data.status === SocialAccountStatus.CONNECTED || data.valid) {
        const quotaInfo = data.publishingLimit
          ? ` (Publishing quota: ${data.publishingLimit.quotaUsage}/${data.publishingLimit.quotaTotal} used)`
          : data.rateLimit
          ? ` (Rate limit: ${data.rateLimit.limit})`
          : '';
        setBannerMessage({
          type: 'success',
          text: `Token for "${account.displayName}" is valid and authorized.${quotaInfo}`,
        });
      } else {
        setBannerMessage({
          type: 'error',
          text: `Account validation returned ${data.status}. Reconnection may be required.`,
        });
      }
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed';
      setBannerMessage({ type: 'error', text: msg });
    } finally {
      setValidatingId(null);
    }
  };

  const handleStartPinterestConnect = async () => {
    if (!activeWorkspace) return;
    setIsStartingPinterestOAuth(true);
    try {
      const res = await fetch('/api/v0/social-accounts/pinterest/connect/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          returnPath: '/app/social-accounts',
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || 'Failed to generate Pinterest connection URL');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pinterest connection failed';
      setBannerMessage({ type: 'error', text: msg });
      setIsStartingPinterestOAuth(false);
      setIsPinterestModalOpen(false);
    }
  };

  const handleOpenBoardsModal = async (account: SocialAccount) => {
    if (!activeWorkspace) return;
    setSelectedPinterestAccount(account);
    setIsBoardModalOpen(true);
    try {
      const res = await fetch(
        `/api/v0/social-accounts/${account.id}/pinterest/boards?workspaceId=${activeWorkspace.id}`
      );
      const data = await res.json();
      if (data.boards) {
        setPinterestBoards(data.boards);
      }
    } catch {
      setPinterestBoards([]);
    }
  };

  const handleRefreshBoards = async (accountId: string) => {
    if (!activeWorkspace) return;
    setIsRefreshingBoards(true);
    try {
      const res = await fetch(`/api/v0/social-accounts/${accountId}/pinterest/boards/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace.id }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerMessage({
          type: 'success',
          text: `Successfully synced ${data.syncedBoards} Pinterest board(s) with ${data.syncedSections} sections.`,
        });
        const bRes = await fetch(
          `/api/v0/social-accounts/${accountId}/pinterest/boards?workspaceId=${activeWorkspace.id}`
        );
        const bData = await bRes.json();
        if (bData.boards) setPinterestBoards(bData.boards);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh boards';
      setBannerMessage({ type: 'error', text: msg });
    } finally {
      setIsRefreshingBoards(false);
    }
  };

  const handleStartYouTubeConnect = async () => {
    if (!activeWorkspace) return;
    setIsStartingYouTubeOAuth(true);
    try {
      const res = await fetch('/api/v0/social-accounts/google/youtube/connect/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          returnPath: '/app/social-accounts',
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || 'Failed to generate YouTube connection URL');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'YouTube connection failed';
      setBannerMessage({ type: 'error', text: msg });
      setIsStartingYouTubeOAuth(false);
      setIsYouTubeModalOpen(false);
    }
  };

  const handleStartXConnect = async () => {
    if (!activeWorkspace) return;
    setIsStartingXOauth(true);
    try {
      const res = await fetch('/api/v0/social-accounts/x/connect/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          returnPath: '/app/social-accounts',
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || 'Failed to generate Twitter/X connection URL');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Twitter/X connection failed';
      setBannerMessage({ type: 'error', text: msg });
      setIsStartingXOauth(false);
      setIsXModalOpen(false);
    }
  };

  const handleOpenCostSettings = async () => {
    if (!activeWorkspace) return;
    setIsLoadingCostLedgers(true);
    setIsCostLedgerModalOpen(true);
    try {
      const res = await fetch(`/api/v0/social-scheduler/x/costs?workspaceId=${activeWorkspace.id}`);
      const data = await res.json();
      setCostLedgers(data);
    } catch {
      setCostLedgers({ items: [], estimatedTotalUsd: '0.000', actualTotalUsd: '0.000' });
    } finally {
      setIsLoadingCostLedgers(false);
    }
  };

  const handleCheckYouTubeQuota = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`/api/v0/social-scheduler/youtube/quota?workspaceId=${activeWorkspace.id}`);
      const data = await res.json();
      setBannerMessage({
        type: 'success',
        text: `YouTube Project Quota: ${data.availableCount} of ${data.dailyLimit} uploads available today (${data.usedCount} used, ${data.reservedCount} reserved). Reset timezone: ${data.resetTimezone}.`,
      });
    } catch {
      setBannerMessage({ type: 'error', text: 'Failed to query YouTube quota.' });
    }
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectingAccount) return;

    try {
      const res = await fetch(`/api/v0/social-accounts/${disconnectingAccount.id}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: disconnectingAccount.workspaceId }),
      });
      const data = await res.json();

      if (data.success) {
        setBannerMessage({
          type: 'success',
          text: `Disconnected "${disconnectingAccount.displayName}". Future posts will not publish to this account.`,
        });
      }
      setDisconnectingAccount(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Disconnect failed';
      setBannerMessage({ type: 'error', text: msg });
    }
  };

  const canSubmitConnect = confirmWorkspace && confirmPermission && confirmLivePublish;
  const canSubmitPinConnect = confirmPinWorkspace && confirmPinPermission && confirmPinBoard;
  const canSubmitYtConnect =
    confirmYtWorkspace && confirmYtManage && confirmYtUploadPermission && confirmYtPrivateMode;
  const canSubmitXConnect =
    confirmXWorkspace && confirmXManage && confirmXPostPermission && confirmXMediaPermission && confirmXPaidCost;

  const fbAccounts = accounts.filter((a) => a.platform === SocialSchedulerPlatform.FACEBOOK);
  const igAccounts = accounts.filter((a) => a.platform === SocialSchedulerPlatform.INSTAGRAM);
  const pinAccounts = accounts.filter((a) => a.platform === SocialSchedulerPlatform.PINTEREST);
  const ytAccounts = accounts.filter((a) => a.platform === SocialSchedulerPlatform.YOUTUBE);
  const xAccounts = accounts.filter(
    (a) => a.platform === SocialSchedulerPlatform.X || (a.provider as any) === 'X'
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Back link & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <Link
            href="/app/social-scheduler"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-2 font-mono"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Scheduler</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Social Accounts Hub
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Meta &amp; Instagram Live
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Connect each client workspace to the Facebook Pages and Instagram Professional accounts it is allowed to publish to.
          </p>
        </div>

        {activeWorkspace && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 self-start md:self-auto">
            <Building2 className="h-4 w-4 text-[#D6B46A]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Active Workspace</span>
              <span className="text-xs font-semibold text-white">{activeWorkspace.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Banner Messages */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Connect Meta & Instagram Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0c0d14] to-[#07080c] border border-blue-500/20 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
              <Facebook className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Meta &amp; Instagram Connectivity</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready to Connect
                </span>
              </div>
              <p className="text-xs text-zinc-300 max-w-xl">
                Connect Meta to discover and publish approved posts to this client&apos;s Facebook Page and linked Instagram
                Business/Creator account with encrypted token vaulting and containerized worker dispatch.
              </p>

              {/* Permission Checklist */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>pages_show_list</span>
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>pages_manage_posts</span>
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pink-400" />
                  <span>instagram_business_basic</span>
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pink-400" />
                  <span>instagram_business_content_publish</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDiscoverInstagram}
              disabled={fbAccounts.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-semibold tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Instagram className="h-4 w-4 text-pink-400" />
              <span>Find Linked Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap"
            >
              <Facebook className="h-4 w-4" />
              <span>Connect Meta</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Connected Facebook Pages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-400" />
              Facebook Pages for {activeWorkspace?.name}
            </h2>
            <p className="text-xs text-zinc-500">
              Only posts in this workspace will be allowed to target these Pages.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {fbAccounts.filter((a) => a.status === SocialAccountStatus.CONNECTED).length} active
          </span>
        </div>

        {fbAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-zinc-950/40 space-y-2">
            <h3 className="text-xs font-semibold text-white">No Facebook Page connected</h3>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Connect a Facebook Page to enable Facebook live publishing and to discover linked Instagram accounts.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden divide-y divide-white/5">
            {fbAccounts.map((acc) => (
              <AccountRow
                key={acc.id}
                account={acc}
                validatingId={validatingId}
                onValidate={handleValidateAccount}
                onDisconnect={setDisconnectingAccount}
                onReconnect={() => setIsConnectModalOpen(true)}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Connected Instagram Accounts */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-400" />
              Instagram Accounts for {activeWorkspace?.name}
            </h2>
            <p className="text-xs text-zinc-500">
              Discovered from linked Facebook Pages. Supports live feed images and Reels publishing.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {igAccounts.filter((a) => a.status === SocialAccountStatus.CONNECTED).length} active
          </span>
        </div>

        {igAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-zinc-950/40 space-y-2">
            <h3 className="text-xs font-semibold text-white">No Instagram account connected</h3>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Ensure a Facebook Page is connected, then click &quot;Find Linked Instagram&quot; to import the linked Instagram Business/Creator account.
            </p>
            <button
              type="button"
              onClick={handleDiscoverInstagram}
              disabled={fbAccounts.length === 0}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600/20 text-pink-300 border border-pink-500/30 text-xs font-medium hover:bg-pink-600/30 transition-colors disabled:opacity-40"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Find Linked Instagram</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden divide-y divide-white/5">
            {igAccounts.map((acc) => (
              <AccountRow
                key={acc.id}
                account={acc}
                validatingId={validatingId}
                onValidate={handleValidateAccount}
                onDisconnect={setDisconnectingAccount}
                onReconnect={() => setIsConnectModalOpen(true)}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Connected Pinterest Accounts */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Pin className="h-4 w-4 text-red-400" />
              Pinterest Accounts for {activeWorkspace?.name}
            </h2>
            <p className="text-xs text-zinc-500">
              Publish image Pins to selected boards for this client with destination enquiry links.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500">
              {pinAccounts.filter((a) => a.status === SocialAccountStatus.CONNECTED).length} active
            </span>
            <button
              type="button"
              onClick={() => setIsPinterestModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-red-600/20"
            >
              <Pin className="h-3.5 w-3.5" />
              <span>Connect Pinterest</span>
            </button>
          </div>
        </div>

        {pinAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-zinc-950/40 space-y-2">
            <h3 className="text-xs font-semibold text-white">No Pinterest account connected</h3>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Connect a Pinterest account before scheduling image Pins for {activeWorkspace?.name}.
            </p>
            <button
              type="button"
              onClick={() => setIsPinterestModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-medium hover:bg-red-600/30 transition-colors"
            >
              <Pin className="h-3.5 w-3.5" />
              <span>Connect Pinterest</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden divide-y divide-white/5">
            {pinAccounts.map((acc) => (
              <AccountRow
                key={acc.id}
                account={acc}
                validatingId={validatingId}
                onValidate={handleValidateAccount}
                onDisconnect={setDisconnectingAccount}
                onReconnect={() => setIsPinterestModalOpen(true)}
                onManageBoards={() => handleOpenBoardsModal(acc)}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Connected YouTube Channels (Sprint 6) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              YouTube Channels for {activeWorkspace?.name}
            </h2>
            <p className="text-xs text-zinc-500">
              Upload approved MP4 videos to YouTube channels with project-level quota guardrails.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500">
              {ytAccounts.filter((a) => a.status === SocialAccountStatus.CONNECTED).length} active
            </span>
            <button
              type="button"
              onClick={handleCheckYouTubeQuota}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-mono transition-colors"
            >
              <span>Check Quota</span>
            </button>
            <button
              type="button"
              onClick={() => setIsYouTubeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-red-600/20"
            >
              <Youtube className="h-3.5 w-3.5" />
              <span>Connect YouTube</span>
            </button>
          </div>
        </div>

        {ytAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-zinc-950/40 space-y-2">
            <h3 className="text-xs font-semibold text-white">No YouTube channel connected</h3>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Connect a YouTube channel to schedule approved MP4 video walkthroughs and reels for {activeWorkspace?.name}.
            </p>
            <button
              type="button"
              onClick={() => setIsYouTubeModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-600/30 transition-colors"
            >
              <Youtube className="h-3.5 w-3.5" />
              <span>Connect YouTube</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden divide-y divide-white/5">
            {ytAccounts.map((acc) => (
              <AccountRow
                key={acc.id}
                account={acc}
                validatingId={validatingId}
                onValidate={handleValidateAccount}
                onDisconnect={setDisconnectingAccount}
                onReconnect={() => setIsYouTubeModalOpen(true)}
                onCheckQuota={handleCheckYouTubeQuota}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: Connected Twitter/X Accounts (Sprint 7) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="font-bold text-sm text-sky-400 font-sans">𝕏</span>
              Twitter/X Accounts for {activeWorkspace?.name}
            </h2>
            <p className="text-xs text-zinc-500">
              Connect X accounts for optional paid post publishing. API charges apply ($0.015 standard / $0.200 with URL).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCostSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-mono transition-colors"
            >
              <span>API Cost Settings</span>
            </button>
            <button
              type="button"
              onClick={() => setIsXModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold tracking-wide transition-all shadow-lg border border-white/10"
            >
              <span className="font-bold text-xs">𝕏</span>
              <span>Connect X</span>
            </button>
          </div>
        </div>

        {xAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-zinc-950/40 space-y-2">
            <h3 className="text-xs font-semibold text-white">No Twitter/X account connected</h3>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Connect an X account to enable optional paid tweet scheduling with images or videos for {activeWorkspace?.name}.
            </p>
            <button
              type="button"
              onClick={() => setIsXModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-white border border-white/20 text-xs font-medium hover:bg-zinc-700 transition-colors"
            >
              <span className="font-bold text-xs">𝕏</span>
              <span>Connect X</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden divide-y divide-white/5">
            {xAccounts.map((acc) => (
              <AccountRow
                key={acc.id}
                account={acc}
                validatingId={validatingId}
                onValidate={handleValidateAccount}
                onDisconnect={setDisconnectingAccount}
                onReconnect={() => setIsXModalOpen(true)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Security & Token Vault Guarantee Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Meta &amp; Instagram access tokens are stored in the encrypted Credential Vault (AES-256-GCM) and referenced only via
          opaque pointers.
        </span>
        <span className="text-[10px] font-mono text-zinc-500">Sprint 4 Security Compliance</span>
      </div>

      {/* Modal 1: Connect Meta Confirmation Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0b0c12] border border-blue-500/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Facebook className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white">Connect Meta and Instagram?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This connection lets Sakhaa Forge discover Facebook Pages and linked Instagram professional accounts <strong className="text-white">only for {activeWorkspace?.name}</strong>.
            </p>

            <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmWorkspace}
                  onChange={(e) => setConfirmWorkspace(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                />
                <span>Active workspace is correct: <strong>{activeWorkspace?.name}</strong></span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmPermission}
                  onChange={(e) => setConfirmPermission(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                />
                <span>You have admin permission to manage the Facebook Page and linked Instagram account</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmLivePublish}
                  onChange={(e) => setConfirmLivePublish(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                />
                <span>You approve real publishing permissions for Facebook Pages and Instagram (feed &amp; Reels)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSubmitConnect || isStartingOAuth}
                onClick={handleStartMetaConnect}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-blue-600/20"
              >
                {isStartingOAuth ? 'Starting OAuth...' : 'Continue to Meta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Instagram Discovery Drawer/Modal */}
      {isDiscoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-[#0b0c12] border border-pink-500/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-pink-600/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Instagram className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white">Discovered Instagram Accounts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscoverModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              The following Instagram Professional accounts were found linked to {activeWorkspace?.name}&apos;s Facebook Pages:
            </p>

            {isDiscoveringInstagram ? (
              <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                Querying linked Instagram accounts...
              </div>
            ) : discoveredInstagramAccounts.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-950 border border-white/5 text-center space-y-2">
                <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto" />
                <h4 className="text-xs font-semibold text-white">No Linked Instagram Accounts Found</h4>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Make sure your Instagram account is converted to a Professional (Business or Creator) account and linked to your Facebook Page in Meta settings.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {discoveredInstagramAccounts.map((item) => {
                  const ig = item.instagramAccount;
                  if (!ig) {
                    return (
                      <div
                        key={item.facebookPageId}
                        className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 flex items-center justify-between gap-3 text-xs text-zinc-400"
                      >
                        <div>
                          <div className="font-semibold text-zinc-300">{item.facebookPageName}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">No linked Instagram account</div>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Unlinked
                        </span>
                      </div>
                    );
                  }

                  const isSaving = savingIgUserId === ig.id;

                  return (
                    <div
                      key={ig.id}
                      className="p-4 rounded-xl bg-zinc-950 border border-white/10 hover:border-pink-500/30 flex items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-pink-600/10 border border-pink-500/30 flex items-center justify-center text-pink-400 flex-shrink-0">
                          <Instagram className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">@{ig.username}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/10">
                              {ig.accountType}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            Linked Page: <strong className="text-zinc-300">{item.facebookPageName}</strong>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleConnectInstagram(item)}
                        className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDiscoverModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Pinterest Connect Confirmation Modal */}
      {isPinterestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0b0c12] border border-red-500/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Pin className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white">Connect Pinterest for this workspace?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPinterestModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              You are connecting Pinterest only for <strong className="text-white">{activeWorkspace?.name}</strong>. Other client workspaces will not get access to this Pinterest account or its boards.
            </p>

            <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmPinWorkspace}
                  onChange={(e) => setConfirmPinWorkspace(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>Active workspace is correct: <strong>{activeWorkspace?.name}</strong></span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmPinPermission}
                  onChange={(e) => setConfirmPinPermission(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>You have client authorization to publish Pins to their Pinterest profile</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmPinBoard}
                  onChange={(e) => setConfirmPinBoard(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>You approve permissions to read boards and publish Pins</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPinterestModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSubmitPinConnect || isStartingPinterestOAuth}
                onClick={handleStartPinterestConnect}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-red-600/20"
              >
                {isStartingPinterestOAuth ? 'Starting OAuth...' : 'Continue to Pinterest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Pinterest Board Discovery / Management Modal */}
      {isBoardModalOpen && selectedPinterestAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-[#0b0c12] border border-red-500/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <FolderTree className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Pinterest Boards</h3>
                  <p className="text-[11px] text-zinc-400">
                    Synced for @{selectedPinterestAccount.username || selectedPinterestAccount.displayName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBoardModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {pinterestBoards.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                  No boards found. Click Refresh to sync from Pinterest.
                </div>
              ) : (
                pinterestBoards.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{b.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-white/5">
                          {b.privacy || 'PUBLIC'}
                        </span>
                      </div>
                      {b.description && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{b.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-1">
                        <span>External ID: {b.externalBoardId}</span>
                        {b.sectionCount > 0 && <span>• {b.sectionCount} sections</span>}
                      </div>
                    </div>
                    {b.url && (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-500 hover:text-red-400 p-2"
                        title="View Board on Pinterest"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button
                type="button"
                disabled={isRefreshingBoards}
                onClick={() => handleRefreshBoards(selectedPinterestAccount.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 border border-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingBoards ? 'animate-spin' : ''}`} />
                <span>{isRefreshingBoards ? 'Syncing...' : 'Refresh Boards'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBoardModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Connect YouTube Confirmation Modal (Sprint 6) */}
      {isYouTubeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0b0c12] border border-red-500/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500">
                  <Youtube className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white">Connect YouTube for this workspace?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsYouTubeModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              You are connecting a YouTube channel <strong className="text-white">only for {activeWorkspace?.name}</strong>. Other client workspaces will not get access to this channel.
            </p>

            <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmYtWorkspace}
                  onChange={(e) => setConfirmYtWorkspace(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>Active workspace is correct: <strong>{activeWorkspace?.name}</strong></span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmYtManage}
                  onChange={(e) => setConfirmYtManage(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>You manage or have authorization for this YouTube channel.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmYtUploadPermission}
                  onChange={(e) => setConfirmYtUploadPermission(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>You grant permission to upload approved MP4 videos to your channel.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmYtPrivateMode}
                  onChange={(e) => setConfirmYtPrivateMode(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>You understand uploaded videos may default to private until API project verification is complete.</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsYouTubeModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSubmitYtConnect || isStartingYouTubeOAuth}
                onClick={handleStartYouTubeConnect}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-red-600/20"
              >
                {isStartingYouTubeOAuth ? 'Starting OAuth...' : 'Continue to Google'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Connect Twitter/X Modal (Sprint 7) */}
      {isXModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0b0c12] border border-sky-500/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-white font-bold font-sans">
                  𝕏
                </div>
                <h3 className="text-base font-semibold text-white">Connect Twitter/X for {activeWorkspace?.name}?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsXModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Connecting Twitter/X enables automated posting of text, images (up to 4), and MP4 videos (up to 200 MB).
              Because X uses a pay-per-usage API, please confirm the following requirements:
            </p>

            <div className="space-y-2.5 bg-zinc-950 p-4 rounded-xl border border-white/5 text-xs text-zinc-300">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmXWorkspace}
                  onChange={(e) => setConfirmXWorkspace(e.target.checked)}
                  className="mt-0.5 rounded bg-zinc-900 border-white/20 text-sky-600 focus:ring-0"
                />
                <span>
                  I confirm that <strong className="text-white">{activeWorkspace?.name}</strong> is the intended client workspace. Other workspaces will not access this account.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmXManage}
                  onChange={(e) => setConfirmXManage(e.target.checked)}
                  className="mt-0.5 rounded bg-zinc-900 border-white/20 text-sky-600 focus:ring-0"
                />
                <span>I own or manage the Twitter/X account being connected.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmXPostPermission}
                  onChange={(e) => setConfirmXPostPermission(e.target.checked)}
                  className="mt-0.5 rounded bg-zinc-900 border-white/20 text-sky-600 focus:ring-0"
                />
                <span>I approve post creation permission (<code className="text-sky-400">tweet.write</code>).</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmXMediaPermission}
                  onChange={(e) => setConfirmXMediaPermission(e.target.checked)}
                  className="mt-0.5 rounded bg-zinc-900 border-white/20 text-sky-600 focus:ring-0"
                />
                <span>I approve media upload permission (<code className="text-sky-400">media.write</code>).</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmXPaidCost}
                  onChange={(e) => setConfirmXPaidCost(e.target.checked)}
                  className="mt-0.5 rounded bg-zinc-900 border-white/20 text-sky-600 focus:ring-0"
                />
                <span>
                  I understand X uses pay-per-request API pricing ($0.015 standard / $0.200 for posts with URLs).
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsXModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSubmitXConnect || isStartingXOauth}
                onClick={handleStartXConnect}
                className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide transition-all shadow-lg border border-white/10"
              >
                {isStartingXOauth ? 'Starting OAuth...' : 'Continue to X'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: X Cost Settings & Ledger Modal (Sprint 7) */}
      {isCostLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0b0c12] border border-sky-500/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-white font-bold font-sans">
                  𝕏
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">X API Cost Settings &amp; Ledger</h3>
                  <p className="text-xs text-zinc-400">Workspace: {activeWorkspace?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCostLedgerModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-white/5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">Estimated Total Cost</span>
                <p className="text-xl font-bold text-white mt-1 font-mono">${costLedgers.estimatedTotalUsd} USD</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-white/5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">Actual Billed Cost</span>
                <p className="text-xl font-bold text-sky-400 mt-1 font-mono">${costLedgers.actualTotalUsd} USD</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Recent Cost Ledger Items</h4>
              {isLoadingCostLedgers ? (
                <div className="p-6 text-center text-xs text-zinc-500 font-mono">Loading ledger...</div>
              ) : costLedgers.items.length === 0 ? (
                <div className="p-6 rounded-xl bg-zinc-950 border border-white/5 text-center text-xs text-zinc-500">
                  No X API charges recorded yet for this workspace.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-white/5 rounded-xl bg-zinc-950 border border-white/5">
                  {costLedgers.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-white">{item.operation}</span>
                        <span className="text-zinc-500 ml-2 font-mono text-[10px]">Status: {item.status}</span>
                      </div>
                      <span className="font-mono text-sky-400">${item.estimatedTotalUsd.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsCostLedgerModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Disconnect Confirmation Modal */}
      {disconnectingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0b0c12] border border-rose-500/20 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white">
              Disconnect this {disconnectingAccount.platform} account?
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Future scheduled posts will no longer publish to{' '}
              <strong className="text-white">{disconnectingAccount.displayName}</strong>. Existing attempt history and
              audit logs will remain preserved.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDisconnectingAccount(null)}
                className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
              >
                Disconnect Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountRow({
  account,
  validatingId,
  onValidate,
  onDisconnect,
  onReconnect,
  onManageBoards,
  onCheckQuota,
}: {
  account: SocialAccount;
  validatingId: string | null;
  onValidate: (account: SocialAccount) => void;
  onDisconnect: (account: SocialAccount) => void;
  onReconnect: () => void;
  onManageBoards?: () => void;
  onCheckQuota?: () => void;
}) {
  const isConnected = account.status === SocialAccountStatus.CONNECTED;
  const isReauth = account.status === SocialAccountStatus.REAUTH_REQUIRED;
  const isInstagram = account.platform === SocialSchedulerPlatform.INSTAGRAM;
  const isPinterest = account.platform === SocialSchedulerPlatform.PINTEREST;
  const isYouTube = account.platform === SocialSchedulerPlatform.YOUTUBE;
  const isX = account.platform === SocialSchedulerPlatform.X || (account.provider as any) === 'X';

  return (
    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={`h-11 w-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${
            isX
              ? 'bg-sky-500/10 border-sky-500/30 text-white font-bold'
              : isYouTube
              ? 'bg-red-600/10 border-red-500/30 text-red-500'
              : isPinterest
              ? 'bg-red-600/10 border-red-500/20 text-red-400'
              : isInstagram
              ? 'bg-pink-600/10 border-pink-500/20 text-pink-400'
              : 'bg-blue-600/10 border-blue-500/20 text-blue-400'
          }`}
        >
          {isX ? (
            <span className="font-bold text-lg font-sans">𝕏</span>
          ) : isYouTube ? (
            <Youtube className="h-5 w-5" />
          ) : isPinterest ? (
            <Pin className="h-5 w-5" />
          ) : isInstagram ? (
            <Instagram className="h-5 w-5" />
          ) : (
            <Facebook className="h-5 w-5" />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{account.displayName}</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : isReauth
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {account.status}
            </span>
            {account.accountType && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-white/5">
                {account.accountType}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500">
            <span>ID: {account.externalAccountIdMasked || account.externalAccountId}</span>
            <span>•</span>
            <span>Platform: {account.platform}</span>
            <span>•</span>
            <span>
              Connected:{' '}
              {new Date(account.lastConnectedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center">
        {onManageBoards && isConnected && (
          <button
            type="button"
            onClick={onManageBoards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Manage Boards</span>
          </button>
        )}

        {isReauth && (
          <button
            type="button"
            onClick={onReconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reconnect</span>
          </button>
        )}

        <button
          type="button"
          disabled={validatingId === account.id}
          onClick={() => onValidate(account)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          <span>{validatingId === account.id ? 'Checking...' : 'Validate'}</span>
        </button>

        {isConnected && (
          <button
            type="button"
            onClick={() => onDisconnect(account)}
            className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
            title="Disconnect Account"
          >
            <Unlink className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
