import React from 'react';
import { Search, X, Grid, List, CopyCheck, CheckSquare, Square, Trash2, Brush } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ViewMode = 'grid' | 'list' | 'cards' | 'table';

export interface ToolbarProps {
  // ========== BÚSQUEDA ==========
  /** Valor actual de la búsqueda */
  searchQuery: string;
  /** Callback cuando cambia la búsqueda */
  onSearchChange: (value: string) => void;
  /** Placeholder del input de búsqueda */
  searchPlaceholder?: string;

  // ========== VISTA ==========
  /** Modo de vista actual */
  viewMode?: ViewMode;
  /** Callback cuando cambia el modo de vista */
  onViewModeChange?: (mode: ViewMode) => void;

  /** Modos de vista disponibles (por defecto todos) */
  availableViewModes?: ViewMode[];

  // ========== SELECCIÓN MÚLTIPLE ==========
  /** Si el modo de selección está activo */
  selectionMode?: boolean;
  /** Cantidad de items seleccionados */
  selectedCount?: number;
  /** Callback para toggle de selección */
  onToggleSelection?: () => void;
  /** Callback para seleccionar todos */
  onSelectAll?: () => void;
  /** Callback para deseleccionar todos */
  onDeselectAll?: () => void;

  // ========== ELIMINACIÓN BULK ==========
  /** Callback para eliminación múltiple */
  onBulkDelete?: () => void;
  /** Texto del botón de delete (por defecto vacío) */
  bulkDeleteLabel?: string;

  // ========== FILTROS Y SLOTS ==========
  /** Slot para filtros personalizados */
  filters?: React.ReactNode;
  /** Callback para limpiar filtros */
  onClearFilters?: () => void;
  /** Si hay filtros activos (para mostrar el botón de limpiar) */
  hasActiveFilters?: boolean;
  /** Slot para selector de ordenamiento */
  sortSelector?: React.ReactNode;
  /** Slot para orden ascendente/descendente */
  orderSelector?: React.ReactNode;
  /** Slot para acciones adicionales a la derecha */
  additionalActions?: React.ReactNode;

  // ========== ESTILOS ==========
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Si debe mostrar el borde y sombra */
  withBorder?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const Toolbar: React.FC<ToolbarProps> = ({
  // Búsqueda
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Buscar...',

  // Vista
  viewMode,
  onViewModeChange,
  availableViewModes,

  // Selección múltiple
  selectionMode = false,
  selectedCount = 0,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,

  // Eliminación bulk
  onBulkDelete,
  bulkDeleteLabel = '',

  // Filtros y slots
  filters,
  onClearFilters,
  hasActiveFilters = false,
  sortSelector,
  orderSelector,
  additionalActions,

  // Estilos
  className = '',
  withBorder = true,
}) => {
  // ========== HANDLERS ==========

  const handleClearSearch = () => {
    onSearchChange('');
  };

  const handleViewChange = (mode: ViewMode) => {
    onViewModeChange(mode);
  };

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // ========== RENDER HELPERS ==========

  /**
   * Renderiza el botón de modo de vista
   */
  const renderViewModeButton = (mode: ViewMode) => {
    // Mapeo de iconos
    const iconMap: Record<ViewMode, React.ReactNode> = {
      grid: <Grid className="h-4 w-4" />,
      list: <List className="h-4 w-4" />,
      cards: <Grid className="h-4 w-4" />,
      table: <List className="h-4 w-4" />,
    };

    const isActive = viewMode === mode || 
                     (viewMode === 'cards' && mode === 'grid') ||
                     (viewMode === 'table' && mode === 'list');

    return (
      <Button
        key={mode}
        variant={isActive ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleViewChange(mode)}
        title='Cambiar modo de vista'
        className={isActive ? 'bg-primary text-white' : 'text-foreground'}
        data-testid={`button-view-${mode}`}
      >
        {iconMap[mode]}
      </Button>
    );
  };

  /**
   * Renderiza el menú dropdown de selección
   */
  const renderSelectionDropdown = () => {
    if (!onToggleSelection) return null;

    return (
      <div className="relative group">
        <Button
          variant={selectionMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center h-10 w-10 sm:h-11 sm:w-11 ${
            selectionMode 
              ? 'bg-primary text-white hover:bg-[#00a587]' 
              : 'bg-gray-100 hover:bg-[#00a587]'
          }`}
          data-testid="button-selection-toggle"
        >
          <CopyCheck className={`h-4 w-4 sm:h-5 sm:w-5 ${
            selectionMode ? 'text-white' : 'text-[#4b5b65]'
          }`} />
        </Button>

        {/* Dropdown menu con click toggle (mobile-friendly) */}
        {isDropdownOpen && (
          <>
            {/* Overlay para cerrar al hacer click fuera */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />

            <div className="absolute right-0 top-full mt-1 w-44 sm:w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                {/* Activar modo selección (solo si no está activo) */}
                {!selectionMode && (
                  <button
                    onClick={() => {
                      onToggleSelection();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-buttonHover hover:text-foreground flex items-center"
                    data-testid="menu-enable-selection"
                  >
                    <CopyCheck className="h-4 w-4 mr-2" />
                    Activar selección
                  </button>
                )}

                {/* Seleccionar todo */}
                {onSelectAll && (
                  <button
                    onClick={() => {
                      if (!selectionMode && onToggleSelection) {
                        onToggleSelection();
                      }
                      onSelectAll();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-buttonHover hover:text-foreground flex items-center"
                    data-testid="menu-select-all"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Seleccionar todo
                  </button>
                )}

                {/* Deseleccionar todo (desactiva el modo y limpia selección) */}
                {onDeselectAll && (
                  <button
                    onClick={() => {
                      onDeselectAll();
                      if (onToggleSelection) {
                        onToggleSelection();
                      }
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-buttonHover hover:text-foreground flex items-center"
                    data-testid="menu-deselect-all"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Deseleccionar
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  /**
   * Renderiza el botón de eliminación bulk
   */
  const renderBulkDeleteButton = () => {
    if (!onBulkDelete) return null;

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onBulkDelete}
        className="flex items-center h-10 sm:h-11 px-3 bg-[#ededed] text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={selectedCount === 0}
        data-testid="button-delete-selected"
        title={`Eliminar ${selectedCount} seleccionado(s)`}
      >
        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
        {selectedCount > 0 && (
          <span className="ml-2">
            {bulkDeleteLabel || `${selectedCount}`}
          </span>
        )}
      </Button>
    );
  };

  // ========== RENDER ==========

  const containerClasses = [
    'bg-white p-2 rounded-xl',
    withBorder && 'border shadow-sm',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} data-testid="toolbar">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between w-full px-2 py-2 gap-3 lg:gap-4">

        {/* ===== SECCIÓN IZQUIERDA: Búsqueda + Filtros ===== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 flex-1 w-full lg:w-auto">

          {/* Input de búsqueda */}
          <div className="relative w-full lg:flex-1 lg:max-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-5 text-gray-600" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full font-poppins font-regular text-sm pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              data-testid="toolbar-search-input"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                title="Limpiar búsqueda"
                data-testid="toolbar-clear-search"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Filtros opcionales */}
          {filters && <div className="flex items-center gap-2">{filters}</div>}

          {/* Botón limpiar filtros - Solo visible si hay filtros activos */}
          {onClearFilters && hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-10 h-10 bg-gray-100" 
              onClick={onClearFilters}
              title="Limpiar filtros"
              aria-label="Limpiar filtros"
              data-testid="toolbar-clear-filters"
            >
              <Brush className="h-4 w-4 text-[#4b5b65]" />
            </Button>
          )}

          {/* Selector de ordenamiento */}
          {sortSelector && <div className="hidden sm:flex items-center gap-2">{sortSelector}</div>}

          {/* Selector de orden */}
          {orderSelector && <div className="hidden sm:flex items-center gap-2">{orderSelector}</div>}
        </div>

        {/* ===== SECCIÓN DERECHA: Controles de vista y acciones ===== */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">

          {/* Toggle de vista (Grid/List) - Solo mostrar si está configurado y hay más de un modo */}
          {viewMode && onViewModeChange && availableViewModes && availableViewModes.length > 1 && (
            <div className="flex border rounded-lg p-1 bg-gray-100">
              {availableViewModes.map(mode => renderViewModeButton(mode))}
            </div>
          )}

          {/* Dropdown de selección múltiple */}
          {renderSelectionDropdown()}

          {/* Botón de eliminación bulk */}
          {renderBulkDeleteButton()}

          {/* Acciones adicionales */}
          {additionalActions && (
            <div className="flex items-center gap-2">
              {additionalActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;