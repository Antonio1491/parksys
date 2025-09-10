/**
 * Servicio centralizado para manejar la carga y configuración de Google Maps API
 */

// Importar tipos de Google Maps
/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}

interface GoogleMapsConfig {
  apiKey: string;
  libraries?: string[];
  language?: string;
  region?: string;
}

class GoogleMapsService {
  private static instance: GoogleMapsService;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private config: GoogleMapsConfig;

  private constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      libraries: ['places'],
      language: 'es',
      region: 'MX'
    };
  }

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  /**
   * Carga Google Maps API de forma asíncrona y optimizada
   */
  async loadGoogleMaps(): Promise<void> {
    // Si ya está cargado, no hacer nada
    if (this.isLoaded && window.google?.maps) {
      return Promise.resolve();
    }

    // Si ya está en proceso de carga, devolver la promesa existente
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Verificar si ya existe el script
    const existingScript = document.querySelector('#google-maps-script') as HTMLScriptElement;
    if (existingScript && window.google?.maps) {
      this.isLoaded = true;
      return Promise.resolve();
    }

    // Crear nueva promesa de carga
    this.isLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      // Verificar que tenemos API key
      if (!this.config.apiKey) {
        this.isLoading = false;
        reject(new Error('Google Maps API key no configurada. Por favor configura VITE_GOOGLE_MAPS_API_KEY'));
        return;
      }

      // Remover script existente si lo hay
      if (existingScript) {
        existingScript.remove();
      }

      // Crear script con configuración optimizada
      const script = document.createElement('script');
      const libraries = this.config.libraries?.join(',') || '';
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.apiKey}&libraries=${libraries}&language=${this.config.language}&region=${this.config.region}&loading=async`;
      script.id = 'google-maps-script';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Verificar que la API esté completamente disponible antes de marcar como cargada
        const checkReady = () => {
          if (typeof window.google !== 'undefined' && 
              window.google.maps && 
              typeof window.google.maps.Map === 'function') {
            console.log('✅ [GOOGLE MAPS] API completamente cargada y verificada');
            this.isLoaded = true;
            this.isLoading = false;
            resolve();
          } else {
            console.log('⏳ [GOOGLE MAPS] Esperando que la API termine de cargar...');
            setTimeout(checkReady, 100);
          }
        };
        
        checkReady();
      };

      script.onerror = (error) => {
        this.isLoading = false;
        reject(new Error('Error cargando Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Verifica si Google Maps está disponible
   */
  isGoogleMapsLoaded(): boolean {
    const hasGoogle = typeof window.google !== 'undefined';
    const hasMaps = hasGoogle && !!window.google.maps;
    const hasMap = hasMaps && typeof window.google.maps.Map === 'function';
    const hasMarker = hasMaps && typeof window.google.maps.Marker === 'function';
    
    console.log('🗺️ [GOOGLE MAPS DEBUG] Verificando disponibilidad:', {
      isLoaded: this.isLoaded,
      hasGoogle,
      hasMaps,
      hasMap,
      hasMarker
    });
    
    return this.isLoaded && hasGoogle && hasMaps && hasMap && hasMarker;
  }

  /**
   * Obtiene la instancia de Google Maps (solo si está cargada)
   */
  getGoogleMaps(): typeof google.maps | null {
    return this.isGoogleMapsLoaded() ? window.google.maps : null;
  }

  /**
   * Crea un mapa con configuración básica
   */
  async createMap(
    container: HTMLElement,
    options: google.maps.MapOptions
  ): Promise<google.maps.Map> {
    await this.loadGoogleMaps();
    
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps no está disponible');
    }

    // Usar referencia directa para evitar problemas de timing
    const GoogleMap = window.google.maps.Map;
    if (typeof GoogleMap !== 'function') {
      throw new Error('Google Maps Map constructor no está disponible');
    }

    return new GoogleMap(container, {
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      ...options
    });
  }

  /**
   * Crea un marcador en el mapa
   */
  async createMarker(
    map: google.maps.Map,
    options: google.maps.MarkerOptions
  ): Promise<google.maps.Marker> {
    await this.loadGoogleMaps();
    
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps no está disponible');
    }

    return new google.maps.Marker({
      map,
      ...options
    });
  }

  /**
   * Geocodifica una dirección
   */
  async geocodeAddress(address: string): Promise<google.maps.GeocoderResult[]> {
    await this.loadGoogleMaps();
    
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps no está disponible');
    }

    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding falló: ${status}`));
        }
      });
    });
  }

  /**
   * Calcula la distancia entre dos puntos
   */
  calculateDistance(
    point1: google.maps.LatLng | google.maps.LatLngLiteral,
    point2: google.maps.LatLng | google.maps.LatLngLiteral
  ): number {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps no está disponible');
    }

    return google.maps.geometry.spherical.computeDistanceBetween(
      point1 instanceof google.maps.LatLng ? point1 : new google.maps.LatLng(point1.lat, point1.lng),
      point2 instanceof google.maps.LatLng ? point2 : new google.maps.LatLng(point2.lat, point2.lng)
    );
  }
}

// Exportar instancia singleton
export const googleMapsService = GoogleMapsService.getInstance();
export default googleMapsService;