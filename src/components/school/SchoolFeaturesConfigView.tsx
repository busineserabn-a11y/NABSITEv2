import React, { useState } from 'react';
import {
  Settings2,
  Calendar,
  Layers,
  DoorOpen,
  Search,
  Users,
  FileCheck2,
  CalendarCheck,
  ShieldAlert,
  HelpCircle,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  Company,
  SchoolFeatureKey,
  SCHOOL_FEATURE_DEFINITIONS,
  DEFAULT_SCHOOL_FEATURES,
} from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SchoolFeaturesConfigViewProps {
  company: Company;
  onFeaturesUpdated: (updatedCompany: Company) => void;
  onNavigateTab: (tabKey: string) => void;
}

export const SchoolFeaturesConfigView: React.FC<SchoolFeaturesConfigViewProps> = ({
  company,
  onFeaturesUpdated,
  onNavigateTab,
}) => {
  const currentFeatures: Record<SchoolFeatureKey, boolean> = {
    ...DEFAULT_SCHOOL_FEATURES,
    ...(company.schoolFeatures as Record<SchoolFeatureKey, boolean>),
  };

  const [features, setFeatures] = useState<Record<SchoolFeatureKey, boolean>>(currentFeatures);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getFeatureIcon = (key: SchoolFeatureKey) => {
    switch (key) {
      case 'academic_years':
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      case 'grades':
        return <Layers className="w-5 h-5 text-emerald-500" />;
      case 'sections':
        return <DoorOpen className="w-5 h-5 text-amber-500" />;
      case 'global_search':
        return <Search className="w-5 h-5 text-sky-500" />;
      case 'student_roster':
        return <Users className="w-5 h-5 text-teal-500" />;
      case 'marklist':
        return <FileCheck2 className="w-5 h-5 text-violet-500" />;
      case 'class_attendance':
        return <CalendarCheck className="w-5 h-5 text-blue-500" />;
      case 'discipline_behavior':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'school_faq':
        return <HelpCircle className="w-5 h-5 text-amber-500" />;
      case 'announcements':
        return <Megaphone className="w-5 h-5 text-orange-500" />;
      default:
        return <Sliders className="w-5 h-5 text-amber-500" />;
    }
  };

  const handleToggle = (key: SchoolFeatureKey) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSetAll = (enabled: boolean) => {
    const updated: Record<SchoolFeatureKey, boolean> = { ...features };
    (Object.keys(updated) as SchoolFeatureKey[]).forEach((k) => {
      updated[k] = enabled;
    });
    setFeatures(updated);
    setSuccessMsg(null);
  };

  const handleReset = () => {
    setFeatures({ ...currentFeatures });
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updatedComp = await api.updateSchoolFeatures(company.id, features);
      onFeaturesUpdated(updatedComp);
      setSuccessMsg('School feature configuration saved successfully to Firestore! Changes are active immediately.');
    } catch (err: any) {
      console.error('Failed to update school features:', err);
      setErrorMsg(err.message || 'Failed to save feature configuration.');
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(features).filter(Boolean).length;
  const hasChanges = JSON.stringify(features) !== JSON.stringify(currentFeatures);

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Settings2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              School Feature Configuration
            </h2>
            <Badge variant="gold" size="sm">
              {enabledCount} of 10 Enabled
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Configure the real active school features for <span className="font-semibold text-slate-700 dark:text-slate-200">{company.name}</span>. Disabling a feature removes its management interface and prevents unauthorized access by sub-admins or staff.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSetAll(true)}
            className="text-xs"
          >
            Enable All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSetAll(false)}
            className="text-xs"
          >
            Disable All
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={handleReset}
              disabled={saving}
              className="text-xs"
            >
              Discard Changes
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            isLoading={saving}
            onClick={handleSave}
            disabled={!hasChanges && !saving}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Status Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCHOOL_FEATURE_DEFINITIONS.map((def) => {
          const isEnabled = !!features[def.key];
          return (
            <div
              key={def.key}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                isEnabled
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-2xl ${
                    isEnabled
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {getFeatureIcon(def.key)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {def.label}
                      </h3>
                      <Badge
                        variant={isEnabled ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {def.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  onClick={() => handleToggle(def.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">Key: {def.key}</span>
                {isEnabled ? (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(def.tabKey)}
                    className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Open Tab
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-slate-400 italic">Feature Inactive</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Isolation & Real Impact Notice */}
      <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-950 dark:text-blue-200">
            Real Enforcement Across School Management & Website
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Toggling a feature ON or OFF updates the Firestore document for this school. When disabled, the feature&apos;s UI tabs, data submission endpoints, and direct routes will be blocked immediately for this school while keeping other schools unaffected.
          </p>
        </div>
      </div>
    </div>
  );
};
