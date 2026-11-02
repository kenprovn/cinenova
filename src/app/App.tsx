import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { BookingProvider } from '../features/booking/BookingContext';
import { ClientLayout } from '../components/common/ClientLayout';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';

// Customer Pages
import { HomePage } from '../features/movies/HomePage';
import { MoviesPage } from '../features/movies/MoviesPage';
import { MovieDetailsPage } from '../features/movies/MovieDetailsPage';
import { ShowtimeSelectPage } from '../features/booking/ShowtimeSelectPage';
import { SeatSelectionPage } from '../features/booking/SeatSelectionPage';
import { CheckoutDemoPage } from '../features/booking/CheckoutDemoPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ProfilePage } from '../features/auth/ProfilePage';
import { NotFoundPage } from '../components/common/NotFoundPage';

// Admin Page
import { AdminPage } from '../features/admin/AdminPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <ScrollToTop />
          <Routes>
            {/* Customer Facing Routes */}
            <Route path="/" element={<ClientLayout />}>
              <Route index element={<HomePage />} />
              <Route path="movies" element={<MoviesPage />} />
              <Route path="movies/:id" element={<MovieDetailsPage />} />
              <Route path="booking/:movieId" element={<ShowtimeSelectPage />} />
              <Route path="booking/:movieId/seats" element={<SeatSelectionPage />} />
              <Route path="checkout" element={<CheckoutDemoPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Admin Portal Protected Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
