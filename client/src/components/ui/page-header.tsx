import React from 'react';
import { useTranslation } from 'react-i18next';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactElement;
  actions?: React.ReactNode[]; // hasta 3 botones
  backgroundColor?: string;
};

export const PageHeader = ({
  title,
  subtitle,
  icon,
  actions = [],
  backgroundColor = 'bg-header-background',
}: PageHeaderProps) => (
  <div
    className={`mb-4 py-4 md:py-8 px-4 -mx-4 -mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 ${backgroundColor}`}
  >
    {/* Sección izquierda: ícono + título + subtítulo */}
    <div className="flex items-start gap-2 mt-5">
      {React.isValidElement(icon) &&
      React.cloneElement(icon, { className: 'h-8 w-8 text-white mt-1' })}
      <div>
        <h1 className="text-3xl font-semibold text-white font-poppins">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base font-light text-white font-poppins mt-0">
            {subtitle}
          </p>
        )}
      </div>
    </div>

    {/* Sección derecha: botones */}
    {actions.length > 0 && (
      <div className="flex flex-row gap-2 md:mt-8 self-end md:self-auto">
        {actions.slice(0, 3).map((action, index) => (
          <div key={index}>
            {action}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default PageHeader;