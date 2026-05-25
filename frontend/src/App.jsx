import { Routes, Route, Outlet } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Landing from './pages/Landing.jsx';
import Home from './pages/Home.jsx';
import Clubs from './pages/Clubs.jsx';
import ClubDetails from './pages/ClubDetails.jsx';
import Profile from './pages/Profile.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import ClubAdmin from './pages/ClubAdmin.jsx';
import UserProfile from './pages/UserProfile.jsx';
import FriendsPage from './pages/FriendsPage.jsx';
import DMPage from './pages/DMPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import { useAuth } from './context/AuthContext.jsx';

const DashboardLayout = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      {user && <Navbar />}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public routes — no shared layout */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes — wrapped in DashboardLayout (Navbar + main padding) */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clubs"
          element={
            <ProtectedRoute>
              <Clubs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clubs/:id"
          element={
            <ProtectedRoute>
              <ClubDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/clubs/:id"
          element={
            <ProtectedRoute adminOnly>
              <ClubAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="/users/:id"    element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/friends"      element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
        <Route path="/dm/:userId"   element={<ProtectedRoute><DMPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
};

export default App;
