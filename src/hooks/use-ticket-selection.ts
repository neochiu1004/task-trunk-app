import { useEffect, useState } from 'react';
type UseTicketSelectionArgs = {
  filteredTaskIds: Set<string>;
  filteredTaskLength: number;
};

export const useTicketSelection = ({
  filteredTaskIds,
  filteredTaskLength,
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
