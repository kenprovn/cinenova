import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie, Showtime, Cinema, Seat, SelectedSeatInfo, BookingCustomer, BookingState } from '../../types';

interface BookingContextType {
  bookingState: BookingState;
  setMovie: (movie: Movie) => void;
  setShowtimeAndCinema: (showtime: Showtime, cinema: Cinema) => void;
  toggleSeat: (seat: Seat) => boolean; // returns false if max limit reached
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
    setBookingState((prev) => ({
      ...prev,
      movie,
      showtime: null,
      selectedSeats: [],
    }));
  };

  const setShowtimeAndCinema = (showtime: Showtime, cinema: Cinema) => {
    setBookingState((prev) => ({
      ...prev,
      showtime,
      cinema,
      selectedSeats: [],
    }));
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

  const clearSeats = () => {
    setBookingState((prev) => ({
      ...prev,
      selectedSeats: [],
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
        toggleSeat,
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
