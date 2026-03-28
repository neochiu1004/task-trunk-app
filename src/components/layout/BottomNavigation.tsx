import React from 'react';
import { motion } from 'framer-motion';
import { ListTodo, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { ViewType } from '@/types/ticket';

interface BottomNavigationProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  onAddClick: () => void;
  activeCount: number;
  completedCount: number;
  deletedCount: number;
}

const navItems = [
  { id: 'active' as const, label: '待使用', icon: ListTodo },
  { id: 'completed' as const, label: '已使用', icon: CheckCircle2 },
  { id: 'deleted' as const, label: '回收桶', icon: Trash2 },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  view,
  setView,
  onAddClick,
  activeCount,
  completedCount,
  deletedCount,
}) => {
  const counts = {
    active: activeCount,
    completed: completedCount,
    deleted: deletedCount,
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        {/* Navigation Bar */}
        <nav className="glass-header border-t border-border/40 px-4 pt-2 pb-6 flex items-center justify-around">
          <NavItem
            icon={navItems[0].icon}
            label={navItems[0].label}
            count={counts.active}
            isActive={view === navItems[0].id}
            onClick={() => setView(navItems[0].id)}
          />
          
          {/* Add Button in center - highlighted */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onAddClick}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all"
          >
            <div className="relative">
              <motion.div
                className="absolute -inset-2.5 bg-gradient-to-tr from-[#6A9C89] to-[#4f8070] rounded-xl shadow-md"
              />
              <Plus size={22} className="relative z-10 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-semibold text-[#4f8070]">新增</span>
          </motion.button>
          
          <NavItem
            icon={navItems[1].icon}
            label={navItems[1].label}
            count={counts.completed}
            isActive={view === navItems[1].id}
            onClick={() => setView(navItems[1].id)}
          />
          <NavItem
            icon={navItems[2].icon}
            label={navItems[2].label}
            count={counts.deleted}
            isActive={view === navItems[2].id}
            onClick={() => setView(navItems[2].id)}
          />
        </nav>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, count, isActive, onClick }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
        isActive 
          ? 'text-[#334A52]' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className="relative">
        {isActive && (
          <motion.div
            layoutId="bottomNavIndicator"
            className="absolute -inset-2 bg-[#6A9C89]/15 rounded-xl"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon size={22} className="relative z-10" />
        {count > 0 && (
          <span className={`absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center z-20 ${
            isActive ? 'bg-[#334A52] text-white' : 'bg-white/90 text-[#334A52] border border-border/60'
          }`}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </motion.button>
  );
};
