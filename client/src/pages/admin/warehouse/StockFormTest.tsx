import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';

// Simple test component to verify basic functionality
export default function StockFormTest() {
  console.log('🔥 [STOCK-FORM-TEST] Component starting to render');
  
  // Simple state test
  const [testState, setTestState] = useState('initialized');
  
  // Simple parks query test
  const { data: parks = [], isLoading: parksLoading, error: parksError } = useQuery({
    queryKey: ['/api/parks'],
    staleTime: 0, // Disable cache for testing
    retry: 1,
  });

  // Debug logging
  useEffect(() => {
    console.log('🚀 [STOCK-FORM-TEST] Component mounted successfully');
    console.log('🏞️ [STOCK-FORM-TEST] Parks query result:', {
      parks,
      isLoading: parksLoading,
      error: parksError,
      parksLength: parks?.length,
      isArray: Array.isArray(parks)
    });
    setTestState('mounted');
  }, [parks, parksLoading, parksError]);

  console.log('✅ [STOCK-FORM-TEST] Rendering component, state:', testState);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">StockForm Debug Test</h1>
        <div className="space-y-4">
          <div>
            <strong>Component State:</strong> {testState}
          </div>
          <div>
            <strong>Parks Loading:</strong> {parksLoading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Parks Error:</strong> {parksError ? parksError.message : 'None'}
          </div>
          <div>
            <strong>Parks Count:</strong> {parks?.length || 0}
          </div>
          <div>
            <strong>Parks Data:</strong> {JSON.stringify(parks?.slice(0, 2) || [], null, 2)}
          </div>
          {!parksLoading && Array.isArray(parks) && parks.length > 0 && (
            <div>
              <h3 className="font-bold">Parks List:</h3>
              <ul className="list-disc pl-5">
                {parks.map((park: any) => (
                  <li key={park.id}>{park.name} (ID: {park.id})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}