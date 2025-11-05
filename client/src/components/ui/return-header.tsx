import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import ROUTES from '@/routes';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReturnHeaderProps {
  to?: string;
  label?: string;
}

const contextMap: { prefix: string; to: string; labelKey: string }[] = [
  {
    prefix: ROUTES.admin.parks.list,
    to: ROUTES.admin.parks.list,
    labelKey: 'return.parks',
  },
  {
    prefix: ROUTES.admin.activities.list,
    to: ROUTES.admin.activities.list,
    labelKey: 'return.activities',
  },
  {
    prefix: ROUTES.admin.activities.registrations,
    to: ROUTES.admin.activities.registrations,
    labelKey: 'return.inscriptions',
  },
  {
    prefix: ROUTES.admin.activities.categories.list,
    to: ROUTES.admin.activities.categories.list,
    labelKey: 'return.categories',
  },
  {
    prefix: ROUTES.admin.activities.instructors.list,
    to: ROUTES.admin.activities.instructors.list,
    labelKey: 'return.instructors',
  },
  {
    prefix: ROUTES.admin.amenities.list,
    to: ROUTES.admin.amenities.list,
    labelKey: 'return.amenities',
  },
  {
    prefix: ROUTES.admin.assets.list,
    to: ROUTES.admin.assets.list,
    labelKey: 'return.assets',
  },
  {
    prefix: ROUTES.admin.incidents.list,
    to: ROUTES.admin.incidents.list,
    labelKey: 'return.incidents',
  },
  {
    prefix: ROUTES.admin.warehouse.list,
    to: ROUTES.admin.warehouse.list,
    labelKey: 'return.warehouse',
  },
  {
    prefix: ROUTES.admin.volunteers.activities.list,
    to: ROUTES.admin.volunteers.activities.list,
    labelKey: 'return.volunteerActivities',
  },
  {
    prefix: ROUTES.admin.volunteers.participations.list,
    to: ROUTES.admin.volunteers.participations.list,
    labelKey: 'return.volunteerParticipations',
  },
  {
    prefix: ROUTES.admin.volunteers.list,
    to: ROUTES.admin.volunteers.list,
    labelKey: 'return.volunteers',
  },
  {
    prefix: ROUTES.admin.events.list,
    to: ROUTES.admin.events.list,
    labelKey: 'return.events',
  },
  {
    prefix: ROUTES.admin.spaceReservations.list,
    to: ROUTES.admin.spaceReservations.list,
    labelKey: 'return.spaceReservations',
  },
  // Puedes agregar más rutas aquí siguiendo la misma estructura
];

export const ReturnHeader: React.FC<ReturnHeaderProps> = ({ to, label }) => {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();

  const currentPath = location;
  const match = contextMap.find(({ prefix }) => currentPath.startsWith(prefix));
  const fallback = { to: '/admin', labelKey: 'return.home' };

  const finalTo = String(to ?? match?.to ?? fallback.to);
  const finalLabel = label ?? t(match?.labelKey ?? fallback.labelKey);

  return (
    <div className="bg-header-background text-white justify-between px-2 py-1 -mx-4 -mt-4">
      <Button
        onClick={() => setLocation(finalTo)}
        className="text-white bg-header-background hover:bg-header-background hover:text-[] flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {finalLabel}
      </Button>
    </div>
  );
};