import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  messageKey?: string;
  message?: string;
  namespace?: string;
  variant?: 'public' | 'admin';
  size?: 'sm' | 'default' | 'lg';
  minHeight?: string;
}

export default function LoadingState({ 
  messageKey,
  message,
  namespace = 'common',
  variant = 'admin',
  size = 'default',
  minHeight = '200px'
}: LoadingStateProps) {
  const { t } = useTranslation(namespace);
  const displayText = messageKey ? t(messageKey) : message || t('loading.default');
  const sizeConfig = {
    sm: {
      spinner: 'h-6 w-6',
      text: 'text-xs',
      spacing: 'space-y-2',
      logo: 'w-12 h-12',
    },
    default: {
      spinner: 'h-10 w-10',
      text: 'text-sm',
      spacing: 'space-y-3',
      logo: 'w-16 h-16',
    },
    lg: {
      spinner: 'h-12 w-12',
      text: 'text-base',
      spacing: 'space-y-4',
      logo: 'w-20 h-20',
    },
  };
  
  const config = sizeConfig[size];

  if (variant === 'admin') {
    return (
      <div 
        className="flex items-center justify-center w-full"
        style={{ minHeight }}
      >
        <div className={`flex flex-col items-center ${config.spacing}`}>
          <div className={`${config.logo} mb-2`}>
            <div className="w-full h-full bg-gradient-to-br from-[#00a587]/30 to-[#00444f]/30 rounded-xl flex items-center justify-center animate-pulse">
               <img 
                src="/public/parksys-logo.png" 
                alt="ParkSys" 
                className="h-full w-auto animate-pulse"
              />
            </div>
          </div>
          <Loader2 className={`${config.spinner} animate-spin text-[#00a587]`} />
          <p className={`${config.text} text-muted-foreground text-center max-w-md`}>
            {displayText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-center w-full"
      style={{ minHeight }}
    >
      <div className={`flex flex-col items-center ${config.spacing}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
          <Loader2 className={`${config.spinner} animate-spin text-primary relative`} />
        </div>
        <p className={`${config.text} text-gray-500 text-center max-w-md`}>
          {displayText}
        </p>
      </div>
    </div>
  );
}

export function LoadingStateInline({ 
  messageKey,
  message,
  namespace = 'common'
}: Omit<LoadingStateProps, 'size' | 'minHeight' | 'variant'>) {
  const { t } = useTranslation(namespace);
  const displayText = messageKey ? t(messageKey) : message || t('loading.default');

  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">{displayText}</span>
    </div>
  );
}
