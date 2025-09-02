import React from "react";
import { Star } from "lucide-react";

interface ParkEvaluation {
  parkId: number;
  parkName: string;
  averageRating: number;
  evaluationCount?: number;
}

interface ParkStarRatingChartProps {
  data: ParkEvaluation[];
  maxRating?: number;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  footerText?: string;
}

const StarRating = ({ rating, maxRating = 5 }: { rating: number; maxRating?: number }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const starIndex = index + 1;
        const isFullStar = rating >= starIndex;
        const isPartialStar = rating > index && rating < starIndex;
        const fillPercentage = isPartialStar ? ((rating - index) * 100) : 0;

        return (
          <div key={index} className="relative">
            {/* Base star (empty/gray) */}
            <Star 
              className="w-5 h-5 text-gray-300" 
              fill="currentColor"
            />
            
            {/* Filled star overlay */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                width: isFullStar ? '100%' : isPartialStar ? `${fillPercentage}%` : '0%'
              }}
            >
              <Star 
                className="w-5 h-5 text-yellow-400" 
                fill="currentColor"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ParkStarRatingChart: React.FC<ParkStarRatingChartProps> = ({
  data,
  maxRating = 5,
  emptyStateTitle = "No hay evaluaciones disponibles",
  emptyStateDescription = "Los datos de evaluación aparecerán aquí una vez que los visitantes evalúen los parques",
  footerText
}) => {
  // Sort data by rating in descending order
  const sortedData = [...data].sort((a, b) => b.averageRating - a.averageRating);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full p-3 bg-gray-100 mb-4">
          <Star className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {emptyStateTitle}
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          {emptyStateDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Chart Content */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {sortedData.map((park, index) => (
          <div 
            key={park.parkId}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {/* Park name (left side) */}
            <div className="flex-1 min-w-0 mr-4">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {park.parkName}
                {park.evaluationCount && (
                  <span className="text-xs text-gray-500 ml-2 font-normal">
                    ({park.evaluationCount} evaluación{park.evaluationCount !== 1 ? 'es' : ''})
                  </span>
                )}
              </h4>
            </div>

            {/* Stars and rating (right side) */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <StarRating rating={park.averageRating} maxRating={maxRating} />
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {park.averageRating.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  de {maxRating}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {footerText && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {footerText}
          </p>
        </div>
      )}
    </div>
  );
};

export default ParkStarRatingChart;