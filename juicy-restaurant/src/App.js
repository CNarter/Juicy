import { useState } from 'react';
// Make sure to import your components
// import Bookings from './components/Bookings'; 
// import Menu from './components/Menu';

export default function App() {
  const [view, setView] = useState('booking'); // 'booking' or 'menu'

  return (
    // Main container: Use the cream background and body font
    <div className="min-h-screen bg-cream font-body text-gray-800">
      <div className="container mx-auto p-4 md:p-8">

        {/* Header Section */}
        <header className="text-center mb-12">
          {/* Main Title: Use the display font and juicy pink color */}
          <h1 className="font-display text-7xl text-juicy-pink mb-2">Juicy</h1>
          <p className="text-xl">Laotian Kitchen & Grill</p>
          {/* User ID can be styled differently if needed */}
          <span className="font-mono text-xs bg-gray-200 p-1 rounded">User ID: {userId}</span>
        </header>

        {/* Navigation / View Toggle Buttons */}
        <nav className="flex justify-center space-x-4 mb-10">
          {/* Style the buttons with your new colors */}
          <Button onClick={() => setView('booking')} active={view === 'booking'}>Book a Table</Button>
          <Button onClick={() => setView('my-bookings')} active={view === 'my-bookings'}>My Bookings</Button>
          <Button onClick={() => setView('menu')} active={view === 'menu'}>Menu</Button>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl">
          {/* Conditionally render the view based on state */}
          {view === 'booking' && <div>Booking Form Goes Here...</div> /* <BookingsForm /> */}
          {view === 'my-bookings' && <div>Your Bookings Go Here...</div> /* <Bookings /> */}
          {view === 'menu' && <div>Your Menu Goes Here...</div> /* <Menu /> */}
        </main>

      </div>
    </div>
  );
}

// A reusable Button component for your navigation
const Button = ({ onClick, children, active }) => {
  // Use template literals to conditionally apply styles
  const baseClasses = "px-6 py-2 font-bold rounded-full transition-transform transform hover:scale-105";
  const activeClasses = "bg-juicy-pink text-white shadow-lg";
  const inactiveClasses = "bg-sunny-yellow text-gray-800 hover:bg-opacity-80";

  return (
    <button onClick={onClick} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
      {children}
    </button>
  );
};