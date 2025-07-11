export default function MyBookings({ bookings }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-juicy-pink mb-8">Your Bookings</h2>
      
      {/* Check if there are any bookings */}
      {bookings.length === 0 ? (
        <p className="text-center text-gray-500">You have no bookings yet.</p>
      ) : (
        <ul className="space-y-4">
          {/* Loop over the bookings array and display each one */}
          {bookings.map(booking => (
            <li key={booking.id} className="bg-cream p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="font-bold">Date: <span className="font-normal">{booking.date}</span></p>
                <p className="font-bold">Time: <span className="font-normal">{booking.time}</span></p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{booking.guests}</p>
                <p className="text-sm text-gray-600">Guests</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}