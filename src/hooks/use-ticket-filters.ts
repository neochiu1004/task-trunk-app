import { useCallback, useMemo } from 'react';
import { checkIsExpiringSoon } from '@/lib/helpers';
import type { Ticket, SortType, ViewType } from '@/types/ticket';

const FAR_FUTURE_TIMESTAMP = new Date(9999, 11, 31).getTime();

const getExpiryTimestamp = (expiry?: string) => {
  if (!expiry) return FAR_FUTURE_TIMESTAMP;
  const parsed = new Date(expiry.replace(/\//g, '-')).getTime();
  return Number.isNaN(parsed) ? FAR_FUTURE_TIMESTAMP : parsed;
};

type UseTicketFiltersArgs = {
  tasks: Ticket[];
  view: ViewType;
  activeTags: string[];
  searchQuery: string;
  sortType: SortType;
  notifyDays: number;
  healthIssueSerials: Set<string>;
};

export const useTicketFilters = ({
  tasks,
  view,
  activeTags,
  searchQuery,
  sortType,
  notifyDays,
  healthIssueSerials,
}: UseTicketFiltersArgs) => {
  const allTags = useMemo(() => [...new Set(tasks.flatMap((ticket) => ticket.tags || []))], [tasks]);

  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const duplicateSerials = useMemo(() => {
    const counts: Record<string, number> = {};

    tasks.forEach((ticket) => {
      if (!ticket.isDeleted && ticket.serial) {
        counts[ticket.serial] = (counts[ticket.serial] || 0) + 1;
      }
    });

    return new Set(Object.keys(counts).filter((serial) => counts[serial] > 1));
  }, [tasks]);

  const normalizedTasks = useMemo(
    () =>
      tasks.map((ticket) => ({
        ticket,
        searchText: [
          ticket.productName,
          ticket.note || '',
          ticket.serial || '',
          ...(ticket.tags || []),
        ]
          .join(' ')
          .toLowerCase(),
        expiryTimestamp: getExpiryTimestamp(ticket.expiry),
        isHealthIssue:
          !ticket.completed && !ticket.isDeleted && healthIssueSerials.has(ticket.serial || ''),
        isPinned: !ticket.completed && !ticket.isDeleted && !!ticket.pinned,
        isExpiring:
          !ticket.completed && !ticket.isDeleted && checkIsExpiringSoon(ticket.expiry, notifyDays),
      })),
    [tasks, healthIssueSerials, notifyDays]
  );

  const matchesTag = useCallback((ticket: Ticket, tag: string): boolean => {
    if (tag === 'special_expiring') {
      return checkIsExpiringSoon(ticket.expiry, notifyDays) && !ticket.completed && !ticket.isDeleted;
    }
    if (tag === 'special_duplicate') {
      return duplicateSerials.has(ticket.serial) && !ticket.completed && !ticket.isDeleted;
    }
    if (tag === 'special_has_original') {
      return !!ticket.originalImage && !ticket.completed && !ticket.isDeleted;
    }
    if (tag === 'special_pinned') {
      return !!ticket.pinned && !ticket.completed && !ticket.isDeleted;
    }
    return !!(ticket.tags && ticket.tags.includes(tag));
  }, [duplicateSerials, notifyDays]);

  const filteredTasks = useMemo(() => {
    const result = normalizedTasks.filter(({ ticket, searchText }) => {
      if (view === 'active' && (ticket.completed || ticket.isDeleted)) return false;
      if (view === 'completed' && (!ticket.completed || ticket.isDeleted)) return false;
      if (view === 'deleted' && !ticket.isDeleted) return false;

      if (activeTags.length > 0 && !activeTags.some((tag) => matchesTag(ticket, tag))) {
        return false;
      }

      if (normalizedSearchQuery) {
        return searchText.includes(normalizedSearchQuery);
      }

      return true;
    });

    result.sort((a, b) => {
      if (view === 'completed') {
        return (b.ticket.completedAt || 0) - (a.ticket.completedAt || 0);
      }
      if (a.isHealthIssue !== b.isHealthIssue) return a.isHealthIssue ? -1 : 1;
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (a.isExpiring !== b.isExpiring) return a.isExpiring ? -1 : 1;
      if (sortType === 'newest') return b.ticket.createdAt - a.ticket.createdAt;
      if (sortType === 'oldest') return a.ticket.createdAt - b.ticket.createdAt;
      if (sortType === 'expiring') return a.expiryTimestamp - b.expiryTimestamp;
      return 0;
    });

    return result.map(({ ticket }) => ticket);
  }, [activeTags, matchesTag, normalizedSearchQuery, normalizedTasks, sortType, view]);

  const filteredTaskIds = useMemo(() => new Set(filteredTasks.map((ticket) => ticket.id)), [filteredTasks]);

  const viewCounts = useMemo(
    () => ({
      active: tasks.filter((ticket) => !ticket.completed && !ticket.isDeleted).length,
      completed: tasks.filter((ticket) => ticket.completed && !ticket.isDeleted).length,
      deleted: tasks.filter((ticket) => ticket.isDeleted).length,
    }),
    [tasks]
  );

  const currentViewCount = viewCounts[view];
  const hasActiveFilters = activeTags.length > 0 || !!searchQuery.trim();

  const viewLabelMap: Record<ViewType, string> = {
    active: '待使用',
    completed: '已使用',
    deleted: '回收桶',
  };

  const emptyStateTitle = searchQuery.trim()
    ? '找不到符合搜尋的票券'
    : activeTags.length > 0
      ? '目前沒有符合標籤條件的票券'
      : view === 'completed'
        ? '目前沒有已使用票券'
        : view === 'deleted'
          ? '回收桶是空的'
          : '目前沒有待使用票券';

  const emptyStateDescription = searchQuery.trim()
    ? '可以試試別的關鍵字，或先清除搜尋與標籤篩選。'
    : activeTags.length > 0
      ? '清掉目前篩選後，就可以回到完整票券清單。'
      : view === 'completed'
        ? '核銷後的票券會集中在這裡，方便回頭查詢。'
        : view === 'deleted'
          ? '刪除的票券會先暫存在這裡，之後可以還原或永久刪除。'
          : '先用下方新增按鈕建立票券，之後就能在這裡集中管理。';

  return {
    allTags,
    currentViewCount,
    duplicateSerials,
    emptyStateDescription,
    emptyStateTitle,
    filteredTaskIds,
    filteredTasks,
    hasActiveFilters,
    viewCounts,
    viewLabelMap,
  };
};
