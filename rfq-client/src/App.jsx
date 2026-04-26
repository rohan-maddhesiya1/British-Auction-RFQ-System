import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, PackageCheck } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import CreateRfq from './pages/CreateRfq';
import SubmitBid from './pages/SubmitBid';
import PageLoader from './components/PageLoader';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Restoring session" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user?.role !== role) return <Navigate to="/auctions" replace />;

  return children;
};

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="page-shell">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="content-shell flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-action text-white shadow-sm shadow-teal-200">
              <PackageCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">British Auction RFQ</p>
              <p className="text-xs text-slate-500">{user?.name ?? user?.email} · {user?.role}</p>
            </div>
          </div>

          <button className="btn btn-secondary self-start sm:self-auto" type="button" onClick={handleLogout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <main className="content-shell">{children}</main>
    </div>
  );
};

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/auctions"
      element={
        <ProtectedRoute>
          <AppLayout>
            <AuctionList />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/auctions/:rfqId"
      element={
        <ProtectedRoute>
          <AppLayout>
            <AuctionDetail />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/rfqs/create"
      element={
        <ProtectedRoute role="buyer">
          <AppLayout>
            <CreateRfq />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/rfqs/:rfqId/bid"
      element={
        <ProtectedRoute role="supplier">
          <AppLayout>
            <SubmitBid />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route path="/" element={<Navigate to="/auctions" replace />} />
    <Route path="*" element={<Navigate to="/auctions" replace />} />
  </Routes>
);

export default App;
