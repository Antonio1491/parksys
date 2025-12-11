import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
  variant?: 'public' | 'admin';
  secondaryText?: string;
  size?: 'sm' | 'default' | 'lg';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actions,
  variant = 'admin',
  secondaryText,
  size = 'default',
}) => {
  const sizeConfig = {
    sm: {
      container: 'py-8 px-4',
      iconWrapper: 'w-16 h-16 mb-4',
      iconSize: 'h-8 w-8',
      title: 'text-base',
      description: 'text-sm',
      secondary: 'text-xs',
    },
    default: {
      container: 'py-12 px-4',
      iconWrapper: 'w-20 h-20 mb-6',
      iconSize: 'h-10 w-10',
      title: 'text-lg',
      description: 'text-sm',
      secondary: 'text-sm',
    },
    lg: {
      container: 'py-16 px-4',
      iconWrapper: 'w-24 h-24 mb-6',
      iconSize: 'h-12 w-12',
      title: 'text-xl',
      description: 'text-base',
      secondary: 'text-base',
    },
  };

  const config = sizeConfig[size];

  if (variant === 'admin') {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container} text-center border rounded-lg bg-background/50`}>
        <div className={`${config.iconWrapper} flex items-center justify-center mb-2`}>
          <div className="w-full h-full bg-gradient-to-br from-[#00a587]/20 to-[#00444f]/20 rounded-full flex items-center justify-center">
            <img src="/public/parksys-logo.png" alt="ParkSys" className="h-full w-auto" />
          </div>
        </div>
        <div className="text-muted-foreground mb-4 flex items-center justify-center">
          {icon || <Inbox className={config.iconSize} />}
        </div>
        <h3 className={`${config.title} font-semibold mb-2 text-foreground`}>
          {title}
        </h3>
        <p className={`${config.description} text-muted-foreground max-w-md mb-6`}>
          {description}
        </p>
        {actions && (
          <div className="flex gap-2 flex-wrap justify-center">
            {actions}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${config.container} text-center`}>
      <div className={`${config.iconWrapper} bg-gray-100 rounded-full flex items-center justify-center`}>
        <div className="text-gray-400">
          {icon ? (
            React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement, { 
                  className: `${config.iconSize} text-gray-400` 
                })
              : icon
          ) : (
            <Inbox className={`${config.iconSize} text-gray-400`} />
          )}
        </div>
      </div>
      <p className={`${config.title} text-gray-500 mb-2`}>
        {title}
      </p>
      <p className={`${config.description} text-gray-400 max-w-md`}>
        {description}
      </p>
      {secondaryText && (
        <p className={`${config.secondary} text-gray-400 mt-2`}>
          {secondaryText}
        </p>
      )}
      {actions && (
        <div className="flex gap-2 flex-wrap justify-center mt-6 opacity-80">
          {actions}
        </div>
      )}
    </div>
  );
};

export default EmptyState;