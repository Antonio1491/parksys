import React from 'react';
import { Search, X, Grid, List } from 'lucide-react';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  placeholder?: string;
  filters?: React.ReactNode;
  sortSelector?: React.ReactNode;
  orderSelector?: React.ReactNode;
  viewMode: 'grid' | 'list';
  onViewChange: (mode: 'grid' | 'list') => void;
}

export const Toolbar = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  placeholder = 'Buscar...',
  filters,
  sortSelector,
  orderSelector,
  viewMode,
  onViewChange,
}: ToolbarProps) => {
  return (
    <div className="bg-white p-2 rounded-xl border shadow-sm">
      <div className="flex items-center justify-between w-full px-2 py-2 gap-4">
        {/* Izquierda: búsqueda + filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={placeholder}
              className="w-full font-poppins font-medium text-sm pl-10 pr-10 py-2 border border-gray-300 rounded-lg"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Filtros opcionales */}
          {filters}
          {sortSelector}
          {orderSelector}
        </div>

        {/* Derecha: botones de vista */}
        <div className="flex items-center space-x-1 bg-[#e3eaee] px-1 py-1 rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};