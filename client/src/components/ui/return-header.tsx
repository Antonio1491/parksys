import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ROUTES from '@/routes';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReturnHeaderProps {
  to?: string;
  label?: string;
}

const returnMap: Record<string, { to: string; labelKey: string }> = {
  '/admin/activities/registrations/:id': {
    to: ROUTES.admin.activities.registrations,
    labelKey: 'return.inscriptions',
  },
  [ROUTES.admin.parks.new]: {
    to: ROUTES.admin.parks.list,
    labelKey: 'return.parks',
  },
  [ROUTES.admin.activities.new]: {
    to: ROUTES.admin.activities.list,
    labelKey: 'return.activities',
  },
  // Agrega más rutas según necesidad
};

export const ReturnHeader: React.FC<ReturnHeaderProps> = ({ to, label }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentPath = location.pathname;
  const fallback = { to: '/', labelKey: 'return.home' };

  const contextual = returnMap[currentPath] ?? fallback;

  const finalTo = to ?? contextual.to;
  const finalLabel = label ?? t(contextual.labelKey);

  return (
    <div className="bg-header-background text-white justify-between px-2 py-1 -mx-4 -mt-4">
      <Button
        onClick={() => navigate(finalTo)}
        className="text-white bg-header-background hover:bg-header-background hover:text-[] flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {finalLabel}
      </Button>
    </div>
  );
};