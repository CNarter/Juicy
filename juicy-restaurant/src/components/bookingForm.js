import { useState } from 'react';

export default function BookingForm({ onBookingSubmit }) {
  // State for each form field
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState(2);

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevents the page from reloading

    if (!date) {
      alert('Please select a date!');
      return;
    }

    // Create a new booking object
    const newBooking = {
      id: Date.now(), // Unique ID for the booking
      date,
      time,
      guests,
    };

    // Call the function passed from App.js
    onBookingSubmit(newBooking); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-3xl font-bold text-center text-juicy-pink mb-8">Book Your Table</h2>
      
      {/* Date Input */}
      <div>
        <label htmlFor="date" className="block text-lg font-medium text-gray-700">Date</label>
        <input 
          type="date" 
          id="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-juicy-pink focus:border-juicy-pink"
        />
      </div>

      {/* Time Input */}
      <div>
        <label htmlFor="time" className="block text-lg font-medium text-gray-700">Time</label>
        <input 
          type="time" 
          id="time" 
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-juicy-pink focus:border-juicy-pink"
        />
      </div>

      {/* Guests Input */}
      <div>
        <label htmlFor="guests" className="block text-lg font-medium text-gray-700">Number of Guests</label>
        <input 
          type="number" 
          id="guests" 
          min="1" 
          max="10"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-juicy-pink focus:border-juicy-pink"
        />
      </div>

      {/* Submit Button */}
      <button type="submit" className="w-full bg-juicy-pink text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg">
        Book It!
      </button>
    </form>
  );
}