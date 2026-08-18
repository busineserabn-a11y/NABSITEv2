import React from 'react';

interface CompanyNameProps {
  name: string;
  shortName?: string;
  className?: string;
  maxWidth?: string; // e.g. 'max-w-[140px]', 'max-w-[200px]'
  variant?: 'normal' | 'compact' | 'badge' | 'button';
  icon?: React.ReactNode;
}

/**
 * Intelligent company name shortener to prevent button & card overflows
 */
export function getSmartShortName(fullName: string): string {
  if (!fullName) return '';
  if (fullName.length <= 18) return fullName;

  // Common corporate & establishment suffixes/prefixes to streamline
  let shortened = fullName
    .replace(/^The\s+/i, '')
    .replace(/\s+(Restaurant|Cafe|Café|Dining|Lounge|Bistro|Grill|Eatery|Kitchen)\s*(&|and)?\s*(Cafe|Restaurant|Lounge|Bar)?/gi, '')
    .replace(/\s+(Technologies|Technology|Tech|Solutions|Systems|Enterprises|PLC|Inc|LLC|Corp|Group|Holding|Holdings|International|Trading)\b/gi, '')
    .replace(/\s+(Specialized|General|Modern|Private|Hospital|Clinic|Center|Care)\s+(Hospital|Clinic|Center|Health)?/gi, '')
    .trim();

  // If still too long, take the first 2-3 words or truncate
  if (shortened.length > 22) {
    const words = shortened.split(' ');
    if (words.length > 2) {
      shortened = `${words[0]} ${words[1]}`;
    }
  }

  if (shortened.length > 20) {
    shortened = `${shortened.slice(0, 18)}…`;
  }

  return shortened || fullName;
}

export const CompanyName: React.FC<CompanyNameProps> = ({
  name,
  shortName,
  className = '',
  maxWidth,
  variant = 'normal',
  icon,
}) => {
  const full = name || 'Company';
  const computedShort = shortName || getSmartShortName(full);

  // Variant specific styling
  let containerClasses = 'inline-flex items-center gap-1.5 min-w-0';
  let textClasses = 'truncate select-none';

  if (variant === 'button' || variant === 'compact') {
    textClasses += ` ${maxWidth || 'max-w-[120px] sm:max-w-[180px]'}`;
  } else if (variant === 'badge') {
    textClasses += ` ${maxWidth || 'max-w-[100px] sm:max-w-[140px]'}`;
  } else if (maxWidth) {
    textClasses += ` ${maxWidth}`;
  }

  return (
    <span
      className={`${containerClasses} ${className}`}
      title={full}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className={textClasses}>
        {variant === 'button' || variant === 'compact' ? computedShort : full}
      </span>
    </span>
  );
};
