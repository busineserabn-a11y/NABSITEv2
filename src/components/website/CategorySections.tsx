import React, { useState } from 'react';
import {
  Coffee,
  Globe,
  Wifi,
  Sparkles,
  BookOpen,
  GraduationCap,
  Users,
  Building2,
  Award,
  Calendar,
  ShieldCheck,
  Bed,
  CheckCircle,
  Utensils,
  CalendarCheck,
  Stethoscope,
  UserCheck,
  CalendarPlus,
  AlertCircle,
  Scissors,
  Tag,
  Image as ImageIcon,
  Dumbbell,
  Clock,
  ChevronRight,
  Phone,
  Send,
  Star,
  MapPin,
  Flame,
  Check,
  Heart,
  ChevronDown,
  Info,
  Layers,
} from 'lucide-react';
import { Company, WebsiteConfig, SectionConfig } from '../../types';

interface CategorySectionProps {
  company: Company;
  config: WebsiteConfig;
  section?: SectionConfig;
  onActionClick?: (action: string, target?: string) => void;
}

// ===========================================================================
// 1. CAFÉ & SPECIALTY COFFEE SECTIONS
// ===========================================================================

export const SpecialtyBrewsSection: React.FC<CategorySectionProps> = ({ company, config, section, onActionClick }) => {
  const brews = [
    {
      name: 'Single-Origin Yirgacheffe Pour-Over',
      method: 'V60 / Chemex',
      notes: 'Jasmine blossom, bergamot, lemon curd, wild honey',
      roast: 'Light Roast',
      price: '180 ETB',
      badge: 'Barista Recommendation',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Double Ristretto Flat White',
      method: 'Custom Slayer Espresso',
      notes: 'Dark chocolate, toasted hazelnut, velvety microfoam',
      roast: 'Medium Roast',
      price: '160 ETB',
      badge: 'House Favorite',
      image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Nitro 18-Hour Cold Drip',
      method: 'Slow Kyoto Drip + Nitrogen',
      notes: 'Blackberry, cacao nibs, silky creamy finish',
      roast: 'Medium-Dark',
      price: '220 ETB',
      badge: 'Seasonal Reserve',
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Artisan Cardamom Spiced Latte',
      method: 'Espresso + Fresh Botanical Steamed Milk',
      notes: 'Wild cardamom pods, cinnamon bark, raw cane sugar',
      roast: 'Signature Blend',
      price: '190 ETB',
      badge: 'Addis Heritage',
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs">
          <Coffee className="w-3.5 h-3.5 text-amber-600" />
          <span>{section?.badgeText || 'SPECIALTY EXTRACTIONS'}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {section?.title || 'Signature Brews & Pour-Over Flights'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {section?.subtitle || 'Each cup is dialed in daily by our certified baristas to highlight unique altitude and terroir characteristics.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {brews.map((brew, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row gap-5 p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-amber-900/10 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group"
          >
            <img
              src={brew.image}
              alt={brew.name}
              className="w-full sm:w-36 h-36 rounded-2xl object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    {brew.badge}
                  </span>
                  <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                    {brew.price}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-amber-600 transition-colors">
                  {brew.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className="font-semibold">Brew:</span> {brew.method} • <span className="font-semibold">{brew.roast}</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 italic bg-amber-50/50 dark:bg-slate-900/50 p-2 rounded-xl border border-amber-100/50 dark:border-slate-800">
                  Notes: {brew.notes}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const BeanOriginsSection: React.FC<CategorySectionProps> = ({ section }) => {
  const origins = [
    {
      region: 'Yirgacheffe (Gedeo)',
      altitude: '1,900 - 2,200m',
      process: 'Washed / Sun-Dried',
      flavor: 'Jasmine, lemon blossom, peach tea, bergamot',
      coop: 'Idido Cooperative',
      badge: 'Floral & Bright',
    },
    {
      region: 'Guji (Hambela)',
      altitude: '2,000 - 2,300m',
      process: 'Natural Anaerobic',
      flavor: 'Wild blueberry, ripe strawberry, lavender honey',
      coop: 'Buku Abel Micro-Station',
      badge: 'Fruity & Exotic',
    },
    {
      region: 'Sidama (Bensa)',
      altitude: '1,950 - 2,150m',
      process: 'Fully Washed',
      flavor: 'Apricot, cane sugar, black tea, crisp citrus',
      coop: 'Bombe Washing Station',
      badge: 'Balanced & Sweet',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
            <Globe className="w-3.5 h-3.5" />
            <span>ETHIOPIAN TERROIRS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {section?.title || 'Single-Origin Direct-Trade Terroirs'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            We partner directly with high-altitude farming families across Oromia and Sidama.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {origins.map((origin, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 hover:border-amber-400 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">
                {origin.badge}
              </span>
              <span className="text-xs font-bold text-slate-400">{origin.altitude}</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{origin.region}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{origin.coop}</p>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Processing:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{origin.process}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Tasting Profile:</span>
                <p className="font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-slate-900 p-2 rounded-xl">
                  {origin.flavor}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const CozySpacesSection: React.FC<CategorySectionProps> = ({ section }) => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-900 via-amber-950 to-stone-950 text-white border border-amber-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs">
              <Wifi className="w-3.5 h-3.5" />
              <span>DIGITAL NOMAD & CREATIVE HAVEN</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {section?.title || 'High-Speed WiFi, Sunlit Corners & Quiet Focus'}
            </h2>
            <p className="text-sm text-amber-100/80 leading-relaxed">
              {section?.subtitle || 'Engineered for remote professionals, authors, and deep thinkers. Enjoy dedicated power outlets at every booth, ergonomic wooden seating, and ambient jazz.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <div className="text-xl font-extrabold text-amber-300">150 Mbps</div>
                <div className="text-[11px] text-amber-100/70">Dedicated Fiber WiFi</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <div className="text-xl font-extrabold text-amber-300">100%</div>
                <div className="text-[11px] text-amber-100/70">Power Plug Coverage</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <div className="text-xl font-extrabold text-amber-300">Quiet Zone</div>
                <div className="text-[11px] text-amber-100/70">Upstairs Reading Loft</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80"
              alt="Cafe workspace"
              className="rounded-2xl h-36 w-full object-cover shadow-md"
              referrerPolicy="no-referrer"
            />
            <img
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80"
              alt="Sunlit cafe terrace"
              className="rounded-2xl h-36 w-full object-cover shadow-md mt-4"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// ===========================================================================
// 2. SCHOOL & EDUCATION SECTIONS
// ===========================================================================

export const PrincipalMessageSection: React.FC<CategorySectionProps> = ({ company, section }) => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4 text-center md:text-left space-y-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
              alt="Principal"
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl object-cover mx-auto md:mx-0 border-4 border-blue-50 dark:border-slate-700 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dr. Aster Mengesha</h3>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Head of School & Academic Director</p>
              <p className="text-[11px] text-slate-400">PhD in Curriculum & Instruction</p>
            </div>
          </div>

          <div className="md:col-span-8 space-y-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-6 md:pt-0 md:pl-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-xs">
              <Award className="w-3.5 h-3.5" />
              <span>LEADERSHIP WELCOME</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {section?.title || `Welcome to ${company.name}`}
            </h2>
            <blockquote className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "We believe that education is not simply about academic test scores—it is about igniting lifelong intellectual curiosity, fostering resilient moral character, and equipping every student to solve complex global challenges."
            </blockquote>
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Academic Integrity</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Holistic Growth</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Global Citizenship</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const AcademicProgramsSection: React.FC<CategorySectionProps> = ({ section, onActionClick }) => {
  const programs = [
    {
      level: 'Early Childhood & Kindergarten',
      grades: 'Ages 3 - 5',
      focus: 'Play-based discovery, bilingual foundation, phonics & early numeracy',
      features: ['Reggio Emilia inspired ateliers', 'Native language & English immersion', 'Motor skill enrichment'],
      badge: 'Foundation Years',
      icon: BookOpen,
      color: 'bg-emerald-500',
    },
    {
      level: 'Primary Academy',
      grades: 'Grades 1 - 6',
      focus: 'Inquiry-driven STEM, reading comprehension, social sciences & computational logic',
      features: ['Robotics & coding lab', 'Young Authors creative writing', 'Science fair mentorship'],
      badge: 'Core Academic Stages',
      icon: GraduationCap,
      color: 'bg-blue-600',
    },
    {
      level: 'Junior Secondary School',
      grades: 'Grades 7 - 8',
      focus: 'Advanced math, chemistry, biology, ethics & world geography',
      features: ['STEM laboratory rotations', 'Model United Nations', 'Competitive athletics'],
      badge: 'Middle Years',
      icon: Building2,
      color: 'bg-indigo-600',
    },
    {
      level: 'Senior Secondary & College Prep',
      grades: 'Grades 9 - 12',
      focus: 'National entrance exams mastery, AP courses, university counseling & leadership',
      features: ['100% University placement support', 'Scholarship portfolio coaching', 'Leadership council'],
      badge: 'Graduation Pathway',
      icon: Award,
      color: 'bg-amber-600',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-xs">
          <BookOpen className="w-3.5 h-3.5" />
          <span>CURRICULUM DIVISIONS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {section?.title || 'Academic Divisions & Learning Pathways'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {section?.subtitle || 'Engineered to support students through every cognitive, emotional, and social development stage.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.map((prog, idx) => {
          const IconComponent = prog.icon;
          return (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl ${prog.color} text-white shadow-xs`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">
                        {prog.badge}
                      </span>
                      <div className="text-xs text-slate-400 font-semibold">{prog.grades}</div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{prog.level}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{prog.focus}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                  {prog.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onActionClick?.('page', 'contact')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-800 dark:text-slate-200 hover:text-blue-600 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Inquire for Admission</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const FacultySection: React.FC<CategorySectionProps> = ({ section }) => {
  const faculty = [
    {
      name: 'Yared Bekele, M.Ed.',
      role: 'Head of STEM & Robotics',
      degree: 'M.Ed. in Applied Mathematics',
      bio: '12+ years mentoring national robotics championship finalists.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Helen Tadesse, M.A.',
      role: 'Head of Languages & Literature',
      degree: 'M.A. in Comparative Linguistics',
      bio: 'Author and passionate advocate of creative bilingual literacy.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dawit Solomon, M.Sc.',
      role: 'Director of Science Laboratories',
      degree: 'M.Sc. in Physics & Electronics',
      bio: 'Specialized in experiential laboratory inquiry and experimental physics.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Selamawit Kebede',
      role: 'Lead Early Years Educator',
      degree: 'B.A. in Early Childhood Psychology',
      bio: 'Certified in Reggio Emilia and progressive Montessori child development.',
      image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
          <Users className="w-3.5 h-3.5" />
          <span>DISTINGUISHED EDUCATORS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {section?.title || 'Faculty & Academic Leadership'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {section?.subtitle || 'Passionate educators with proven pedagogical mastery committed to personalized student success.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {faculty.map((member, idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-3 hover:shadow-md transition-all"
          >
            <img
              src={member.image}
              alt={member.name}
              className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-indigo-100 dark:border-slate-700"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{member.name}</h3>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{member.role}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{member.degree}</p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">{member.bio}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const AchievementsSection: React.FC<CategorySectionProps> = ({ section }) => {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-blue-900 text-white text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-400">100%</div>
          <div className="text-xs font-bold uppercase tracking-wider">University Placement</div>
          <p className="text-[11px] text-blue-200">Across leading national & global universities</p>
        </div>
        <div className="p-6 rounded-3xl bg-blue-950 text-white text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">1:15</div>
          <div className="text-xs font-bold uppercase tracking-wider">Teacher-Student Ratio</div>
          <p className="text-[11px] text-blue-200">Personalized mentorship for every learner</p>
        </div>
        <div className="p-6 rounded-3xl bg-slate-900 text-white text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-400">25+</div>
          <div className="text-xs font-bold uppercase tracking-wider">Extracurricular Clubs</div>
          <p className="text-[11px] text-slate-300">Robotics, debate, choir, athletics & arts</p>
        </div>
        <div className="p-6 rounded-3xl bg-slate-950 text-white text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-blue-400">Grade 'A'</div>
          <div className="text-xs font-bold uppercase tracking-wider">Ministry Accreditation</div>
          <p className="text-[11px] text-slate-300">Highest quality academic certification</p>
        </div>
      </div>
    </section>
  );
};

// ===========================================================================
// 3. HOTEL & RESORT SECTIONS
// ===========================================================================

export const RoomsSection: React.FC<CategorySectionProps> = ({ section, onActionClick }) => {
  const rooms = [
    {
      name: 'Deluxe King Executive Room',
      sqft: '42 m²',
      guests: '2 Guests',
      bed: '1 King Bed',
      price: '$140 / night',
      features: ['City skyline view', 'Marble rain shower', 'Nespresso machine', 'High-speed WiFi'],
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80',
      badge: 'Popular Choice',
    },
    {
      name: 'Diplomatic Luxury Suite',
      sqft: '78 m²',
      guests: '3 Guests',
      bed: '1 King + Living Area',
      price: '$260 / night',
      features: ['Separate living room', 'Deep soaking tub', 'Executive lounge access', 'Complimentary breakfast'],
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
      badge: 'Executive Privilege',
    },
    {
      name: 'Presidential Penthouse Suite',
      sqft: '145 m²',
      guests: '4 Guests',
      bed: '2 Master Bedrooms',
      price: '$550 / night',
      features: ['360° Panoramic balcony', 'Private butler service', 'Dining room for 8', 'Airport limousine'],
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&auto=format&fit=crop&q=80',
      badge: 'Ultra Luxury',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs">
            <Bed className="w-3.5 h-3.5 text-amber-600" />
            <span>LUXURY ACCOMMODATIONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {section?.title || 'Featured Rooms & Designer Suites'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {section?.subtitle || 'Each room is acoustically insulated and appointed with Egyptian cotton linens.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {rooms.map((room, idx) => (
          <div
            key={idx}
            className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all"
          >
            <div className="relative">
              <img
                src={room.image}
                alt={room.name}
                className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-extrabold tracking-wider uppercase">
                {room.badge}
              </span>
              <span className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold shadow-md">
                {room.price}
              </span>
            </div>

            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                  {room.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>{room.sqft}</span>
                  <span>•</span>
                  <span>{room.guests}</span>
                  <span>•</span>
                  <span>{room.bed}</span>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-4">
                  {room.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onActionClick?.('page', 'contact')}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <CalendarCheck className="w-4 h-4 text-amber-400" />
                  <span>Reserve Direct</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const AmenitiesSection: React.FC<CategorySectionProps> = ({ section }) => {
  const amenities = [
    { title: 'Temperature Infinity Pool', desc: 'Rooftop heated swimming pool overlooking panoramic city hills' },
    { title: 'Restorative Wellness Spa', desc: 'Swedish sauna, aromatic steam rooms, and therapeutic massage' },
    { title: 'Airport Chauffeur Shuttle', desc: 'Complimentary private VIP transport to and from Bole International Airport' },
    { title: '24-Hour Concierge', desc: 'Bespoke tour arrangements, diplomatic clearance, and restaurant reservations' },
    { title: 'Executive Fitness Gym', desc: 'Technogym cardio & strength equipment with private training instructors' },
    { title: 'High-Speed Fiber Connectivity', desc: 'Encrypted ultra-fast WiFi across all private suites and public areas' },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>RESORT EXPERIENCES</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {section?.title || 'World-Class Amenities & Hospitality'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {section?.subtitle || 'Every convenience curated to ensure effortless executive stays and restorative leisure.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {amenities.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 hover:border-amber-400 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-xs">
              0{idx + 1}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// ===========================================================================
// 4. HEALTHCARE & CLINIC SECTIONS
// ===========================================================================

export const EmergencyNoticeSection: React.FC<CategorySectionProps> = ({ company, section }) => {
  return (
    <section className="py-4 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="p-4 sm:p-5 rounded-2xl bg-red-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="p-2.5 rounded-xl bg-white/20 shrink-0">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base">
              {section?.title || '24/7 Medical Emergency & Urgent Care Triage'}
            </div>
            <div className="text-xs text-red-100">
              {section?.subtitle || 'Immediate outpatient response for acute medical conditions and emergency ambulance dispatch.'}
            </div>
          </div>
        </div>

        <a
          href={`tel:${company.phone || '+251116614040'}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-red-700 font-extrabold text-xs hover:bg-red-50 transition-colors shrink-0 shadow-md"
        >
          <Phone className="w-4 h-4" />
          <span>Call Emergency Hotline</span>
        </a>
      </div>
    </section>
  );
};

export const MedicalServicesSection: React.FC<CategorySectionProps> = ({ section, onActionClick }) => {
  const departments = [
    {
      title: 'General & Internal Medicine',
      desc: 'Comprehensive adult diagnostics, chronic disease management (hypertension, diabetes), and acute care.',
      badge: 'Primary Care',
    },
    {
      title: 'Pediatrics & Child Wellness',
      desc: 'Infant growth milestones, scheduled immunizations, pediatric nutrition, and acute infection treatment.',
      badge: 'Pediatric Care',
    },
    {
      title: 'Cardiology & Diagnostic ECG',
      desc: 'Cardiac consultation, 12-lead digital ECG, echocardiogram diagnostics, and cholesterol risk profiles.',
      badge: 'Cardiology',
    },
    {
      title: 'Obstetrics & Gynecology',
      desc: 'Prenatal ultrasound imaging, maternal wellness, reproductive health screenings, and family planning.',
      badge: "Women's Health",
    },
    {
      title: 'Diagnostic Laboratory & Imaging',
      desc: 'Automated full blood counts, lipid panels, thyroid testing, PCR diagnostics, and digital ultrasound.',
      badge: 'Diagnostics',
    },
    {
      title: 'Dental & Oral Surgery',
      desc: 'Preventative teeth cleaning, restorative fillings, root canals, orthodontic alignment, and oral hygiene.',
      badge: 'Dental Suite',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 font-bold text-xs">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>CLINICAL SPECIALTIES</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {section?.title || 'Specialized Medical Departments'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {section?.subtitle || 'Delivering evidence-based patient care backed by modern diagnostic laboratories.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {departments.map((dept, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 hover:border-sky-500 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-extrabold uppercase">
                {dept.badge}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{dept.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{dept.desc}</p>
            </div>
            <button
              onClick={() => onActionClick?.('page', 'contact')}
              className="pt-2 text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 hover:underline"
            >
              <span>Book Appointment</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export const DoctorsSection: React.FC<CategorySectionProps> = ({ section, onActionClick }) => {
  const doctors = [
    {
      name: 'Dr. Michael Haile, MD',
      spec: 'Consultant Cardiologist',
      experience: '14+ Years Clinical Experience',
      days: 'Mon, Wed, Fri',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Rahel Girma, MD',
      spec: 'Consultant Pediatrician',
      experience: '11+ Years Clinical Experience',
      days: 'Tue, Thu, Sat',
      image: 'https://images.unsplash.com/photo-1594824813589-980b15ee7610?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dr. Yonas Alemayehu, MD',
      spec: 'Internal Medicine Specialist',
      experience: '16+ Years Clinical Experience',
      days: 'Daily (Mon - Sat)',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 font-bold text-xs">
          <UserCheck className="w-3.5 h-3.5" />
          <span>BOARD-CERTIFIED FACULTY</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {section?.title || 'Meet Our Consultant Physicians'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {section?.subtitle || 'Compassionate medical specialists dedicated to thorough diagnostics and personalized care.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {doctors.map((doc, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-3 hover:shadow-md transition-all"
          >
            <img
              src={doc.image}
              alt={doc.name}
              className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-sky-100 dark:border-slate-700"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{doc.name}</h3>
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">{doc.spec}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{doc.experience}</p>
            </div>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-slate-900 text-sky-900 dark:text-sky-300 text-xs font-semibold">
              Clinic Days: {doc.days}
            </div>
            <button
              onClick={() => onActionClick?.('page', 'contact')}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors"
            >
              Request Consultation
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

// ===========================================================================
// 5. BEAUTY & SALON SECTIONS
// ===========================================================================

export const TreatmentsSection: React.FC<CategorySectionProps> = ({ section, onActionClick }) => {
  const treatments = [
    {
      category: 'Hair Styling & Couture Coloring',
      items: [
        { name: 'Custom Balayage & Gloss Toner', time: '150 min', price: '2,500 ETB' },
        { name: 'Keratin Smoothing & Restorative Therapy', time: '120 min', price: '3,200 ETB' },
        { name: 'Precision Designer Cut & Silk Press', time: '60 min', price: '950 ETB' },
      ],
    },
    {
      category: 'Facial Aesthetics & Organic Skin Care',
      items: [
        { name: 'Hydra-Infusion Brightening Facial', time: '75 min', price: '1,800 ETB' },
        { name: 'Collagen Plumping & Micro-current Lift', time: '90 min', price: '2,400 ETB' },
        { name: 'Detoxifying Organic Botanical Peel', time: '60 min', price: '1,400 ETB' },
      ],
    },
    {
      category: 'Nail Lounge & Hand Care',
      items: [
        { name: 'Russian E-File Gel Manicure', time: '60 min', price: '850 ETB' },
        { name: 'Luxury Spa Pedicure & Paraffin Bath', time: '75 min', price: '1,100 ETB' },
        { name: 'Custom Sculpted Gel Extensions', time: '90 min', price: '1,600 ETB' },
      ],
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-700 dark:text-pink-400 font-bold text-xs">
          <Scissors className="w-3.5 h-3.5" />
          <span>BESPOKE BEAUTY RITUALS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {section?.title || 'Services & Treatment Menu'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {section?.subtitle || 'Crafted with premium cruelty-free formulations and specialized techniques.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {treatments.map((cat, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-pink-100 dark:border-slate-700 shadow-sm space-y-4"
          >
            <h3 className="text-base font-extrabold text-pink-800 dark:text-pink-300 border-b border-pink-50 dark:border-slate-700 pb-2">
              {cat.category}
            </h3>
            <div className="space-y-3">
              {cat.items.map((item, iIdx) => (
                <div key={iIdx} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>{item.name}</span>
                    <span className="text-pink-600 dark:text-pink-400 font-mono">{item.price}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ===========================================================================
// 6. FITNESS & GYM SECTIONS
// ===========================================================================

export const WorkoutProgramsSection: React.FC<CategorySectionProps> = ({ section, onActionClick }) => {
  const programs = [
    {
      title: 'Functional HIIT & Conditioning',
      intensity: 'High Intensity',
      burn: '700+ kcal / session',
      desc: 'Rapid metabolic conditioning with kettlebells, rowers, and plyometric drills.',
      badge: 'Fat Loss & Stamina',
    },
    {
      title: 'Olympic Lifting & Hypertrophy',
      intensity: 'Maximum Strength',
      burn: '500+ kcal / session',
      desc: 'Barbell technique, compound powerlifting, and structured progressive overload.',
      badge: 'Muscle & Power',
    },
    {
      title: 'Boxing & Tactical Strike',
      intensity: 'High Intensity',
      burn: '800+ kcal / session',
      desc: 'Heavy bag combinations, footwork agility, core rotational power, and pad work.',
      badge: 'Agility & Combat',
    },
    {
      title: 'Mobility, Yoga & Active Recovery',
      intensity: 'Low-Medium Intensity',
      burn: '350+ kcal / session',
      desc: 'Fascial release, joint mobility, deep breathing, and restorative core stability.',
      badge: 'Flexibility & Longevity',
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-bold text-xs">
          <Dumbbell className="w-3.5 h-3.5" />
          <span>PERFORMANCE TRAINING</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {section?.title || 'High-Impact Workout Programs'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {section?.subtitle || 'Engineered by elite strength coaches to deliver measurable athletic results.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {programs.map((prog, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-4 hover:border-red-500 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 text-[10px] font-extrabold uppercase">
                {prog.badge}
              </span>
              <h3 className="text-lg font-bold">{prog.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{prog.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Burn:</span>
                <span className="font-bold text-red-400">{prog.burn}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pace:</span>
                <span className="font-semibold text-white">{prog.intensity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const ClassScheduleSection: React.FC<CategorySectionProps> = ({ section }) => {
  const schedule = [
    { time: '06:00 AM', class: 'Dawn Warrior HIIT', coach: 'Coach Abel', room: 'Arena A' },
    { time: '08:30 AM', class: 'Power Hypertrophy', coach: 'Coach Marcus', room: 'Strength Zone' },
    { time: '12:15 PM', class: 'Lunchtime Express Circuit', coach: 'Coach Sara', room: 'Arena B' },
    { time: '05:30 PM', class: 'Championship Boxing', coach: 'Coach Tadesse', room: 'Ring Studio' },
    { time: '07:00 PM', class: 'Candlelight Recovery Yoga', coach: 'Coach Maya', room: 'Zen Loft' },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>LIVE TIMETABLE</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              {section?.title || 'Daily Group Class Schedule'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">Walk-ins welcome • Arrive 10 min early</span>
        </div>

        <div className="divide-y divide-slate-800">
          {schedule.map((item, idx) => (
            <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-red-400 text-sm sm:text-base w-24">{item.time}</span>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-white">{item.class}</h4>
                  <p className="text-xs text-slate-400">Instructor: {item.coach}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium w-fit">
                {item.room}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===========================================================================
// 7. RESTAURANT & FINE DINING SECTIONS
// ===========================================================================

export const ChefStorySection: React.FC<CategorySectionProps> = ({ company, section }) => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="p-8 sm:p-12 rounded-3xl bg-amber-950 text-amber-50 border border-amber-900 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs">
              <Flame className="w-3.5 h-3.5" />
              <span>CULINARY HERITAGE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {section?.title || 'Authentic Recipes Sourced from Organic Soil'}
            </h2>
            <p className="text-sm text-amber-200/80 leading-relaxed">
              {section?.subtitle || 'Our kitchen blends ancient slow-cooking clay pot techniques with freshly ground highland berbere and grass-fed organic meats. Every dish honors generation-old Ethiopian dining rituals.'}
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-amber-300">
              <span>★ 100% Organic Farm-to-Table</span>
              <span>•</span>
              <span>★ Wood-Fired Clay Pots</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80"
              alt="Restaurant kitchen"
              className="rounded-2xl h-56 w-full object-cover border border-amber-800 shadow-md"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export const TableReservationSection: React.FC<CategorySectionProps> = ({ company, section, onActionClick }) => {
  const [partySize, setPartySize] = useState('2 Guests');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-800 border border-amber-900/10 dark:border-slate-700 shadow-sm max-w-2xl mx-auto text-center space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold text-xs">
            <Utensils className="w-3.5 h-3.5" />
            <span>TABLE RESERVATIONS</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            {section?.title || 'Book Your Dining Experience'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {section?.subtitle || 'Reserve your table for lunch or dinner. For large gatherings, please call directly.'}
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Reservation request received! Our host will confirm via phone shortly.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Party Size</label>
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option>1 Guest</option>
                  <option>2 Guests</option>
                  <option>4 Guests</option>
                  <option>6 Guests</option>
                  <option>8+ Guests</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Time Slot</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option>12:00 PM (Lunch)</option>
                  <option>01:30 PM (Lunch)</option>
                  <option>06:30 PM (Dinner)</option>
                  <option>07:30 PM (Dinner)</option>
                  <option>09:00 PM (Late Dinner)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition-colors shadow-md"
            >
              Confirm Table Reservation
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

// ===========================================================================
// CATEGORY SECTION DISPATCHER
// ===========================================================================

export const CategorySectionDispatcher: React.FC<CategorySectionProps> = (props) => {
  const { section } = props;
  if (!section || section.isVisible === false) return null;

  switch (section.type) {
    // Café
    case 'specialty_brews':
    case 'curated_menu':
      return <SpecialtyBrewsSection {...props} />;
    case 'coffee_origin':
    case 'bean_origins':
      return <BeanOriginsSection {...props} />;
    case 'cafe_vibe':
    case 'cozy_spaces':
    case 'pastry_showcase':
      return <CozySpacesSection {...props} />;

    // Education
    case 'academic_programs':
    case 'programs':
    case 'admissions':
      return <AcademicProgramsSection {...props} />;
    case 'faculty':
      return <FacultySection {...props} />;
    case 'campus_life':
    case 'campus_tour':
    case 'achievements':
    case 'events':
      return <AchievementsSection {...props} />;
    case 'principal_message':
      return <PrincipalMessageSection {...props} />;

    // Hotel
    case 'rooms':
      return <RoomsSection {...props} />;
    case 'hotel_amenities':
    case 'amenities':
    case 'dining':
    case 'reservation':
    case 'booking_cta':
      return <AmenitiesSection {...props} />;

    // Healthcare
    case 'medical_services':
    case 'departments':
      return <MedicalServicesSection {...props} />;
    case 'doctors_directory':
    case 'doctors':
    case 'appointment_booking':
      return <DoctorsSection {...props} />;
    case 'emergency_notice':
      return <EmergencyNoticeSection {...props} />;

    // Beauty
    case 'beauty_treatments':
    case 'treatments':
    case 'stylist_directory':
    case 'stylists':
    case 'price_list':
    case 'pricing_tiers':
    case 'beauty_gallery':
    case 'before_after':
      return <TreatmentsSection {...props} />;

    // Fitness
    case 'fitness_classes':
    case 'workout_programs':
    case 'trainers':
    case 'membership_plans':
    case 'membership_tiers':
      return <WorkoutProgramsSection {...props} />;
    case 'class_schedule':
      return <ClassScheduleSection {...props} />;

    // Restaurant
    case 'chef_signature':
    case 'chef_story':
    case 'signature_dishes':
      return <ChefStorySection {...props} />;
    case 'table_reservation':
      return <TableReservationSection {...props} />;

    default:
      return null;
  }
};

