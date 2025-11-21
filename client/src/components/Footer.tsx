import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import ROUTES from '@/routes';

/**
 * Footer reutilizable de ParkSys
 * ✅ Rutas centralizadas desde ROUTES
 * ✅ Completamente internacionalizado
 * ✅ Responsive (columnas adaptan según viewport)
 * ✅ Consistente con el diseño de ParkSys
 */
export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gradient-to-b from-[#067f5f] to-[#00a587] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enlaces organizados en grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">

          {/* Columna 1 - Navegación Principal */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#bcd256] mb-2">{t('footer.mainNav')}</h4>
            <Link href={ROUTES.public.home} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.home')}
            </Link>
            <Link href={ROUTES.public.about} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.about')}
            </Link>
            <Link href={ROUTES.public.activities} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.activities')}
            </Link>
          </div>

          {/* Columna 2 - Parques y Educación */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#bcd256] mb-2">{t('footer.parksEducation')}</h4>
            <Link href={ROUTES.public.parks} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.parks')}
            </Link>
            <Link href={ROUTES.public.education} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.education')}
            </Link>
            <Link href={ROUTES.public.wildlifeRescue} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.wildlifeRescue')}
            </Link>
          </div>

          {/* Columna 3 - Transparencia */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#bcd256] mb-2">{t('footer.transparency')}</h4>
            <Link href={ROUTES.public.transparency} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.transparencyLink')}
            </Link>
            <Link href={ROUTES.public.bids} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.bids')}
            </Link>
            <Link href={ROUTES.public.blog} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.blog')}
            </Link>
          </div>

          {/* Columna 4 - Ayuda */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#bcd256] mb-2">{t('footer.help')}</h4>
            <Link href={ROUTES.public.faq} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.faq')}
            </Link>
            <Link href={ROUTES.public.help} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.helpLink')}
            </Link>
            <Link href={ROUTES.public.contact} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.contact')}
            </Link>
          </div>

          {/* Columna 5 - Servicios */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#bcd256] mb-2">{t('footer.services')}</h4>
            <Link href={ROUTES.public.instructors} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.instructors')}
            </Link>
            <Link href={ROUTES.public.concessions} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.concessions')}
            </Link>
            <Link href={ROUTES.public.treeSpecies} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.treeSpecies')}
            </Link>
          </div>

          {/* Columna 6 - Participación */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#bcd256] mb-2">{t('footer.participate')}</h4>
            <Link href={ROUTES.public.volunteers} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.volunteers')}
            </Link>
            <Link href={ROUTES.public.reports} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.reports')}
            </Link>
            <Link href={ROUTES.public.suggestions} className="block text-white hover:text-[#bcd256] transition-colors">
              {t('footer.suggestions')}
            </Link>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="border-t border-emerald-500/30 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-center">
            <div>
              <h4 className="font-semibold text-[#bcd256] mb-2">{t('footer.address')}</h4>
              <p className="text-emerald-100 text-sm">
                {t('footer.addressLine1')}<br/>
                {t('footer.addressLine2')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#bcd256] mb-2">{t('footer.contactTitle')}</h4>
              <p className="text-emerald-100 text-sm">
                {t('footer.phone')}<br/>
                {t('footer.email')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#bcd256] mb-2">{t('footer.hours')}</h4>
              <p className="text-emerald-100 text-sm">
                {t('footer.schedule')}
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-emerald-200">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;