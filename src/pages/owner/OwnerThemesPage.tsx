import React, { useState } from 'react';
import { THEME_REGISTRY, BUSINESS_CATEGORIES, TEMPLATES_BY_CATEGORY } from '../../data/themes';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Layout, Type, Search, Sparkles, Layers, ShieldCheck, Compass, CheckCircle2 } from 'lucide-react';

export const OwnerThemesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const themes = THEME_REGISTRY;

  const filteredThemes = themes.filter((t) => {
    const cats = (t.categoryCompatibilities?.join(' ') || '') + ' ' + (t.category || '');
    const matchesCat =
      selectedCategory === 'all' ||
      (t.category && t.category.toLowerCase() === selectedCategory.toLowerCase()) ||
      cats.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.personality && t.personality.toLowerCase().includes(search.toLowerCase())) ||
      (t.layoutArchetype && t.layoutArchetype.toLowerCase().includes(search.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Global Template Library
            </h1>
            <Badge variant="gold" size="sm">
              324 Real Templates
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            18 bespoke website templates per business category across 18 unique industries (324 total layout architectures).
          </p>
        </div>

        <div className="w-full md:w-72">
          <Input
            icon={Search}
            placeholder="Search templates, archetypes, fonts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          All Categories ({themes.length})
        </button>
        {BUSINESS_CATEGORIES.map((cat) => {
          const count = TEMPLATES_BY_CATEGORY[cat]?.length || 18;
          const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((theme) => (
          <Card key={theme.id} variant="bordered" padding="none" className="overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div>
              {/* Theme Palette Bar */}
              <div className="h-16 flex items-stretch border-b border-slate-100 dark:border-slate-800">
                <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.primary }} />
                <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.secondary }} />
                <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.accent }} />
                <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.surface }} />
                <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.bg }} />
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {theme.category || theme.categoryCompatibilities?.[0] || 'Business'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {theme.badge && (
                      <Badge variant="success" size="sm">
                        {theme.badge}
                      </Badge>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      {theme.id.replace('tpl_', '')}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{theme.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-3">{theme.description}</p>
                </div>

                {theme.supportedFeatures && theme.supportedFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {theme.supportedFeatures.slice(0, 3).map((feat, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                        {feat}
                      </span>
                    ))}
                    {theme.supportedFeatures.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                        +{theme.supportedFeatures.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Type className="w-3 h-3" /> Typography:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{theme.typography?.headingFont} / {theme.typography?.bodyFont}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Layout className="w-3 h-3" /> Archetype:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{theme.layoutArchetype || theme.headerStyle || 'Standard'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="text-[11px] text-slate-400">Header: {theme.headerStyle} • Hero: {theme.heroStyle}</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Studio Ready
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
