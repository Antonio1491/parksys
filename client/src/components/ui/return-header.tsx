import React from 'react';
import { ArrowLeft } from 'lucide-react';

type ReturnHeaderProps = {
  backRoute: string;
  backLabel: string;
  setLocation: (route: string) => void;
  backgroundColor?: string;
  className?: string;
};

export const ReturnHeader = ({
  backRoute,
  backLabel,
  setLocation,
  backgroundColor = 'bg-header-background',
  className = ''
}: ReturnHeaderProps) => {
  return (
    <div className={`${backgroundColor} text-white px-2 py-1 -mx-4 -mt-4 ${className}`}>
      <button
        onClick={() => setLocation(backRoute)}
        className={`text-white ${backgroundColor} hover:bg-opacity-80 flex items-center gap-2 px-3 py-2 rounded transition-colors`}
        aria-label={backLabel}
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </button>
    </div>
  );
};