// Configuración de branding y templates corporativos
export interface BrandingConfig {
  organization: {
    name: string;
    logo?: string; // URL o ruta del logo
    website?: string;
    address?: string;
    phone?: string;
    email?: string;
    department?: string; // Departamento específico
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    tableHeader: string;
    tableAlternate: string;
  };
  fonts: {
    title: string;
    body: string;
    size: {
      title: number;
      subtitle: number;
      body: number;
      footer: number;
      caption: number;
    };
  };
  templates: {
    header: HeaderTemplate;
    footer: FooterTemplate;
    table: TableTemplate;
  };
  locale: {
    language: 'es' | 'en' | 'pt';
    dateFormat: string;
    numberFormat: string;
    currencyFormat: string;
  };
}

export interface HeaderTemplate {
  showLogo: boolean;
  showOrganization: boolean;
  showDate: boolean;
  showTitle: boolean;
  showGeneratedBy: boolean;
  customText?: string;
  layout: 'left' | 'center' | 'right' | 'split';
  backgroundColor?: string;
  textColor?: string;
}

export interface FooterTemplate {
  showPageNumbers: boolean;
  showTimestamp: boolean;
  showContact: boolean;
  showDisclaimer: boolean;
  customText?: string;
  disclaimer?: string;
  position: 'left' | 'center' | 'right';
}

export interface TableTemplate {
  alternateRows: boolean;
  showBorders: boolean;
  headerStyle: 'bold' | 'colored' | 'minimal';
  fontSize: number;
  rowHeight?: number;
  columnAutoFit: boolean;
}

// Configuración por defecto
export const DEFAULT_BRANDING: BrandingConfig = {
  organization: {
    name: 'Gobierno Municipal',
    logo: '/assets/logo-municipal.png',
    website: 'www.municipio.gob.mx',
    address: '',
    phone: '',
    email: '',
    department: 'Dirección de Parques y Jardines'
  },
  colors: {
    primary: '#067f5f',
    secondary: '#00a587',
    accent: '#10B981',
    text: '#1F2937',
    background: '#FFFFFF',
    tableHeader: '#067f5f',
    tableAlternate: '#F8F9FA'
  },
  fonts: {
    title: 'Arial',
    body: 'Arial',
    size: {
      title: 18,
      subtitle: 14,
      body: 11,
      footer: 9,
      caption: 8
    }
  },
  templates: {
    header: {
      showLogo: true,
      showOrganization: true,
      showDate: true,
      showTitle: true,
      showGeneratedBy: true,
      layout: 'split'
    },
    footer: {
      showPageNumbers: true,
      showTimestamp: true,
      showContact: true,
      showDisclaimer: true,
      disclaimer: 'Documento generado automáticamente por ParkSys',
      position: 'center'
    },
    table: {
      alternateRows: true,
      showBorders: true,
      headerStyle: 'colored',
      fontSize: 11,
      columnAutoFit: true
    }
  },
  locale: {
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '#,##0',
    currencyFormat: '$#,##0.00'
  }
};

// Plantillas predefinidas
export const BRANDING_TEMPLATES = {
  corporate: {
    ...DEFAULT_BRANDING,
    templates: {
      ...DEFAULT_BRANDING.templates,
      header: {
        ...DEFAULT_BRANDING.templates.header,
        showLogo: true,
        showOrganization: true,
        layout: 'split'
      }
    }
  },
  minimal: {
    ...DEFAULT_BRANDING,
    templates: {
      ...DEFAULT_BRANDING.templates,
      header: {
        ...DEFAULT_BRANDING.templates.header,
        showLogo: false,
        showOrganization: false,
        layout: 'center'
      },
      footer: {
        ...DEFAULT_BRANDING.templates.footer,
        showContact: false,
        showDisclaimer: false
      }
    }
  },
  detailed: {
    ...DEFAULT_BRANDING,
    templates: {
      ...DEFAULT_BRANDING.templates,
      header: {
        ...DEFAULT_BRANDING.templates.header,
        showLogo: true,
        showOrganization: true,
        showGeneratedBy: true,
        layout: 'split'
      },
      footer: {
        ...DEFAULT_BRANDING.templates.footer,
        showPageNumbers: true,
        showTimestamp: true,
        showContact: true,
        showDisclaimer: true
      }
    }
  }
} as const;