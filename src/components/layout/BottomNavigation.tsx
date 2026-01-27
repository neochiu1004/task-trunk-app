import React from 'react';
import { motion } from 'framer-motion';
import { ListTodo, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { ViewType } from '@/types/ticket';

interface BottomNavigationProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  onAddClick: () => void;
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
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        {/* Navigation Bar */}
        <nav className="glass-header border-t border-border/30 px-4 pt-2 pb-6 flex items-center justify-around">
          <NavItem
            icon={navItems[0].icon}
            label={navItems[0].label}
            isActive={view === navItems[0].id}
            onClick={() => setView(navItems[0].id)}
          />
          
          {/* Add Button in center */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onAddClick}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors text-primary"
          >
            <div className="relative">
              <motion.div
                className="absolute -inset-2 bg-primary/20 rounded-xl"
              />
              <Plus size={22} className="relative z-10" />
            </div>
            <span className="text-[10px] font-medium">新增</span>
          </motion.button>
          
          <NavItem
            icon={navItems[1].icon}
            label={navItems[1].label}
            isActive={view === navItems[1].id}
            onClick={() => setView(navItems[1].id)}
          />
          <NavItem
            icon={navItems[2].icon}
            label={navItems[2].label}
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
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
        isActive 
          ? 'text-primary' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className="relative">
        {isActive && (
          <motion.div
            layoutId="bottomNavIndicator"
            className="absolute -inset-2 bg-primary/10 rounded-xl"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon size={22} className="relative z-10" />
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </motion.button>
  );
};
