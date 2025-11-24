import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  mainClassName?: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ 
  children, 
  showHeader = true,
  showFooter = true,
  className = '',
  mainClassName = '',
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`}>
      {/* Header fijo - se renderiza condicionalmente */}
      {showHeader && <Header />}

      {/* Main content */}
      {/* pt-20 compensa el header fijo de 80px (h-20) */}
      <main className={`flex-1 ${showHeader ? 'pt-20' : ''} ${mainClassName}`}>
        {children}
      </main>

      {/* Footer - se renderiza condicionalmente */}
      {showFooter && <Footer />}
    </div>
  );
};

export default PublicLayout;