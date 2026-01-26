import React from 'react';
import { motion } from 'framer-motion';
import { Home, ListTodo, CheckCircle2, Trash2, Plus, Settings } from 'lucide-react';
import { ViewType } from '@/types/ticket';

interface BottomNavigationProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  onAddClick: () => void;
  onSettingsClick: () => void;
}

const navItems = [
  { id: 'home' as const, label: '首頁', icon: Home },
  { id: 'active' as const, label: '待使用', icon: ListTodo },
  { id: 'completed' as const, label: '已使用', icon: CheckCircle2 },
  { id: 'deleted' as const, label: '回收桶', icon: Trash2 },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  view,
  setView,
  onAddClick,
  onSettingsClick,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        <div className="relative">
          {/* Floating Action Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onAddClick}
            className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/40 flex items-center justify-center z-10"
          >
            <Plus size={28} strokeWidth={2.5} />
          </motion.button>

          {/* Navigation Bar */}
          <nav className="glass-header border-t border-border/30 px-2 pt-2 pb-6 flex items-center justify-around">
            {/* Left side items */}
            <NavItem
              icon={ListTodo}
              label="待使用"
              isActive={view === 'active'}
              onClick={() => setView('active')}
            />
            <NavItem
              icon={CheckCircle2}
              label="已使用"
              isActive={view === 'completed'}
              onClick={() => setView('completed')}
            />

            {/* Center spacer for FAB */}
            <div className="w-14" />

            {/* Right side items */}
            <NavItem
              icon={Trash2}
              label="回收桶"
              isActive={view === 'deleted'}
              onClick={() => setView('deleted')}
            />
            <NavItem
              icon={Settings}
              label="設定"
              isActive={false}
              onClick={onSettingsClick}
            />
          </nav>
        </div>
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
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
        isActive 
          ? 'text-primary' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className="relative">
        {isActive && (
          <motion.div
            layoutId="bottomNavIndicator"
            className="absolute -inset-1.5 bg-primary/10 rounded-xl"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon size={22} className="relative z-10" />
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </motion.button>
  );
};
