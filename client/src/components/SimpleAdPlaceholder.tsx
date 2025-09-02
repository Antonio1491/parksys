import React from 'react';

interface SimpleAdPlaceholderProps {
  className?: string;
}

const SimpleAdPlaceholder: React.FC<SimpleAdPlaceholderProps> = ({ className = '' }) => {
  console.error('🟢 NUEVO COMPONENTE SimpleAdPlaceholder SE ESTÁ EJECUTANDO - TIMESTAMP:', Date.now());
  
  return (
    <div className={`bg-gray-100 border border-gray-300 p-4 text-center text-gray-600 ${className}`}>
      <p className="text-sm">🧪 Espacio publicitario (componente simplificado)</p>
    </div>
  );
};

export default SimpleAdPlaceholder;