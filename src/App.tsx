import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';

// Modules
import { DashboardView } from './components/dashboard/DashboardView';
import { MemberList } from './components/members/MemberList';
import { MemberForm } from './components/members/MemberForm';
import { MemberDetail } from './components/members/MemberDetail';
import { BookList } from './components/books/BookList';
import { BookForm } from './components/books/BookForm';
import { BookDetail } from './components/books/BookDetail';
import { IssueBookView } from './components/circulation/IssueBookView';
import { ReturnBookView } from './components/circulation/ReturnBookView';
import { TransactionHistoryView } from './components/circulation/TransactionHistoryView';
import { OverdueView } from './components/circulation/OverdueView';
import { OCRWorkspaceView } from './components/ocr/OCRWorkspaceView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchView } from './components/search/GlobalSearchView';
import { UsersView } from './components/admin/UsersView';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [extraState, setExtraState] = useState<any>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState<number>(0);

  const handleNavigate = (route: string, id?: string, extra?: any) => {
    setCurrentRoute(route);
    setSelectedId(id);
    setExtraState(extra);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset route to dashboard when authenticating
  useEffect(() => {
    if (isAuthenticated && (currentRoute === 'login' || !currentRoute)) {
      setCurrentRoute('dashboard');
    }
  }, [isAuthenticated, currentRoute]);

  // Global shortcut: Ctrl+K or Cmd+K opens Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCurrentRoute('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch overdue count for live badges
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/overdue')
        .then(res => res.json())
        .then(data => {
          if (data && data.total_overdue !== undefined) {
            setOverdueCount(data.total_overdue);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, currentRoute]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-amber-500">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-white">Loading Government Public Library System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Render view depending on route
  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;

      // Search
      case 'search':
        return <GlobalSearchView onNavigate={handleNavigate} />;

      // Members
      case 'members':
        return <MemberList onNavigate={handleNavigate} />;
      case 'members/add':
        return (
          <MemberForm
            initialData={extraState?.initialMemberData}
            onNavigate={handleNavigate}
          />
        );
      case 'members/edit':
        return (
          <MemberForm
            memberId={selectedId}
            onNavigate={handleNavigate}
          />
        );
      case 'members/detail':
        return (
          <MemberDetail
            memberId={selectedId || ''}
            onNavigate={handleNavigate}
          />
        );
      case 'members/scan':
        return (
          <MemberForm
            initialTab="ocr"
            onNavigate={handleNavigate}
          />
        );

      // Books
      case 'books':
        return <BookList onNavigate={handleNavigate} />;
      case 'books/add':
        return (
          <BookForm
            initialData={extraState?.initialBookData}
            onNavigate={handleNavigate}
          />
        );
      case 'books/edit':
        return (
          <BookForm
            bookId={selectedId}
            onNavigate={handleNavigate}
          />
        );
      case 'books/detail':
        return (
          <BookDetail
            bookId={selectedId || ''}
            onNavigate={handleNavigate}
          />
        );
      case 'books/scan':
        return (
          <BookForm
            initialTab="ocr"
            onNavigate={handleNavigate}
          />
        );

      // Circulation
      case 'issue-book':
        return <IssueBookView onNavigate={handleNavigate} />;
      case 'return-book':
        return <ReturnBookView onNavigate={handleNavigate} />;
      case 'transactions':
        return <TransactionHistoryView onNavigate={handleNavigate} />;
      case 'overdue':
        return <OverdueView />;

      // OCR Scanner Desk
      case 'ocr-scanner':
        return <OCRWorkspaceView onNavigate={handleNavigate} />;

      // Reports
      case 'reports':
        return <ReportsView />;

      // Administration & Settings
      case 'settings':
      case 'admin/settings':
        return <SettingsView initialTab="library" />;
      case 'admin/categories':
        return <SettingsView initialTab="categories" />;
      case 'admin/audit-logs':
        return <SettingsView initialTab="audit" />;
      case 'admin/users':
        return <UsersView />;

      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          overdueCount={overdueCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
