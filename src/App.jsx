import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/SearchPage';
import LikedSongsPage from './pages/LikedSongsPage';
import SettingsPage from './pages/SettingsPage';
import PlaylistPage from './pages/PlaylistsPage';
import AboutMe from './pages/AboutMe'; // new about page

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/search" element={user ? <SearchPage /> : <Navigate to="/login" />} />
      <Route path="/liked" element={user ? <LikedSongsPage /> : <Navigate to="/login" />} />
      <Route path="/playlists" element={user ? <PlaylistPage /> : <Navigate to="/login" />} />
      <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
      <Route path="/about" element={user ? <AboutMe /> : <Navigate to="/login" />} />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;
