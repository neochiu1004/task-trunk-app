import { useCallback, useMemo, useState } from "react";

import { checkIsExpiringSoon } from "@/lib/helpers";
import type { SortType, Ticket, ViewType } from "@/types/ticket";

interface UseTicketFiltersOptions {
  healthIssueSerials: Set<string>;
  notifyDays: number;
  searchQuery: string;
  sortType: SortType;
  tasks: Ticket[];
  view: ViewType;
}

export function useTicketFilters({
  healthIssueSerials,
  notifyDays,
  searchQuery,
  sortType,
  tasks,
  view,
}: UseTicketFiltersOptions) {
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => [...new Set(tasks.flatMap((ticket) => ticket.tags || []))], [tasks]);

  const duplicateSerials = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((ticket) => {
      if (!ticket.isDeleted && ticket.serial) {
        counts[ticket.serial] = (counts[ticket.serial] || 0) + 1;
      }
    });
    return new Set(Object.keys(counts).filter((serial) => counts[serial] > 1));
  }, [tasks]);

  const matchesTag = useCallback(
    (ticket: Ticket, tag: string): boolean => {
      if (tag === "special_expiring") return checkIsExpiringSoon(ticket.expiry, notifyDays) && !ticket.completed && !ticket.isDeleted;
      if (tag === "special_duplicate") return duplicateSerials.has(ticket.serial) && !ticket.completed && !ticket.isDeleted;
      if (tag === "special_has_original") return !!ticket.originalImage && !ticket.completed && !ticket.isDeleted;
      if (tag === "special_pinned") return !!ticket.pinned && !ticket.completed && !ticket.isDeleted;
      return !!ticket.tags?.includes(tag);
    },
    [duplicateSerials, notifyDays],
  );

  const filteredTasks = useMemo(() => {
    const result = tasks.filter((ticket) => {
      if (view === "active" && (ticket.completed || ticket.isDeleted)) return false;
      if (view === "completed" && (!ticket.completed || ticket.isDeleted)) return false;
      if (view === "deleted" && !ticket.isDeleted) return false;

      if (activeTags.length > 0 && !activeTags.some((tag) => matchesTag(ticket, tag))) {
        return false;
      }

      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        ticket.productName.toLowerCase().includes(query) ||
        ticket.note?.toLowerCase().includes(query) ||
        ticket.serial?.toLowerCase().includes(query) ||
        ticket.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    });

    result.sort((a, b) => {
      if (view === "completed") {
        return (b.completedAt || 0) - (a.completedAt || 0);
      }

      const hasHealthIssueA = !a.completed && !a.isDeleted && healthIssueSerials.has(a.serial || "");
      const hasHealthIssueB = !b.completed && !b.isDeleted && healthIssueSerials.has(b.serial || "");
      if (hasHealthIssueA !== hasHealthIssueB) return hasHealthIssueA ? -1 : 1;

      const pinnedA = !a.completed && !a.isDeleted && !!a.pinned;
      const pinnedB = !b.completed && !b.isDeleted && !!b.pinned;
      if (pinnedA !== pinnedB) return pinnedA ? -1 : 1;

      const expiringA = !a.completed && !a.isDeleted && checkIsExpiringSoon(a.expiry, notifyDays);
      const expiringB = !b.completed && !b.isDeleted && checkIsExpiringSoon(b.expiry, notifyDays);
      if (expiringA !== expiringB) return expiringA ? -1 : 1;

      if (sortType === "newest") return b.createdAt - a.createdAt;
      if (sortType === "oldest") return a.createdAt - b.createdAt;

      const dateA = a.expiry ? new Date(a.expiry.replace(/\//g, "-")) : new Date(9999, 11, 31);
      const dateB = b.expiry ? new Date(b.expiry.replace(/\//g, "-")) : new Date(9999, 11, 31);
      return dateA.getTime() - dateB.getTime();
    });

    return result;
  }, [activeTags, healthIssueSerials, matchesTag, notifyDays, searchQuery, sortType, tasks, view]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  }, []);

  const clearTags = useCallback(() => {
    setActiveTags([]);
  }, []);

  return {
    activeTags,
    allTags,
    clearTags,
    duplicateSerials,
    filteredTasks,
    setActiveTags,
    toggleTag,
  };
}
