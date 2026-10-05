import React, { useRef, useState, useEffect } from 'react';
import { useEventSchedule } from './hooks/useEventSchedule';
import { TableView } from './components/TableView';
import { TimelineView } from './components/TimelineView';
import { RunOfShowView } from './components/RunOfShowView';
import { ActivityModal } from './components/ActivityModal';
import { formatShortDate, getDayOfWeek } from './utils/dateUtils';

export const App: React.FC = () => {
  const {
    eventTitle,
    setEventTitle,
    activities,
    filteredActivities,
    filters,
    viewMode,
    isDarkMode,
    isModalOpen,
    modalMode,
    editingActivity,
    toast,
    availableDates,
    availableTracks,
     trackUsageCounts,
  categoryUsageCounts,

  renameTrack,
  renameCategory,
  deleteTrack,
  deleteCategory,
    availableCategories,
    headerDateBadgeText,
    scheduleStats,
    setFilters,
    setViewMode,
    toggleDarkMode,
    openAddModal,
    openEditModal,
    closeModal,
    saveActivity,
    deleteActivity,
    clearAllActivities,
    resetToDefaults,
    duplicateActivity,
    exportCSV,
    importCSV,
    copyForGoogleSheets,
    exportMatrix,
  } = useEventSchedule();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close burger dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          importCSV(text);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col transition-colors duration-200">
      {/* Hidden File Input for CSV Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Navigation & Header Bar */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Branding & Event Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center">
                <i className="fa-solid fa-bolt-lightning text-xl"></i>
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Tchêventos</span>
                  <input
  type="text"
  value={eventTitle}
  maxLength={100}
  size={Math.max(eventTitle.length, 1)}
  onChange={(e) => setEventTitle(e.target.value)}
  onBlur={(e) => {
    e.target.scrollLeft = 0;
    e.target.setSelectionRange(0, 0);
  }}
  placeholder="Nome do Evento..."
  className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-transparent hover:border-emerald-300 dark:hover:border-emerald-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-white focus:outline-none transition cursor-pointer focus:cursor-text text-ellipsis overflow-hidden whitespace-nowrap shadow-xs max-w-[105ch]"
  title={`Título do Evento: ${eventTitle} (Clique para editar, máx 100 caracteres)`}
/>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ml-1 hidden sm:inline">
                    {headerDateBadgeText}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gerenciador e Roteiro de Eventos • 14h às 22h
                </p>
              </div>
            </div>

            {/* Global Actions Toolbar & Burger Menu */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition"
                title="Alternar tema claro/escuro"
              >
                <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-slate-600'}`}></i>
              </button>

              {/* Burger Menu Container */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className={`p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition flex items-center justify-center ${
                    isMenuOpen ? 'bg-slate-200 dark:bg-slate-700 ring-2 ring-emerald-500/50' : 'bg-white dark:bg-slate-800'
                  }`}
                  aria-label="Abrir menu de opções"
                  title="Mais opções"
                >
                  <i className={`fa-solid ${isMenuOpen ? 'fa-xmark text-lg' : 'fa-bars text-lg'}`}></i>
                </button>

                {/* Burger Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Ações do Cronograma
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        openAddModal();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                    >
                      <i className="fa-solid fa-plus text-emerald-600 dark:text-emerald-400 w-4"></i>
                      <span>Nova Atividade</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                    >
                      <i className="fa-solid fa-file-import text-slate-600 dark:text-slate-300 w-4"></i>
                      <span>Importar CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        copyForGoogleSheets();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                    >
                      <i className="fa-solid fa-file-excel text-emerald-700 dark:text-emerald-400 w-4"></i>
                      <span>Copiar p/ Planilhas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        exportCSV();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                    >
                      <i className="fa-solid fa-download text-slate-600 dark:text-slate-300 w-4"></i>
                      <span>Exportar CSV</span>
                    </button>

                    <button
  type="button"
  onClick={() => {
    exportMatrix();
    setIsMenuOpen(false);
  }}
  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2.5 transition"
>
  <i className="fa-solid fa-table-cells-large w-4"></i>
  <span>Exportar Matriz (Excel)</span>
</button>

                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-700/60"></div>

                    <button
                      type="button"
                      onClick={() => {
                        resetToDefaults();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2.5 transition"
                    >
                      <i className="fa-solid fa-rotate-left w-4"></i>
                      <span>Restaurar Dados Padrão</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        clearAllActivities();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition"
                    >
                      <i className="fa-solid fa-trash-can w-4"></i>
                      <span>Limpar Todas as Atividades</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Filters & Summary Dashboard */}
        <div className="space-y-4 no-print">
          
          {/* Top Row: Date Pill Switcher + Metrics Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            
            {/* Dynamic Date Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
              <button
                type="button"
                onClick={() => setFilters({ ...filters, filterDay: 'all' })}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  filters.filterDay === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todos os Dias ({activities.length})
              </button>
              {availableDates.map((dateStr) => {
                const isSelected = filters.filterDay === dateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setFilters({ ...filters, filterDay: dateStr })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {getDayOfWeek(dateStr)} • {formatShortDate(dateStr)}
                  </button>
                );
              })}
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/50">
                <i className="fa-solid fa-list-check text-emerald-600 dark:text-emerald-400"></i>
                <span><strong>{filteredActivities.length}</strong> atividades</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/50">
                <i className="fa-regular fa-clock text-indigo-600 dark:text-indigo-400"></i>
                <span><strong>{scheduleStats.formattedDuration}</strong> programadas</span>
              </div>

              {scheduleStats.conflictCount > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold"
                  title="Existem atividades simultâneas no mesmo espaço!"
                >
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>{scheduleStats.conflictCount} sobreposição(ões)</span>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Row: Search, Dropdowns & View Mode Switcher */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                placeholder="Buscar por título, espaço ou nota..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none transition shadow-sm"
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, searchQuery: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Track Filter */}
            <div className="md:col-span-3">
              <select
                value={filters.locationFilter}
                onChange={(e) => setFilters({ ...filters, locationFilter: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition shadow-sm"
              >
                <option value="all">Todos os Espaços / Trilhas</option>
                {availableTracks.map((tr) => (
                  <option key={tr} value={tr}>
                    {tr}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="md:col-span-2">
              <select
                value={filters.categoryFilter}
                onChange={(e) => setFilters({ ...filters, categoryFilter: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition shadow-sm"
              >
                <option value="all">Todas as Categorias</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Selector Tabs */}
            <div className="md:col-span-3 flex items-center justify-end bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Visualização em Tabela Detalhada"
              >
                <i className="fa-solid fa-table-list"></i>
                <span className="hidden lg:inline">Tabela</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  viewMode === 'timeline'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Visualização em Matriz Visual / Linha do Tempo"
              >
                <i className="fa-solid fa-chart-gantt"></i>
                <span className="hidden lg:inline">Matriz</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('runofshow')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  viewMode === 'runofshow'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Roteiro de Produção Minuto a Minuto"
              >
                <i className="fa-solid fa-clipboard-list"></i>
                <span className="hidden lg:inline">Roteiro</span>
              </button>
            </div>

          </div>

        </div>

        {/* View Component Display */}
        {viewMode === 'table' && (
          <TableView
            activities={filteredActivities}
            onEdit={openEditModal}
            onDelete={deleteActivity}
            onDuplicate={duplicateActivity}
            onAddClick={() => openAddModal()}
          />
        )}

        {viewMode === 'timeline' && (
          <TimelineView
            activities={filteredActivities}
            availableTracks={availableTracks}
            onEdit={openEditModal}
            onDelete={deleteActivity}
            onDuplicate={duplicateActivity}
            onAddClick={() => openAddModal()}
          />
        )}

        {viewMode === 'runofshow' && (
          <RunOfShowView
            activities={filteredActivities}
            onEdit={openEditModal}
            onDelete={deleteActivity}
            onDuplicate={duplicateActivity}
            onAddClick={() => openAddModal()}
          />
        )}

      </main>

      {/* Activity Edit/Create Modal Dialog */}
      <ActivityModal
        isOpen={isModalOpen}
        mode={modalMode}
        activity={editingActivity}
        onClose={closeModal}
        onSave={saveActivity}
        availableTracks={availableTracks}
        availableCategories={availableCategories}
        
  trackUsageCounts={trackUsageCounts}
  categoryUsageCounts={categoryUsageCounts}

  onRenameTrack={renameTrack}
  onDeleteTrack={deleteTrack}

  onRenameCategory={renameCategory}
  onDeleteCategory={deleteCategory}
      />

      {/* Toast Floating Notification Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 ${
              toast.type === 'danger'
                ? 'bg-rose-600 text-white border-rose-500'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-400'
                : toast.type === 'info'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}
          >
            <i className={`fa-solid ${toast.iconClass} text-sm`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>Tchêventos • Gestão Inteligente de Cronogramas e Eventos</span>
          <span className="font-mono text-[11px]">© 2026 Bryan Gomes Saraiva | GNU GENERAL PUBLIC LICENSE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;