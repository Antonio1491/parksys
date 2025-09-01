import React from 'react';

interface BarChartData {
  label: string;
  value: number;
  id?: string | number;
}

interface VerticalBarChartProps {
  data: BarChartData[];
  valueKey?: string;
  labelKey?: string;
  height?: string;
  barWidth?: string;
  gap?: string;
  showLabels?: boolean;
  emptyStateIcon?: React.ComponentType<{ className?: string }>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  footerText?: string;
  sortDescending?: boolean;
  className?: string;
  minBarHeightPercentage?: number;
  formatValue?: (value: number, item?: BarChartData) => string;
}

export default function VerticalBarChart({
  data = [],
  height = "h-64",
  barWidth = "w-4",
  gap = "gap-8",
  showLabels = true,
  emptyStateTitle = "No hay datos disponibles",
  emptyStateDescription = "Los datos aparecerán aquí una vez que estén disponibles",
  footerText,
  sortDescending = true,
  className = "",
  minBarHeightPercentage = 5,
  formatValue,
}: VerticalBarChartProps) {

  // Función para obtener color basado en el rango de altura
  const getBarColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return "#a86767";
    
    const percentage = (value / maxValue);
    if (percentage >= 0.7) return "#69c45c"; // Verde para valores altos
    if (percentage >= 0.4) return "#bcb57e"; // Amarillo para valores medios
    return "#a86767"; // Rojo para valores bajos
  };

  // Preparar datos ordenados
  const sortedData = sortDescending 
    ? [...data].sort((a, b) => b.value - a.value)
    : [...data];

  const maxValue = Math.max(...data.map(item => item.value), 1);

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <p className="text-lg font-medium">{emptyStateTitle}</p>
          <p className="text-sm">{emptyStateDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto overflow-y-visible">
        <div className={`flex justify-center items-end ${gap} min-h-[320px] pl-8 pr-8 py-4 w-max`}>
          {sortedData.map((item, index) => {
            const heightPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const barColor = getBarColor(item.value, maxValue);
          
            return (
              <div key={item.id || index} className="flex flex-col items-center relative min-w-[48px] flex-shrink-0">
                {/* Valor del conteo arriba */}
                <div className="mb-2 text-center min-h-[40px] flex items-end justify-center">
                  <div className="text-sm font-medium text-gray-700">
                    {formatValue ? formatValue(item.value, item) : item.value}
                  </div>
                </div>

                {/* Columna vertical */}
                <div className={`relative ${height} ${barWidth} flex flex-col justify-end`}>
                  {/* Fondo de la columna */}
                  <div className="absolute bottom-0 w-full h-full bg-gray-200 rounded-t-3xl border border-gray-300"></div>
                
                  {/* Relleno de la columna según cantidad */}
                  <div
                    className="absolute bottom-0 w-full rounded-t-3xl transition-all duration-700 border border-opacity-20"
                    style={{
                      height: `${Math.max(heightPercentage, minBarHeightPercentage)}%`,
                      backgroundColor: barColor,
                      borderColor: barColor,
                    }}
                  ></div>
                </div>

                {/* Etiqueta del elemento a la izquierda de la columna - VERTICAL */}
                {showLabels && (
                  <div className="absolute bottom-32 -left-32 transform -rotate-90 origin-bottom-right w-32 overflow-visible">
                    <div className="text-xs text-gray-700 whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer opcional */}
      {footerText && data.length > 0 && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-500">
            {footerText}
          </p>
        </div>
      )}
    </div>
  );
}

// Hook para usar los colores del gráfico en otros componentes
export const useBarChartColors = () => {
  return {
    high: "#69c45c",    // Verde para valores altos (>= 70%)
    medium: "#bcb57e",  // Amarillo para valores medios (>= 40%)
    low: "#a86767",     // Rojo para valores bajos (< 40%)
    getColor: (value: number, maxValue: number) => {
      if (maxValue === 0) return "#a86767";
      const percentage = (value / maxValue);
      if (percentage >= 0.7) return "#69c45c";
      if (percentage >= 0.4) return "#bcb57e";
      return "#a86767";
    }
  };
};