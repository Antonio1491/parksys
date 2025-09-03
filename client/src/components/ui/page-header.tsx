import * as React from "react"

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode[]; // hasta 3 botones
  backgroundColor?: string;
};

export const PageHeader = ({
  title,
  subtitle,
  icon,
  actions = [],
  backgroundColor = 'header-background',
}: PageHeaderProps) => (
  <div
    className="mb-4 py-8 px-4 -mx-4 -mt-6 flex items-center justify-between"
    style={{ backgroundColor }}
  >
    {/* Sección izquierda: ícono + título + subtítulo */}
    <div className="flex items-start gap-2">
      {React.cloneElement(icon as React.ReactElement, {className: 'h-8 w-8 text-white mt-1',})}
      <div>
        <h1 className="text-3xl font-semibold text-white font-poppins">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base font-light text-white font-poppins mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>

    {/* Sección derecha: botones */}
    <div className="flex gap-2">
      {actions.slice(0, 3).map((action, index) => (
        <div key={index}>{action}</div>
      ))}
    </div>
  </div>
);