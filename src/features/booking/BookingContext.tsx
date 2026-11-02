import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie, Showtime, Cinema, Seat, SelectedSeatInfo, BookingCustomer, BookingState } from '../../types';
import { bookingService } from '../../services/bookingService';

interface BookingContextType {
  bookingState: BookingState;
  setMovie: (movie: Movie) => void;
  setShowtimeAndCinema: (showtime: Showtime, cinema: Cinema) => void;
  selectShowtime: (movie: Movie, showtime: Showtime, cinema: Cinema) => void;
  toggleSeat: (seat: Seat) => boolean; // returns false if max limit reached
  setSelectedSeats: (seats: SelectedSeatInfo[]) => void;
  setHoldExpiresAt: (expiresAt: string | null) => void;
  clearSeats: () => void;
  setCustomer: (customer: Partial<BookingCustomer>) => void;
  setPaymentMethod: (method: string) => void;
  resetBooking: () => void;
  totalAmount: number;
}

const initialBookingState: BookingState = {
  movie: null,
  showtime: null,
  cinema: null,
  selectedSeats: [],
  customer: {
    fullName: '',
    email: '',
    phone: '',
  },
  paymentMethod: 'momo',
  holdExpiresAt: null,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookingState, setBookingState] = useState<BookingState>(() => {
    // Attempt to restore session draft if exists
    try {
      const saved = sessionStorage.getItem('cinenova_booking_draft');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback to initial
    }
    return initialBookingState;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('cinenova_booking_draft', JSON.stringify(bookingState));
    } catch {
      // ignore
    }
  }, [bookingState]);

  const setMovie = (movie: Movie) => {
    setBookingState((prev) => {
      if (prev.showtime && prev.selectedSeats.length > 0) {
        bookingService.releaseSeatHold(prev.showtime.id, prev.selectedSeats.map((s) => s.id)).catch(() => {});
      }
      return {
        ...prev,
        movie,
        showtime: null,
        cinema: null,
        selectedSeats: [],
        holdExpiresAt: null,
      };
    });
  };

  const setShowtimeAndCinema = (showtime: Showtime, cinema: Cinema) => {
    setBookingState((prev) => {
      if (prev.showtime && prev.showtime.id !== showtime.id && prev.selectedSeats.length > 0) {
        bookingService.releaseSeatHold(prev.showtime.id, prev.selectedSeats.map((s) => s.id)).catch(() => {});
      }
      return {
        ...prev,
        showtime,
        cinema,
        selectedSeats: [],
        holdExpiresAt: null,
      };
    });
  };

  const selectShowtime = (movie: Movie, showtime: Showtime, cinema: Cinema) => {
    setBookingState((prev) => {
      if (prev.showtime && prev.showtime.id !== showtime.id && prev.selectedSeats.length > 0) {
        bookingService.releaseSeatHold(prev.showtime.id, prev.selectedSeats.map((s) => s.id)).catch(() => {});
      }
      return {
        ...prev,
        movie,
        showtime,
        cinema,
        selectedSeats: [],
        holdExpiresAt: null,
      };
    });
  };

  const toggleSeat = (seat: Seat): boolean => {
    let allowed = true;
    setBookingState((prev) => {
      const exists = prev.selectedSeats.some((s) => s.id === seat.id);
      if (exists) {
        return {
          ...prev,
          selectedSeats: prev.selectedSeats.filter((s) => s.id !== seat.id),
        };
      }
      // Maximum 8 seats per booking transaction
      if (prev.selectedSeats.length >= 8) {
        allowed = false;
        return prev;
      }
      const newSeat: SelectedSeatInfo = {
        id: seat.id,
        seatNumber: seat.seatNumber,
        row: seat.row,
        type: seat.type,
        price: seat.price,
      };
      return {
        ...prev,
        selectedSeats: [...prev.selectedSeats, newSeat],
      };
    });
    return allowed;
  };

  const setSelectedSeats = (selectedSeats: SelectedSeatInfo[]) => {
    setBookingState((prev) => ({
      ...prev,
      selectedSeats,
    }));
  };

  const setHoldExpiresAt = (holdExpiresAt: string | null) => {
    setBookingState((prev) => ({
      ...prev,
      holdExpiresAt,
    }));
  };

  const clearSeats = () => {
    setBookingState((prev) => ({
      ...prev,
      selectedSeats: [],
      holdExpiresAt: null,
    }));
  };

  const setCustomer = (cust: Partial<BookingCustomer>) => {
    setBookingState((prev) => ({
      ...prev,
      customer: { ...prev.customer, ...cust },
    }));
  };

  const setPaymentMethod = (paymentMethod: string) => {
    setBookingState((prev) => ({
      ...prev,
      paymentMethod,
    }));
  };

  const resetBooking = () => {
    setBookingState(initialBookingState);
    try {
      sessionStorage.removeItem('cinenova_booking_draft');
    } catch {
      // ignore
    }
  };

  const totalAmount = bookingState.selectedSeats.reduce((sum, s) => sum + s.price, 0);

  return (
    <BookingContext.Provider
      value={{
        bookingState,
        setMovie,
        setShowtimeAndCinema,
        selectShowtime,
        toggleSeat,
        setSelectedSeats,
        setHoldExpiresAt,
        clearSeats,
        setCustomer,
        setPaymentMethod,
        resetBooking,
        totalAmount,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
