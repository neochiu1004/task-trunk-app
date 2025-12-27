import React, { useState } from 'react';
import {
  Settings2,
  MoreVertical,
  Search,
  Tag,
  AlertCircle,
  ArrowUpDown,
  Rows,
  LayoutGrid,
  ListTodo,
  CheckCircle2,
  Trash,
  CheckSquare,
  BoxSelect,
  Palette,
} from 'lucide-react';
import { ViewType, SortType } from '@/types/ticket';

interface HeaderProps {
  appTitle: string;
  onTitleChange: (title: string) => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
  sortType: SortType;
  setSortType: (type: SortType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  selectedCount: number;
  onSelectAll: () => void;
  isCompact: boolean;
  setIsCompact: (compact: boolean) => void;
  view: ViewType;
  setView: (view: ViewType) => void;
  activeTag: string;
  setActiveTag: (tag: string) => void;
  allTags: string[];
  onQuickBgChange: () => void;
  headerBackgroundImage?: string;
}

export const Header: React.FC<HeaderProps> = ({
  appTitle,
  onTitleChange,
  onOpenMenu,
  onOpenSettings,
  sortType,
  setSortType,
  searchQuery,
  setSearchQuery,
  isSelectionMode,
  setIsSelectionMode,
  selectedCount,
  onSelectAll,
  isCompact,
  setIsCompact,
  view,
  setView,
  activeTag,
  setActiveTag,
  allTags,
  onQuickBgChange,
  headerBackgroundImage,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <div
      className="px-4 pt-8 pb-3 shadow-sm sticky top-0 z-40 transition-all rounded-b-[24px] bg-card text-foreground"
      style={
        headerBackgroundImage
          ? { backgroundImage: `url(${headerBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}
      }
    >
      <div className={headerBackgroundImage ? 'bg-card/80 backdrop-blur-md -mx-4 -mt-8 px-4 pt-8 pb-3 rounded-b-[24px]' : ''}>
        <div className="flex justify-between items-center mb-3">
          {isEditingTitle ? (
            <input
              autoFocus
              className="text-2xl font-black bg-transparent outline-none border-b-2 border-primary w-40"
              value={appTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            />
          ) : (
            <h1
              className="text-2xl font-black cursor-pointer flex items-center gap-2"
              onClick={() => setIsEditingTitle(true)}
            >
              🎫 <span>{appTitle}</span>
            </h1>
          )}
          <div className="flex gap-2">
            <button
              onClick={onQuickBgChange}
              className="w-9 h-9 flex items-center justify-center bg-muted rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <Palette size={18} />
            </button>
            <button
              onClick={onOpenSettings}
              className="w-9 h-9 flex items-center justify-center bg-muted rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <Settings2 size={18} />
            </button>
            <button
              onClick={onOpenMenu}
              className="w-9 h-9 flex items-center justify-center bg-muted rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋票券或標籤..."
            className="w-full py-3 pl-11 pr-4 bg-muted rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          <button
            onClick={() => setActiveTag('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeTag === 'all' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setActiveTag('special_expiring')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTag === 'special_expiring' ? 'bg-ticket-warning text-white shadow-lg shadow-ticket-warning/30' : 'bg-muted text-muted-foreground'
            }`}
          >
            <AlertCircle size={12} /> 快到期
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTag === tag ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Tag size={10} /> {tag}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                isSelectionMode ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <BoxSelect size={12} /> {isSelectionMode ? `已選 ${selectedCount}` : '多選'}
            </button>
            {isSelectionMode && (
              <button
                onClick={onSelectAll}
                className="px-3 py-1.5 bg-muted/50 text-muted-foreground hover:bg-muted rounded-full text-[10px] font-bold flex items-center gap-1"
              >
                <CheckSquare size={12} /> 全選
              </button>
            )}
            <div className="flex bg-muted/50 backdrop-blur-sm p-1 rounded-2xl">
              {([
                { id: 'active', label: '待使用', icon: ListTodo },
                { id: 'completed', label: '已使用', icon: CheckCircle2 },
                { id: 'deleted', label: '回收桶', icon: Trash },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1 text-[10px] font-bold transition-all ${
                    view === tab.id ? 'bg-card shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon size={12} /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const types: SortType[] = ['expiring', 'newest', 'oldest'];
                const nextIdx = (types.indexOf(sortType) + 1) % types.length;
                setSortType(types[nextIdx]);
              }}
              className="px-2 h-9 bg-muted/80 backdrop-blur-sm hover:bg-muted border border-border rounded-2xl flex items-center justify-center text-foreground transition-all gap-1"
            >
              <ArrowUpDown size={14} className="text-primary" />
              <span className="text-[10px] font-bold">
                {sortType === 'expiring' ? '快到期' : sortType === 'newest' ? '最新' : '最舊'}
              </span>
            </button>
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border ${
                isCompact ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/80 backdrop-blur-sm text-muted-foreground hover:bg-muted border-border'
              }`}
            >
              {isCompact ? <Rows size={16} /> : <LayoutGrid size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
