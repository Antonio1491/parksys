import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import clsx from 'clsx';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', nativeName: 'Português' },
];

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'inline' | 'inline-compact';
  showLabel?: boolean;
  className?: string;
  title?: string;
  buttonClassName?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  showLabel = true,
  className,
  title,
  buttonClassName,
}: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  // Variante inline (menú vertical con nombre completo)
  if (variant === 'inline') {
    return (
      <div className={clsx('flex flex-col gap-1 w-full', className)}>
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={(e) => {
              e.stopPropagation();
              changeLanguage(language.code);
            }}
            className={clsx(
              'flex items-center gap-2 px-2 py-1.5 rounded hover:bg-buttonHover text-foreground transition-colors text-left w-full', buttonClassName,
              i18n.language === language.code && 'bg-gray-100 font-medium'
            )}
          >
            <span className="text-lg">{language.flag}</span>
            <span className="text-sm">{language.nativeName}</span>
            {i18n.language === language.code && (
              <span className="ml-auto text-xs text-primary">✓</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Variante inline-compact (solo banderas)
  if (variant === 'inline-compact') {
    return (
      <div className={clsx('flex items-center gap-2 px-2 py-1', className)}>
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={(e) => {
              e.stopPropagation();
              changeLanguage(language.code);
            }}
            className={clsx(
              'p-1 rounded transition-colors',
              i18n.language === language.code
                ? 'ring-2 ring-primary'
                : 'opacity-50'
            )}
            title={language.name}
          >
            <span className="text-xl">{language.flag}</span>
          </button>
        ))}
      </div>
    );
  }

  // Variante dropdown (por defecto)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={clsx('gap-2 border-0 rounded-full', className)}
          title={title ?? t('nav.languageSelector')}
        >
          <Globe className="h-4 w-4" />
          {showLabel && (
            <span className="hidden sm:inline-block">
              {currentLanguage.nativeName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        avoidCollisions={true}
        style={{
          maxWidth: 'calc(100vw - 32px)',
          right: '0px',
          left: 'auto',
        }}
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={clsx(
              'flex items-center gap-2',
              i18n.language === language.code
                ? 'bg-accent text-background'
                : 'bg-background'
            )}
          >
            <span className="text-lg">{language.flag}</span>
            <span>{language.nativeName}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}