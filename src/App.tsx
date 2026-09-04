import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { DiscoverPage } from './pages/public/DiscoverPage';
import { CompanyWebsitePage } from './pages/public/CompanyWebsitePage';
import { CompanyQrPage as PublicCompanyQrPage } from './pages/public/CompanyQrPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { MastermindLoginPage } from './pages/auth/MastermindLoginPage';
import { OwnerGatewayPage } from './pages/auth/OwnerGatewayPage';

// Studio & Wizard pages
import { WebsiteStudioPage } from './pages/studio/WebsiteStudioPage';
import { WebsiteWizardPage } from './pages/studio/WebsiteWizardPage';
import { WebsitesListPage } from './pages/websites/WebsitesListPage';

// Owner God Mode pages
import { OwnerOverviewPage } from './pages/owner/OwnerOverviewPage';
import { OwnerCompaniesPage } from './pages/owner/OwnerCompaniesPage';
import { MultiCompanyCreationPage } from './pages/owner/MultiCompanyCreationPage';
import { BulkCompanyImportPage } from './pages/owner/BulkCompanyImportPage';
import { OwnerCompanyDetailPage } from './pages/owner/OwnerCompanyDetailPage';
import { OwnerQrPage } from './pages/owner/OwnerQrPage';
import { OwnerLeadsPage } from './pages/owner/OwnerLeadsPage';
import { OwnerShowcasePage } from './pages/owner/OwnerShowcasePage';
import { OwnerThemesPage } from './pages/owner/OwnerThemesPage';
import { OwnerSettingsPage } from './pages/owner/OwnerSettingsPage';
import { OwnerHealthPage } from './pages/owner/OwnerHealthPage';
import { OwnerAuditPage } from './pages/owner/OwnerAuditPage';
import { OwnerVerificationMatrixPage } from './pages/owner/OwnerVerificationMatrixPage';

// Admin Portal pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminTeamPage } from './pages/admin/AdminTeamPage';

// Company Workstation pages
import { CompanyHubPage } from './pages/company/CompanyHubPage';
import { CompanyProductsPage } from './pages/company/CompanyProductsPage';
import { CompanyReviewsPage } from './pages/company/CompanyReviewsPage';
import { CompanyOffersPage } from './pages/company/CompanyOffersPage';
import { CompanyProfilePage } from './pages/company/CompanyProfilePage';
import { CompanyQrPage as WorkspaceCompanyQrPage } from './pages/company/CompanyQrPage';
import { SchoolAcademicHubPage } from './pages/school/SchoolAcademicHubPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const isMastermindRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/mastermind') || window.location.pathname.startsWith('/owner')
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-amber-400 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={isMastermindRoute ? "/mastermindlogin" : "/login"} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective home
    if (user.role === 'OWNER') return <Navigate to="/mastermind" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'SUB_ADMIN') return <Navigate to={`/company/${user.assignedCompanyId || ''}`} replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Smart Dashboard Redirection based on active user role
const DashboardDispatcher: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-amber-400 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'OWNER') return <Navigate to="/mastermind" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'SUB_ADMIN') return <Navigate to={`/company/${user.assignedCompanyId || ''}`} replace />;
  return <Navigate to="/" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Discovery Platform with PublicLayout */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/discover"
            element={
              <PublicLayout>
                <DiscoverPage />
              </PublicLayout>
            }
          />
          <Route
            path="/search"
            element={
              <PublicLayout>
                <DiscoverPage />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <PublicLayout>
                <LoginPage />
              </PublicLayout>
            }
          />

          {/* Hidden Mastermind Login Portal (/mastermindlogin) */}
          <Route path="/mastermindlogin" element={<MastermindLoginPage />} />
          <Route path="/mastermind/login" element={<MastermindLoginPage />} />
          <Route path="/owner/gateway" element={<MastermindLoginPage />} />
          <Route path="/platform-access" element={<MastermindLoginPage />} />

          {/* Standalone Public Company Web Pages & Printable Stand Cards */}
          <Route path="/c/:slug" element={<CompanyWebsitePage />} />
          <Route path="/c/:slug/:page" element={<CompanyWebsitePage />} />
          <Route path="/c/:slug/qr" element={<PublicCompanyQrPage />} />

          {/* Full Screen Website Studio Customizer & Wizard */}
          <Route
            path="/studio/:id"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <WebsiteStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <WebsitesListPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites/create"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <WebsiteWizardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites/:id"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <WebsiteStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites/:id/studio"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <WebsiteStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites/:id/pages"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <WebsiteStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites/:id/features"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <WebsiteStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites/:id/design"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <WebsiteStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites/:id/preview"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <WebsiteStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites/:id/publish"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <WebsiteStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/websites/:id/qr"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <PublicCompanyQrPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/wizard"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <WebsiteWizardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Smart Redirect for /dashboard */}
          <Route path="/dashboard" element={<DashboardDispatcher />} />

          {/* Protected Mastermind Routes */}
          <Route
            path="/mastermind"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerOverviewPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/companies"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerCompaniesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/companies/create"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <MultiCompanyCreationPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/companies/new"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <MultiCompanyCreationPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/companies/import"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <BulkCompanyImportPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/companies/:id"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerCompanyDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/websites"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <WebsitesListPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/admins"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <AdminTeamPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/sub-admins"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <AdminTeamPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/categories"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerThemesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/features"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerThemesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/qr"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerQrPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/leads"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerLeadsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/showcase"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerShowcasePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/themes"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerThemesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/settings"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/health"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/system-health"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/audit"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerAuditPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/analytics"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/reports"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/traffic"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/events"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerAuditPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/security"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerVerificationMatrixPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/verify"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerVerificationMatrixPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/export"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mastermind/data-export"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Owner God Mode Routes */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerOverviewPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/companies"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerCompaniesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/companies/create"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <MultiCompanyCreationPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/companies/new"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <MultiCompanyCreationPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/companies/import"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <BulkCompanyImportPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/companies/:id"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerCompanyDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/websites"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <WebsitesListPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/admins"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <AdminTeamPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/sub-admins"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <AdminTeamPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/categories"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerThemesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/features"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerThemesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/qr"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerQrPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/leads"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerLeadsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/showcase"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerShowcasePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/themes"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerThemesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/settings"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/health"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/system-health"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/audit"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerAuditPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/analytics"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/reports"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/traffic"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerHealthPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/events"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerAuditPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/security"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerVerificationMatrixPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/verify"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerVerificationMatrixPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/export"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/data-export"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout>
                  <OwnerSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Portal Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
                <DashboardLayout>
                  <AdminDashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
                <DashboardLayout>
                  <OwnerCompaniesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies/:id"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
                <DashboardLayout>
                  <OwnerCompanyDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/websites"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
                <DashboardLayout>
                  <WebsitesListPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/qr"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
                <DashboardLayout>
                  <OwnerQrPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leads"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
                <DashboardLayout>
                  <OwnerLeadsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/team"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
                <DashboardLayout>
                  <AdminTeamPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Company Workstation Routes (Hub, Products, Reviews, Offers, Profile, QR) */}
          <Route
            path="/company/:id"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <CompanyHubPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/academic"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <SchoolAcademicHubPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/marklist"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <SchoolAcademicHubPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/school/:id"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <SchoolAcademicHubPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/school/:id/academic"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <SchoolAcademicHubPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/website"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <WebsiteStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/products"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <CompanyProductsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/reviews"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <CompanyReviewsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/offers"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <CompanyOffersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/announcements"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <CompanyOffersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/profile"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <CompanyProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/qr"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <WorkspaceCompanyQrPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id/analytics"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'SUB_ADMIN']}>
                <DashboardLayout>
                  <CompanyHubPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
