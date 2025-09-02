import React from 'react';

interface AdSpaceProps {
  spaceId: string | number;
  position: 'header' | 'sidebar' | 'footer' | 'hero' | 'profile' | 'banner' | 'sidebar-sports' | 'sidebar-events' | 'sidebar-nature' | 'sidebar-family' | 'card';
  pageType: 'homepage' | 'parks' | 'tree-species' | 'activities' | 'concessions' | 'activity-detail' | 'instructors' | 'instructor-profile' | 'volunteers' | 'park-landing' | 'fauna';
  className?: string;
}

const AdSpace: React.FC<AdSpaceProps> = ({ spaceId, position, pageType, className = '' }) => {
  console.error(`🚨🚨🚨 NUEVO ADSPACE COMPONENT EJECUTÁNDOSE - spaceId: ${spaceId}, pageType: ${pageType}, position: ${position} - TIMESTAMP: ${Date.now()}`);
  return null;
};

export default AdSpace;