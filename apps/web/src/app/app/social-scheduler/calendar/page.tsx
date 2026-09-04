'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Eye,
  RotateCw,
  Ban,
  X,
  Share2,
  Copy,
  Send,
  ThumbsUp,
  RotateCcw,
  Sparkles,
  GripVertical,
  ExternalLink,
} from 'lucide-react';
import Header from '../../../../components/Header';
import SchedulerSubNav from '../../../../components/SchedulerSubNav';
import StatusBadge from '../../../../components/StatusBadge';
import ReschedulePostModal from '../../../../components/ReschedulePostModal';
import CancelPostModal from '../../../../components/CancelPostModal';
import DragRescheduleConfirmModal from '../../../../components/DragRescheduleConfirmModal';
import DuplicatePostModal from '../../../../components/DuplicatePostModal';
import CopyToDatesModal from '../../../../components/CopyToDatesModal';
import SendForReviewModal from '../../../../components/SendForReviewModal';
import ApprovePostModal from '../../../../components/ApprovePostModal';
import RequestChangesModal from '../../../../components/RequestChangesModal';
import ApprovalStatusChip from '../../../../components/ApprovalStatusChip';
import { sprint1Storage } from '../../../../lib/mock-storage';
import {
  CalendarItem,
  CalendarMode,
  SocialSchedulerPlatform,
  SocialSchedulerPostStatus,
  SocialSchedulerApprovalStatus,
  Sprint1ScheduledPost,
  Workspace,
} from '../../../../types/scheduler';

export default function CalendarPage() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [mode, setMode] = useState<CalendarMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [selectedPostFull, setSelectedPostFull] = useState<Sprint1ScheduledPost | null>(null);

  // Drag-and-drop reschedule states
  const [isDragging, setIsDragging] = useState(false);
  const [dragModalOpen, setDragModalOpen] = useState(false);
  const [dragItem, setDragItem] = useState<CalendarItem | null>(null);
  const [dragOriginalTime, setDragOriginalTime] = useState<string>('');
  const [dragNewTime, setDragNewTime] = useState<string>('');

  // Modals state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isCopyToDatesOpen, setIsCopyToDatesOpen] = useState(false);
  const [isSendForReviewOpen, setIsSendForReviewOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);

  const loadCalendar = () => {
    const ws = sprint1Storage.getActiveWorkspace();
    setActiveWorkspace(ws);
    const res = sprint1Storage.getCalendarPosts(
      ws.id,
      undefined,
      undefined,
      platformFilter,
      statusFilter
    );
    setCalendarItems(res.items);
  };

  useEffect(() => {
    loadCalendar();

    const handleWsChange = (e: Event) => {
      const customEvent = e as CustomEvent<Workspace>;
      setActiveWorkspace(customEvent.detail);
      loadCalendar();
    };

    window.addEventListener('workspace-changed', handleWsChange);
    return () => window.removeEventListener('workspace-changed', handleWsChange);
  }, [platformFilter, statusFilter]);

  // When selectedItem changes, load the full post object
  useEffect(() => {
    if (selectedItem) {
      const post = sprint1Storage.getPostById(selectedItem.postId);
      setSelectedPostFull(post || null);
    } else {
      setSelectedPostFull(null);
    }
  }, [selectedItem]);

  // Date navigation helpers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (mode === 'month') d.setMonth(d.getMonth() - 1);
    else if (mode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (mode === 'month') d.setMonth(d.getMonth() + 1);
    else if (mode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Week days calculation (Monday to Sunday)
  const getWeekDates = (refDate: Date): Date[] => {
    const d = new Date(refDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      days.push(next);
    }
    return days;
  };

  const weekDays = getWeekDates(currentDate);

  const formatDayHeader = (d: Date) => {
    return {
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: d.toDateString() === new Date().toDateString(),
      isoDate: d.toISOString().slice(0, 10),
    };
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: CalendarItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDayDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDayDrop = (e: React.DragEvent, targetDayIso: string) => {
    e.preventDefault();
    setIsDragging(false);

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const item: CalendarItem = JSON.parse(raw);

      // Extract time from original item
      const origDate = new Date(item.scheduledAt);
      const hours = String(origDate.getHours()).padStart(2, '0');
      const mins = String(origDate.getMinutes()).padStart(2, '0');
      const secs = String(origDate.getSeconds()).padStart(2, '0');

      const newDateStr = `${targetDayIso}T${hours}:${mins}:${secs}`;
      const newScheduledDate = new Date(newDateStr);

      // Validate not the same day
      if (item.scheduledAt.slice(0, 10) === targetDayIso) {
        return; // dropped on same day
      }

      setDragItem(item);
      setDragOriginalTime(item.scheduledAt);
      setDragNewTime(newScheduledDate.toISOString());
      setDragModalOpen(true);
    } catch (err) {
      console.error('Failed to handle drop', err);
    }
  };

  const handleConfirmDragReschedule = async (newIsoTime: string) => {
    if (!dragItem) return;

    const res = await fetch(
      `/api/v0/social-scheduler/posts/${dragItem.postId}/reschedule`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace?.id || 'ws_mantri',
          scheduledAt: newIsoTime,
          isDrag: true,
          reason: `Drag rescheduled to ${newIsoTime}`,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to reschedule post.');
    }

    loadCalendar();
    setDragModalOpen(false);
    setDragItem(null);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-[#D6B46A]/20 selection:text-[#D6B46A]">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <SchedulerSubNav />

        {/* Top Header & Mode Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Publishing Calendar
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D6B46A]/10 text-[#D6B46A] border border-[#D6B46A]/20">
                Live Scheduler
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <GripVertical className="h-2.5 w-2.5" />
                Drag to Reschedule Enabled
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Visual overview of planned, pending, and published social campaigns across connected platforms.
              Drag any scheduled post to a new day to reschedule.
            </p>
          </div>

          {/* Quick CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/app/social-scheduler/bulk"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-xs font-semibold tracking-wide transition-all"
            >
              <Layers className="h-4 w-4 text-purple-400" />
              <span>Bulk Drafts</span>
            </Link>
            <Link
              href="/app/social-scheduler/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D6B46A] hover:bg-[#c4a259] text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-md shadow-[#D6B46A]/20"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Post</span>
            </Link>
          </div>
        </div>

        {/* Filter & View Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          {/* Left: Date controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                title="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <span className="text-sm font-semibold text-white ml-2">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Right: Mode & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5 text-xs">
              {(['month', 'week', 'day', 'list'] as CalendarMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                    mode === m
                      ? 'bg-[#D6B46A]/20 text-[#D6B46A] shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-lg bg-zinc-900 border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#D6B46A]/60 font-mono"
            >
              <option value="ALL">All Platforms</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="PINTEREST">Pinterest</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="X">Twitter / X</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-zinc-900 border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#D6B46A]/60 font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="FAILED">Failed</option>
              <option value="RETRYING">Retrying</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Calendar Main Body: Week View with Drag & Drop */}
        {mode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-2">
            {weekDays.map((dayDate) => {
              const info = formatDayHeader(dayDate);
              const dayItems = calendarItems.filter((it) =>
                it.scheduledAt.startsWith(info.isoDate)
              );

              return (
                <div
                  key={info.isoDate}
                  onDragOver={handleDayDragOver}
                  onDrop={(e) => handleDayDrop(e, info.isoDate)}
                  className={`min-h-[420px] rounded-xl border p-3 flex flex-col transition-all ${
                    info.isToday
                      ? 'bg-zinc-950/90 border-[#D6B46A]/40 shadow-lg shadow-[#D6B46A]/5'
                      : 'bg-zinc-950/40 border-white/5 hover:border-white/15'
                  } ${isDragging ? 'border-dashed border-indigo-500/40 bg-indigo-950/10' : ''}`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-200">
                        {info.weekday}
                      </span>
                      <span
                        className={`text-xs font-mono px-1.5 py-0.2 rounded ${
                          info.isToday
                            ? 'bg-[#D6B46A] text-zinc-950 font-bold'
                            : 'text-zinc-400'
                        }`}
                      >
                        {info.date}
                      </span>
                    </div>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  {/* Day Items List */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayItems.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-4">
                        <span className="text-[11px] text-zinc-600">
                          {isDragging ? 'Drop here to reschedule' : 'No posts scheduled'}
                        </span>
                      </div>
                    ) : (
                      dayItems.map((item) => {
                        const canDrag =
                          item.status === 'SCHEDULED' ||
                          item.status === 'RETRYING' ||
                          item.status === 'FAILED';

                        return (
                          <div
                            key={item.postId}
                            draggable={canDrag}
                            onDragStart={(e) => handleDragStart(e, item)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left rounded-lg bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/5 hover:border-white/20 p-2.5 transition-all group cursor-pointer ${
                              canDrag ? 'active:cursor-grabbing hover:shadow-md' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                                {canDrag && (
                                  <GripVertical className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400 -ml-1 transition-colors" />
                                )}
                                <Clock className="h-3 w-3 text-zinc-500" />
                                {new Date(item.scheduledAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {item.attentionRequired && (
                                <span
                                  className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"
                                  title="Needs attention"
                                />
                              )}
                            </div>

                            <p className="text-xs font-medium text-white truncate group-hover:text-[#D6B46A] transition-colors">
                              {item.title}
                            </p>

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                              <div className="flex items-center gap-1">
                                {item.platforms.map((p) => (
                                  <span
                                    key={p}
                                    className="text-[9px] font-mono px-1 rounded bg-white/5 text-zinc-400"
                                  >
                                    {p[0]}
                                  </span>
                                ))}
                              </div>
                              <span className="text-[9px] font-mono text-zinc-500">
                                {item.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {mode === 'list' && (
          <div className="mt-4 rounded-xl border border-white/5 bg-zinc-950/40 divide-y divide-white/5">
            {calendarItems.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs">
                No scheduled posts match the selected criteria.
              </div>
            ) : (
              calendarItems.map((item) => (
                <div
                  key={item.postId}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Scheduled for {new Date(item.scheduledAt).toLocaleString()} ({item.timezone})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {item.platforms.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-white/10"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <StatusBadge status={item.status} />
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="px-2.5 py-1 rounded-md text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Quick Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Month / Day views */}
        {(mode === 'month' || mode === 'day') && (
          <div className="mt-4 rounded-xl border border-white/5 bg-zinc-950/40 p-8 text-center text-zinc-400 text-xs">
            <p>Displaying {calendarItems.length} items for active range.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-left max-w-4xl mx-auto">
              {calendarItems.slice(0, 9).map((item) => (
                <button
                  key={item.postId}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 hover:border-[#D6B46A]/50 transition-all text-left"
                >
                  <span className="text-[10px] font-mono text-zinc-500 block mb-1">
                    {new Date(item.scheduledAt).toLocaleString()}
                  </span>
                  <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-mono text-zinc-400">
                      {item.platforms.join(', ')}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400">{item.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Side Drawer for Quick Edit (Sprint 9 enhanced) */}
      {selectedItem && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-zinc-950 border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          <div>
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Quick Edit Drawer
                </span>
                <StatusBadge status={selectedItem.status} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Post Summary & Title */}
              <div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#D6B46A]" />
                  {new Date(selectedItem.scheduledAt).toLocaleString()} ({selectedItem.timezone})
                </p>
              </div>

              {/* Approval Status Block (Sprint 9) */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                    Approval Governance
                  </span>
                  <div className="mt-1">
                    <ApprovalStatusChip
                      status={
                        (selectedPostFull?.approvalStatus as SocialSchedulerApprovalStatus) ||
                        'NOT_REQUIRED'
                      }
                    />
                  </div>
                </div>
                {selectedPostFull?.rejectionReason && (
                  <span className="text-[11px] text-rose-400 max-w-[200px] truncate" title={selectedPostFull.rejectionReason}>
                    Note: {selectedPostFull.rejectionReason}
                  </span>
                )}
              </div>

              {/* Caption Preview */}
              {selectedItem.caption && (
                <div>
                  <span className="text-xs font-medium text-zinc-400 block mb-1.5">
                    Draft Caption:
                  </span>
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 text-xs text-zinc-300 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {selectedItem.caption}
                  </div>
                </div>
              )}

              {/* Destination Targets */}
              <div>
                <span className="text-xs font-medium text-zinc-400 block mb-2">
                  Destination Targets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.platforms.map((p) => (
                    <span
                      key={p}
                      className="px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-900 border border-white/10 text-zinc-200 flex items-center gap-1"
                    >
                      <Share2 className="h-3 w-3 text-[#D6B46A]" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Attention / Error Alert */}
              {selectedItem.attentionRequired && (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-200">Attention Required</p>
                    <p className="mt-0.5 text-red-300/80">
                      {selectedItem.attentionReason || 'One or more platform targets require intervention.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Edit Drawer Actions (Sprint 9) */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            {/* Primary Navigation to Detail */}
            <Link
              href={`/app/social-scheduler/${selectedItem.postId}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-white transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View Full Post Detail & Comments</span>
            </Link>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Duplicate Post (Sprint 9) */}
              <button
                type="button"
                onClick={() => setIsDuplicateOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 transition-colors"
              >
                <Copy className="h-3.5 w-3.5 text-indigo-400" />
                <span>Duplicate Post</span>
              </button>

              {/* Copy to Dates (Sprint 9) */}
              <button
                type="button"
                onClick={() => setIsCopyToDatesOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 transition-colors"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-purple-400" />
                <span>Copy to Dates</span>
              </button>

              {/* Reschedule */}
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#D6B46A]/10 hover:bg-[#D6B46A]/20 border border-[#D6B46A]/30 text-xs font-medium text-[#D6B46A] transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Reschedule</span>
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={() => setIsCancelOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-medium text-red-400 transition-colors"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Cancel Post</span>
              </button>
            </div>

            {/* Approval Workflow Actions (Sprint 9) */}
            {selectedPostFull && (
              <div className="pt-2 flex items-center gap-2">
                {['DRAFT', 'CHANGES_REQUESTED', 'NOT_REQUIRED'].includes(
                  selectedPostFull.approvalStatus || ''
                ) && (
                  <button
                    type="button"
                    onClick={() => setIsSendForReviewOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-xs font-medium text-blue-300 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5 text-blue-400" />
                    <span>Send for Review</span>
                  </button>
                )}

                {selectedPostFull.approvalStatus === 'IN_REVIEW' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsApproveOpen(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-medium text-emerald-300 transition-colors"
                    >
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRequestChangesOpen(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-xs font-medium text-amber-300 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                      <span>Changes</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drag-to-Reschedule Confirmation Modal (Sprint 9) */}
      <DragRescheduleConfirmModal
        isOpen={dragModalOpen}
        item={dragItem}
        originalTime={dragOriginalTime}
        newTime={dragNewTime}
        onConfirm={handleConfirmDragReschedule}
        onUndo={() => {
          setDragModalOpen(false);
          setDragItem(null);
        }}
        onClose={() => {
          setDragModalOpen(false);
          setDragItem(null);
        }}
      />

      {/* Duplicate Modal (Sprint 9) */}
      <DuplicatePostModal
        isOpen={isDuplicateOpen}
        post={selectedPostFull}
        onClose={() => setIsDuplicateOpen(false)}
        onSuccess={() => {
          setIsDuplicateOpen(false);
          loadCalendar();
        }}
      />

      {/* Copy to Multiple Dates Modal (Sprint 9) */}
      <CopyToDatesModal
        isOpen={isCopyToDatesOpen}
        post={selectedPostFull}
        onClose={() => setIsCopyToDatesOpen(false)}
        onSuccess={() => {
          setIsCopyToDatesOpen(false);
          loadCalendar();
        }}
      />

      {/* Send for Review Modal (Sprint 9) */}
      {selectedItem && (
        <SendForReviewModal
          isOpen={isSendForReviewOpen}
          postId={selectedItem.postId}
          workspaceId={activeWorkspace?.id || 'ws_mantri'}
          postTitle={selectedItem.title}
          onClose={() => setIsSendForReviewOpen(false)}
          onSuccess={() => {
            setIsSendForReviewOpen(false);
            loadCalendar();
            if (selectedItem) {
              const p = sprint1Storage.getPostById(selectedItem.postId);
              setSelectedPostFull(p || null);
            }
          }}
        />
      )}

      {/* Approve Modal (Sprint 9) */}
      {selectedItem && (
        <ApprovePostModal
          isOpen={isApproveOpen}
          postId={selectedItem.postId}
          workspaceId={activeWorkspace?.id || 'ws_mantri'}
          postTitle={selectedItem.title}
          onClose={() => setIsApproveOpen(false)}
          onSuccess={() => {
            setIsApproveOpen(false);
            loadCalendar();
            if (selectedItem) {
              const p = sprint1Storage.getPostById(selectedItem.postId);
              setSelectedPostFull(p || null);
            }
          }}
        />
      )}

      {/* Request Changes Modal (Sprint 9) */}
      {selectedItem && (
        <RequestChangesModal
          isOpen={isRequestChangesOpen}
          postId={selectedItem.postId}
          workspaceId={activeWorkspace?.id || 'ws_mantri'}
          postTitle={selectedItem.title}
          onClose={() => setIsRequestChangesOpen(false)}
          onSuccess={() => {
            setIsRequestChangesOpen(false);
            loadCalendar();
            if (selectedItem) {
              const p = sprint1Storage.getPostById(selectedItem.postId);
              setSelectedPostFull(p || null);
            }
          }}
        />
      )}

      {/* Standard Reschedule & Cancel Modals */}
      {selectedItem && (
        <>
          <ReschedulePostModal
            isOpen={isRescheduleOpen}
            onClose={() => setIsRescheduleOpen(false)}
            post={{
              id: selectedItem.postId,
              title: selectedItem.title,
              scheduledAt: selectedItem.scheduledAt,
              timezone: selectedItem.timezone,
            }}
            workspaceId={activeWorkspace?.id || 'ws_mantri'}
            onSuccess={() => {
              loadCalendar();
              setSelectedItem(null);
            }}
          />

          <CancelPostModal
            isOpen={isCancelOpen}
            onClose={() => setIsCancelOpen(false)}
            post={{
              id: selectedItem.postId,
              title: selectedItem.title,
            }}
            workspaceId={activeWorkspace?.id || 'ws_mantri'}
            onSuccess={() => {
              loadCalendar();
              setSelectedItem(null);
            }}
          />
        </>
      )}
    </div>
  );
}
