import React, { useState } from 'react';
import { ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Company, SchoolFeatureKey } from '../../types';
import { api } from '../../lib/api';

interface FeatureDisabledNoticeProps {
  company: Company;
  featureKey: SchoolFeatureKey;
  featureName: string;
  isOwner: boolean;
  onFeatureEnabled?: (updatedCompany: Company) => void;
  onNavigateFeatures?: () => void;
}

export const FeatureDisabledNotice: React.FC<FeatureDisabledNoticeProps> = ({
  company,
  featureKey,
  featureName,
  isOwner,
  onFeatureEnabled,
  onNavigateFeatures,
}) => {
  const [enabling, setEnabling] = useState(false);

  const handleQuickEnable = async () => {
    setEnabling(true);
    try {
      const updatedFeatures = {
        ...(company.schoolFeatures || {}),
        [featureKey]: true,
      };
      const updatedComp = await api.updateSchoolFeatures(company.id, updatedFeatures);
      if (onFeatureEnabled) {
        onFeatureEnabled(updatedComp);
      }
    } catch (err) {
      console.error('Failed to enable feature:', err);
    } finally {
      setEnabling(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900/50 p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {featureName} is Currently Disabled
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            The <strong>{featureName}</strong> feature has been turned off in the school feature configuration for{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{company.name}</span>.
            Its management workspace and data entry interfaces are inactive.
          </p>
        </div>

        {isOwner ? (
          <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              isLoading={enabling}
              onClick={handleQuickEnable}
            >
              Enable {featureName} Now
            </Button>
            {onNavigateFeatures && (
              <Button
                variant="outline"
                size="md"
                onClick={onNavigateFeatures}
                icon={ArrowRight}
              >
                Manage All Features
              </Button>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 italic">
            Only the school Owner can enable this feature in the School Feature Configuration.
          </p>
        )}
      </div>
    </div>
  );
};
