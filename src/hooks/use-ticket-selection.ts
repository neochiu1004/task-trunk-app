import { useEffect, useState } from 'react';
import type { ViewType } from '@/types/ticket';

type UseTicketSelectionArgs = {
  filteredTaskIds: Set<string>;
  filteredTaskLength: number;
  view: ViewType;
};

export const useTicketSelection = ({
  filteredTaskIds,
  filteredTaskLength,
  view,
}: UseTicketSelectionArgs) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => filteredTaskIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredTaskIds]);

  useEffect(() => {
    if (isSelectionMode && filteredTaskLength === 0) {
      setIsSelectionMode(false);
    }
  }, [filteredTaskLength, isSelectionMode]);

  useEffect(() => {
    if (view !== 'active' && isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  }, [view, isSelectionMode]);

  const clearSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === filteredTaskLength ? new Set() : new Set(filteredTaskIds)
    );
  };

  return {
    clearSelection,
    handleSelect,
    handleSelectAll,
    isSelectionMode,
    selectedIds,
    setIsSelectionMode,
    setSelectedIds,
  };
};
