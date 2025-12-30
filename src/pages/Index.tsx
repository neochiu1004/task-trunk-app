import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Tag, X, Settings, Database, 
  Filter, ArrowUpDown, MoreVertical, Calendar,
  CheckCircle2, Clock, ChevronDown, Trash2, Edit,
  Download, Upload, RefreshCw, AlertCircle, Check
} from 'lucide-react';

// --- 模擬 UI 組件 (原 shadcn/ui) ---

const Button = ({ children, variant = "default", size = "default", className = "", ...props }) => {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-600",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    link: "text-blue-600 underline-offset-4 hover:underline",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-9 w-9 p-0",
  };
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }) => (
  <input
    className={`flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${className}`}
    {...props}
  />
);

// --- 模擬彈窗組件 (Dialog/Modal) ---
const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// --- 模擬 Select 組件 ---
const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const trigger = React.Children.toArray(children).find(c => c.type === SelectTrigger);
  const content = React.Children.toArray(children).find(c => c.type === SelectContent);

  return (
    <div className="relative inline-block w-full sm:w-[160px]">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute z-[70] mt-2 max-h-60 w-full overflow-auto rounded-2xl border bg-white shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div onClick={() => setIsOpen(false)}>
              {React.Children.map(content.props.children, child => 
                child && React.cloneElement(child, { 
                  onClick: () => { onValueChange(child.props.value); setIsOpen(false); } 
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
const SelectTrigger = ({ children, className = "" }) => (
  <div className={`flex h-10 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm cursor-pointer hover:border-blue-500 transition-all ${className}`}>
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </div>
);
const SelectValue = ({ placeholder, value, labels }) => (
  <span className="truncate">{labels[value] || placeholder}</span>
);
const SelectContent = ({ children }) => <>{children}</>;
const SelectItem = ({ children, value, onClick }) => (
  <div className="relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 px-3 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors" onClick={onClick}>
    {children}
  </div>
);

// --- 主要頁面組件 (Index) ---

const Index = () => {
  // 1. 完整狀態還原
  const [tasks, setTasks] = useState([
    { id: 1, name: "星巴克咖啡券", description: "大杯任選，全台門市可用", tags: ["美食", "飲品"], isUsed: false, createdAt: "2023-12-01", expireDate: "2024-12-31" },
    { id: 2, name: "漢堡王套餐", description: "華堡雙層套餐券", tags: ["美食"], isUsed: false, createdAt: "2024-01-05", expireDate: "2024-03-15" },
    { id: 3, name: "威秀電影票", description: "全台影城 2D 電影", tags: ["娛樂", "電影"], isUsed: true, createdAt: "2023-11-15", expireDate: "2024-05-20" },
  ]);
  
  const [view, setView] = useState('active'); 
  const [activeTag, setActiveTag] = useState('all');
  const [sortType, setSortType] = useState('expiring');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Modals 控制
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [redeemTask, setRedeemTask] = useState(null);

  // 2. 標籤計算
  const allTags = useMemo(() => {
    const tags = new Set();
    tasks.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tasks]);

  const tagLabels = { all: "所有標籤篩選", ...Object.fromEntries(allTags.map(t => [t, t])) };

  // 3. 完整篩選與排序邏輯
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = activeTag === 'all' || task.tags?.includes(activeTag);
      const matchesView = view === 'all' || 
                         (view === 'active' && !task.isUsed) || 
                         (view === 'used' && task.isUsed);
      return matchesSearch && matchesTag && matchesView;
    }).sort((a, b) => {
      if (sortType === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortType === 'expiring') return new Date(a.expireDate) - new Date(b.expireDate);
      return 0;
    });
  }, [tasks, searchQuery, activeTag, view, sortType]);

  // 批量選取處理
  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* 頂部欄 */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-xl">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">V</div>
            <h1 className="font-bold text-gray-900 text-lg hidden sm:block">票券收納箱</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowDataModal(true)}>
              <Database className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button className="rounded-2xl px-6" onClick={() => setShowAddModal(true)}>
              <Plus className="h-5 w-5 mr-2" /> 新增
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 flex-1">
        <div className="space-y-8">
          {/* 搜尋區 */}
          <div className="flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <Input 
                placeholder="搜尋票券、描述或標籤..." 
                className="pl-12 h-14 border-none bg-white shadow-xl shadow-blue-900/5 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* 視圖切換 */}
              <div className="flex p-1.5 bg-gray-200/40 rounded-2xl w-full md:w-auto">
                {['active', 'used', 'all'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-xl transition-all ${
                      view === v ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {v === 'active' ? '未使用' : v === 'used' ? '已使用' : '全部'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
                {/* 排序選擇 */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm shrink-0">
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                  <select 
                    value={sortType} 
                    onChange={(e) => setSortType(e.target.value)}
                    className="bg-transparent text-sm font-bold text-gray-600 focus:outline-none cursor-pointer"
                  >
                    <option value="expiring">最快到期</option>
                    <option value="newest">最新建立</option>
                  </select>
                </div>

                {/* 要求的修改：標籤下拉篩選 */}
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={activeTag} onValueChange={setActiveTag}>
                    <SelectTrigger className="bg-white shadow-sm h-10 border-gray-100">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <SelectValue placeholder="標籤篩選" value={activeTag} labels={tagLabels} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有標籤篩選</SelectItem>
                      {allTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* 票券列表渲染 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
              <div 
                key={task.id} 
                className={`group relative bg-white p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 cursor-pointer overflow-hidden ${
                  selectedIds.has(task.id) ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-100'
                } ${task.isUsed ? 'opacity-70 grayscale-[0.3]' : ''}`}
                onClick={() => selectedIds.size > 0 ? toggleSelect(task.id) : setRedeemTask(task)}
              >
                {/* 選擇勾選框 (模擬批量操作) */}
                <div 
                  className={`absolute top-4 left-4 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    selectedIds.has(task.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200 opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => { e.stopPropagation(); toggleSelect(task.id); }}
                >
                  {selectedIds.has(task.id) && <Check className="h-4 w-4 text-white" />}
                </div>

                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-extrabold text-gray-900 text-lg line-clamp-1">{task.name}</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed h-10">{task.description}</p>
                
                <div className="flex items-center gap-3 text-xs font-bold text-gray-400 mb-6 bg-gray-50 p-3 rounded-2xl">
                  <div className={`p-1.5 rounded-lg ${task.isUsed ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <span>到期日: {task.expireDate}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {task.tags?.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white text-gray-600 rounded-full text-[10px] font-black tracking-wider uppercase border border-gray-100 shadow-sm">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* 背景裝飾 */}
                <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
              <div className="bg-gray-100 p-6 rounded-full mb-6">
                <Search className="h-10 w-10 text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold">沒有符合條件的票券</p>
              <Button variant="link" onClick={() => { setSearchQuery(""); setActiveTag("all"); setView("all"); }}>清除所有篩選</Button>
            </div>
          )}
        </div>
      </main>

      {/* --- 所有模態框 (Modals) 還原 --- */}

      {/* 1. 兌換/詳細模態框 */}
      <Modal 
        isOpen={!!redeemTask} 
        onClose={() => setRedeemTask(null)} 
        title="票券詳細內容"
        footer={<Button className="w-full h-12 rounded-2xl" onClick={() => setRedeemTask(null)}>確認</Button>}
      >
        {redeemTask && (
          <div className="space-y-6 text-center">
            <div className="p-8 bg-gray-100 rounded-[2rem] inline-block mb-4">
              <Ticket className="h-12 w-12 text-blue-600" />
              <p className="mt-4 font-mono text-xl tracking-widest font-bold">SN: XXXX-XXXX-XXXX</p>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{redeemTask.name}</h2>
              <p className="text-gray-500">{redeemTask.description}</p>
            </div>
            <div className="flex justify-center gap-2">
              {redeemTask.tags?.map(t => <span key={t} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">#{t}</span>)}
            </div>
          </div>
        )}
      </Modal>

      {/* 2. 設定模態框 */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="應用程式設定">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600">背景歷史</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 w-24 bg-gray-100 rounded-xl shrink-0" />)}
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-bold text-gray-900">自動識別關鍵字</p>
              <p className="text-xs text-gray-400">當標題包含特定字詞時自動分類</p>
            </div>
            <input type="checkbox" className="w-5 h-5 accent-blue-600" checked readOnly />
          </div>
        </div>
      </Modal>

      {/* 3. 資料管理模態框 */}
      <Modal isOpen={showDataModal} onClose={() => setShowDataModal(false)} title="資料備份與還原">
        <div className="grid grid-cols-1 gap-4">
          <Button variant="outline" className="h-14 justify-start px-6 rounded-2xl border-dashed">
            <Download className="h-5 w-5 mr-3 text-blue-600" /> 下載備份檔案 (.json)
          </Button>
          <Button variant="outline" className="h-14 justify-start px-6 rounded-2xl border-dashed">
            <Upload className="h-5 w-5 mr-3 text-green-600" /> 匯入備份資料
          </Button>
          <Button variant="danger" className="h-14 justify-start px-6 rounded-2xl mt-4">
            <Trash2 className="h-5 w-5 mr-3" /> 重設所有資料
          </Button>
        </div>
      </Modal>

      {/* 4. 新增票券模態框 */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新增票券" footer={<Button className="w-full h-12 rounded-2xl">儲存票券</Button>}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-600 ml-1">票券名稱</label>
            <Input placeholder="例如：星巴克買一送一" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-600 ml-1">說明描述</label>
            <textarea className="w-full h-24 rounded-2xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="內容 SN 或兌換說明..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-600 ml-1">到期日期</label>
              <Input type="date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-600 ml-1">標籤 (以逗號分隔)</label>
              <Input placeholder="美食, 生活" />
            </div>
          </div>
        </div>
      </Modal>

      {/* 5. 批次操作浮動列 */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">已選取</span>
            <span className="text-lg font-black">{selectedIds.size} 個項目</span>
          </div>
          <div className="h-8 w-[1px] bg-gray-700" />
          <div className="flex gap-4">
            <Button variant="ghost" className="text-white hover:bg-white/10 h-11 px-4" onClick={() => setShowBatchModal(true)}>
              <Edit className="h-5 w-5 mr-2 text-blue-400" /> 批量編輯
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10 h-11 px-4 text-red-400">
              <Trash2 className="h-5 w-5 mr-2" /> 刪除
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => setSelectedIds(new Set())}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* 批量編輯模態框 */}
      <Modal isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} title={`批量編輯 (${selectedIds.size} 項)`}>
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-700 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            將同時更新選取的項目，未填寫的欄位將保持原狀。
          </div>
          <div className="space-y-4">
            <Input placeholder="修改到期日" type="date" />
            <Input placeholder="覆蓋標籤 (例如：已過期)" />
            <Button className="w-full h-12" onClick={() => { setSelectedIds(new Set()); setShowBatchModal(false); }}>執行批量更新</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

// --- 圖標輔助 ---
const Ticket = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
  </svg>
);

export default Index;
