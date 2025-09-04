import React from 'react';
import { Search, X } from 'lucide-react';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  placeholder?: string;
  children?: React.ReactNode;
}

export const Toolbar = ({
  searchQuery,
  onSearchChange,
  onSearchClear,
  placeholder = 'Buscar...',
  children,
}: ToolbarProps) => {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-white shadow-sm rounded-md">
      {/* 🔍 Search Input integrado */}
      <div className="relative flex-1 max-w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full font-poppins font-medium text-sm pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
        />
        {searchQuery && (
          <button
            onClick={onSearchClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* 🧩 Acciones adicionales */}
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
};