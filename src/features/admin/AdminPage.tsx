import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminOverview } from './AdminOverview';
import { AdminMovies } from './AdminMovies';
import { AdminShowtimes } from './AdminShowtimes';
import { AdminBookings } from './AdminBookings';
import { AdminCheckIn } from './AdminCheckIn';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'showtimes' | 'bookings' | 'checkin'>('overview');

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'overview' && <AdminOverview />}
      {activeTab === 'movies' && <AdminMovies />}
      {activeTab === 'showtimes' && <AdminShowtimes />}
      {activeTab === 'bookings' && <AdminBookings />}
      {activeTab === 'checkin' && <AdminCheckIn />}
    </AdminLayout>
  );
};

