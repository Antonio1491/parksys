// Componente de diagnóstico simple para verificar el renderizado
import React from 'react';

const TestNewEvent = () => {
  return (
    <div className="p-6">
      <h1>Test - Formulario de Nuevo Evento</h1>
      <div className="mt-4 p-4 border rounded">
        <h3>Información de contacto</h3>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label>Nombre del organizador</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Empresa / Organización</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Email de contacto</label>
            <input type="email" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Teléfono de contacto</label>
            <input type="tel" className="w-full p-2 border rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNewEvent;