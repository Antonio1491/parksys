import React from 'react';

interface AdSpaceProps {
  spaceId: string | number;
  position: 'header' | 'sidebar' | 'footer' | 'hero' | 'profile' | 'banner' | 'sidebar-sports' | 'sidebar-events' | 'sidebar-nature' | 'sidebar-family' | 'card';
  pageType: 'homepage' | 'parks' | 'tree-species' | 'activities' | 'concessions' | 'activity-detail' | 'instructors' | 'instructor-profile' | 'volunteers' | 'park-landing' | 'fauna';
  className?: string;
}

const AdSpace: React.FC<AdSpaceProps> = ({ spaceId, position, pageType, className = '' }) => {
  console.error(`🚨 NUEVO COMPONENTE ADSPACE EJECUTÁNDOSE - spaceId: ${spaceId}, pageType: ${pageType}, position: ${position}`);
  console.error('Stack trace:', new Error().stack);
  return (
    <div className="p-4 bg-red-100 border border-red-500 text-red-700">
      ⚠️ ADSPACE DESHABILITADO PARA DEBUGGING - ID: {spaceId}
    </div>
  );
};

export default AdSpace;