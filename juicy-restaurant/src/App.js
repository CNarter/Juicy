import { useState } from 'react';
import BookingForm from './components/BookingForm';
import MyBookings from './components/MyBookings';

export default function App() {
  const [view, setView] = useState('booking'); // Controls which view is shown
  const [bookings, setBookings] = useState([]); // Array to store all bookings

  // This function will be passed to the form to add a new booking
  const addBooking = (newBooking) => {
    setBookings([...bookings, newBooking]);
    // After booking, switch to the 'my-bookings' view
    setView('my-bookings'); 
  };

  return (
    <div className="min-h-screen bg-cream font-body text-gray-800">
      <div className="container mx-auto p-4 md:p-8">

        {/* Header Section (from previous step) */}
        <header className="text-center mb-12">
          <h1 className="font-display text-7xl text-juicy-pink mb-2">Juicy</h1>
          <p className="text-xl">Laotian Kitchen & Grill</p>
        </header>

        {/* Navigation Buttons */}
        <nav className="flex justify-center space-x-4 mb-10">
          <Button onClick={() => setView('booking')} active={view === 'booking'}>Book a Table</Button>
          <Button onClick={() => setView('my-bookings')} active={view === 'my-bookings'}>My Bookings</Button>
          <Button onClick={() => setView('menu')} active={view === 'menu'}>Menu</Button>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl">
          {/* Show components based on the current view */}
          {view === 'booking' && <BookingForm onBookingSubmit={addBooking} />}
          {view === 'my-bookings' && <MyBookings bookings={bookings} />}
          {view === 'menu' && <p className="text-center">Our delicious menu is coming soon!</p>}
        </main>

      </div>
    </div>
  );
}

// Reusable Button component
const Button = ({ onClick, children, active }) => {
  const baseClasses = "px-6 py-2 font-bold rounded-full transition-transform transform hover:scale-105";
  const activeClasses = "bg-juicy-pink text-white shadow-lg";
  const inactiveClasses = "bg-sunny-yellow text-gray-800 hover:bg-opacity-80";
  return (
    <button onClick={onClick} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
      {children}
    </button>
  );
};