import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously,  } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, doc, onSnapshot, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { Calendar, Clock, Users, X, Utensils, Trash2, Plus, Minus, Wand2 } from 'lucide-react';

// --- Firebase Configuration ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQ3DQwVD4FMYgGU1MxXtzKmMbrQCTnViU",
  authDomain: "juicy-40205.firebaseapp.com",
  projectId: "juicy-40205",
  storageBucket: "juicy-40205.firebasestorage.app",
  messagingSenderId: "723035373357",
  appId: "1:723035373357:web:65577f403f80d05b385da4",
  measurementId: "G-27WGKS6WD7"
};

// --- App Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'default-restaurant-booking';

// --- Helper Components ---
const Card = ({ children, className = '' }) => (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-white ${className}`}>
        {children}
    </div>
);

const Button = ({ children, onClick, className = '', variant = 'primary', ...props }) => {
    const baseClasses = 'px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 shadow-md hover:shadow-lg transform hover:-translate-y-0.5';
    const variantClasses = {
        primary: 'bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-300',
        secondary: 'bg-yellow-400 text-gray-800 hover:bg-yellow-500 focus:ring-yellow-200',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300',
    };
    return (
        <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 font-poppins">
            <div className="bg-peach-100 rounded-2xl shadow-2xl w-full max-w-md m-4 border-4 border-white">
                <div className="p-8 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                        <X size={28} />
                    </button>
                    {children}
                </div>
            </div>
        </div>
    );
};


// --- Main Application Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [view, setView] = useState('booking'); // 'booking', 'my-bookings', 'menu'
    const [bookings, setBookings] = useState([]);
    const [tables, setTables] = useState([]);
    const [menu, setMenu] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const userId = user?.uid || 'anonymous';

    // --- Authentication Effect ---
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
        } else {
            try {
                // This is the only line that should be in the try block
                await signInAnonymously(auth);
            } catch (err) {
                console.error("Authentication failed:", err);
                setError("Could not authenticate user.");
            }
        }
        setIsAuthReady(true);
    });
    return () => unsubscribe();
}, []);
    // --- Data Setup and Fetching Effect ---
    useEffect(() => {
        if (!isAuthReady) return;

        const setupInitialData = async () => {
            try {
                // Setup tables only if they don't exist
                const tablesCollectionRef = collection(db, `artifacts/${appId}/public/data/tables`);
                const tablesSnapshot = await getDocs(tablesCollectionRef);
                if (tablesSnapshot.empty) {
                    const initialTables = [
                        { id: 'T1', capacity: 2 }, { id: 'T2', capacity: 2 },
                        { id: 'T3', capacity: 4 }, { id: 'T4', capacity: 4 },
                        { id: 'T5', capacity: 6 }, { id: 'T6', capacity: 8 },
                    ];
                    for (const table of initialTables) {
                        await setDoc(doc(tablesCollectionRef, table.id), table);
                    }
                }

                // Setup menu only if it doesn't exist
                const menuDocRef = doc(db, `artifacts/${appId}/public/data/menu`, 'lao_menu');
                const menuSnapshot = await getDoc(menuDocRef);
                if (!menuSnapshot.exists()) {
                    const initialMenu = {
                        appetizers: [
                            { name: 'Lao Crispy Spring Rolls', price: 7.50 },
                            { name: 'Sai Oua (Lao Sausage)', price: 9.00 },
                            { name: 'Khao Jee Pâté (Baguette Sandwich)', price: 8.00 },
                        ],
                        mains: [
                            { name: 'Laap (Minced Meat Salad)', price: 16.00 },
                            { name: 'Mok Pa (Steamed Fish in Banana Leaf)', price: 18.50 },
                            { name: 'Khao Soi Luang Prabang', price: 15.00 },
                            { name: 'Or Lam (Spicy Stew)', price: 17.00 },
                        ],
                        drinks: [
                            { name: 'Mango Lassi', price: 5.50 },
                            { name: 'Passionfruit & Mint Smoothie', price: 6.00 },
                            { name: 'Coconut & Pineapple Smoothie', price: 6.00 },
                            { name: 'Tamarind Cooler', price: 4.50 },
                        ],
                    };
                    await setDoc(menuDocRef, initialMenu);
                }
            } catch (err) {
                console.error("Error setting up initial data:", err);
                setError("Failed to initialize restaurant data.");
            }
        };

        setupInitialData();

        // --- Firestore Subscriptions ---
        const bookingsQuery = query(collection(db, `artifacts/${appId}/public/data/bookings`));
        const tablesQuery = query(collection(db, `artifacts/${appId}/public/data/tables`));
        const menuDocRef = doc(db, `artifacts/${appId}/public/data/menu`, 'lao_menu');

        const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => setBookings(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => { console.error(err); setError("Failed to load bookings."); });
        const unsubTables = onSnapshot(tablesQuery, (snapshot) => setTables(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => { console.error(err); setError("Failed to load tables."); });
        const unsubMenu = onSnapshot(menuDocRef, (doc) => { if (doc.exists()) setMenu(doc.data()); setIsLoading(false); }, (err) => { console.error(err); setError("Failed to load menu."); setIsLoading(false); });

        return () => { unsubBookings(); unsubTables(); unsubMenu(); };
    }, [isAuthReady]);

    const myBookings = useMemo(() => {
        return bookings.filter(b => b.userId === userId).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    }, [bookings, userId]);

    if (!isAuthReady || isLoading) {
        return <div className="min-h-screen bg-peach-100 flex items-center justify-center text-gray-800 font-lobster">Loading Juicy...</div>;
    }
    
    if (error) {
        return <div className="min-h-screen bg-red-100 flex items-center justify-center text-red-700 p-4 font-poppins">{error}</div>;
    }

    const junglePattern = `
        <svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>
            <rect width='400' height='400' fill='#042a2b'/>
            <g opacity='0.9'>
                <!-- Background foliage -->
                <path d='M0 400 L100 0 L200 400 Z' fill='#084c4e' transform='translate(50 50) rotate(15)'/>
                <path d='M400 0 L300 400 L200 0 Z' fill='#084c4e' transform='translate(-50 -50) rotate(-15)'/>
                <path d='M150 0 C 50 100, 250 150, 150 400' stroke='#13676a' stroke-width='60' fill='none' opacity='0.5'/>
                <path d='M250 400 C 350 300, 150 250, 250 0' stroke='#13676a' stroke-width='60' fill='none' opacity='0.5'/>

                <!-- Mid-ground leaves -->
                <path d='M400 200 C 300 100, 250 300, 100 250 S -50 150, 50 50' stroke='#1e8488' stroke-width='40' fill='none'/>
                <path d='M0 200 C 100 300, 150 100, 300 150 S 450 250, 350 350' stroke='#1e8488' stroke-width='40' fill='none'/>
                
                <!-- Foreground Ferns -->
                <path d='M50 400 C 100 200, 200 250, 250 150 S 350 50, 400 100' stroke='#5eb8b0' stroke-width='15' fill='none'/>
                <path d='M350 0 C 300 200, 200 150, 150 250 S 50 350, 0 300' stroke='#5eb8b0' stroke-width='15' fill='none'/>

                <!-- Bird -->
                <g transform='translate(200 120) rotate(15) scale(1.2)'>
                    <path d='M 0 0 c -30 -50 -80 -40 -100 0 c 20 40 70 50 100 0z' fill='#c74b86'/>
                    <path d='M -50 -20 c -40 -50 -90 -20 -70 30 l 60 -30z' fill='#f9a6be'/>
                    <path d='M -10 5 c 30 -40 70 -20 60 30z' fill='#c74b86'/>
                    <path d='M -100,0 A 40,20 0 0,0 -20,20' fill='none' stroke='#a63d7a' stroke-width='4'/>
                </g>

                <!-- Flowers -->
                <g transform='translate(80 300)'>
                    <circle cx='0' cy='0' r='15' fill='#e85d75'/>
                    <path d='M-10 -10 L 10 10 M10 -10 L -10 10' stroke='#a63d7a' stroke-width='3'/>
                </g>
                <g transform='translate(320 80)'>
                    <circle cx='0' cy='0' r='12' fill='#e85d75'/>
                    <path d='M-8 -8 L 8 8 M8 -8 L -8 8' stroke='#a63d7a' stroke-width='2'/>
                </g>
            </g>
        </svg>
    `;
    const encodedPattern = `data:image/svg+xml,${encodeURIComponent(junglePattern)}`;

    return (
        <div className="min-h-screen font-poppins text-gray-800" style={{ backgroundColor: '#042a2b', backgroundImage: `url("${encodedPattern}")` }}>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-glass">
            <header className="text-center mb-12">
                <h1 className="text-7xl md:text-9xl font-bold font-lobster title-juicy">Juicy</h1>
                <p className="text-pink-200 mt-4 text-lg font-semibold">
                    Laotian Kitchen & Grill. User ID: <span className="font-mono text-xs bg-white/20 p-1 rounded">{userId}</span>
                </p>
            </header>
            <nav className="flex justify-center space-x-2 sm:space-x-4 mb-10">
                <Button onClick={() => setView('booking')} variant={view === 'booking' ? 'primary' : 'secondary'}>Book a Table</Button>
                <Button onClick={() => setView('my-bookings')} variant={view === 'my-bookings' ? 'primary' : 'secondary'}>My Bookings</Button>
                <Button onClick={() => setView('menu')} variant={view === 'menu' ? 'primary' : 'secondary'}>Menu</Button>
            </nav>
            <main>
                {view === 'booking' && <BookingForm bookings={bookings} tables={tables} userId={userId} />}
                {view === 'my-bookings' && <MyBookings bookings={myBookings} />}
                {view === 'menu' && <Menu menu={menu} />}
            </main>
        </div>
    </div>
    );
}

// --- Booking Form Component ---
function BookingForm({ bookings, tables, userId }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('19:00');
    const [guests, setGuests] = useState(2);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const generateGroovyConfirmation = async (guestCount, bookingDate, bookingTime) => {
        const prompt = `Generate a short, fun, groovy, 70s-themed confirmation message for a restaurant booking. The booking is for ${guestCount} people on ${bookingDate} at ${bookingTime}. The restaurant is called "Juicy". Keep it under 25 words. For example: "Can you dig it? Your booking for ${guestCount} is set for ${bookingTime}. Stay groovy!"`;
        
        try {
            const apiKey = ""; // Leave empty, handled by environment
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0) {
                return result.candidates[0].content.parts[0].text;
            }
        } catch (err) {
            console.error("Gemini API error:", err);
        }
        // Fallback message
        return `Far out! You're booked for ${guestCount} on ${bookingDate} at ${bookingTime}.`;
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        const bookingDateTime = new Date(`${date}T${time}`);
        if (bookingDateTime < new Date()) {
            setError("Cannot book a table in the past, groovy cat!");
            setIsSubmitting(false);
            return;
        }

        const bookingDurationHours = 2;
        const bookingEndDateTime = new Date(bookingDateTime.getTime() + bookingDurationHours * 60 * 60 * 1000);

        const bookedTableIds = bookings.filter(b => {
            const existingBookingStart = new Date(b.dateTime);
            const existingBookingEnd = new Date(existingBookingStart.getTime() + bookingDurationHours * 60 * 60 * 1000);
            return (bookingDateTime < existingBookingEnd && bookingEndDateTime > existingBookingStart);
        }).flatMap(b => b.tables);

        const availableTables = tables.filter(t => !bookedTableIds.includes(t.id));
        let assignedTables = [];
        let remainingGuests = guests;
        const sortedAvailableTables = [...availableTables].sort((a, b) => a.capacity - b.capacity);
        const perfectFit = sortedAvailableTables.find(t => t.capacity >= guests);
        if (perfectFit) {
            assignedTables.push(perfectFit.id);
            remainingGuests = 0;
        } else {
            const reversedSortedTables = sortedAvailableTables.reverse();
            for (const table of reversedSortedTables) {
                if (remainingGuests > 0) {
                    assignedTables.push(table.id);
                    remainingGuests -= table.capacity;
                }
            }
        }

        if (remainingGuests > 0 || assignedTables.length === 0) {
            setError("Bummer! No tables available for that time and party size. Try another time!");
            setIsSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/bookings`), {
                userId, guests, dateTime: bookingDateTime.toISOString(),
                tables: assignedTables, createdAt: new Date().toISOString()
            });
            
            const confirmation = await generateGroovyConfirmation(guests, date, time);
            setSuccessMessage(confirmation);
            
            setDate(new Date().toISOString().split('T')[0]); setTime('19:00'); setGuests(2);
        } catch (err) {
            console.error("Error creating booking:", err);
            setError("A glitch in the matrix! Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <h2 className="text-4xl font-bold mb-8 text-center font-lobster text-gray-800">Get Your Groove On</h2>
            {error && <div className="bg-red-200 border-2 border-red-400 text-red-800 px-4 py-3 rounded-xl relative mb-6 text-center" role="alert">{error}</div>}
            {successMessage && <div className="bg-green-200 border-2 border-green-400 text-green-800 px-4 py-3 rounded-xl relative mb-6 text-center" role="alert">✨ {successMessage}</div>}
            
            <form onSubmit={handleBooking} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={22} />
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required className="w-full pl-12 pr-3 py-3 border-2 border-gray-300 rounded-full focus:ring-pink-500 focus:border-pink-500 bg-white/70" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={22} />
                            <select id="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full pl-12 pr-3 py-3 border-2 border-gray-300 rounded-full focus:ring-pink-500 focus:border-pink-500 appearance-none bg-white/70">
                                {Array.from({ length: 21 }, (_, i) => {
                                    const hour = 12 + Math.floor((i * 30) / 60);
                                    const minute = (i * 30) % 60;
                                    const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                                    return <option key={timeValue} value={timeValue}>{timeValue}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                </div>
                <div>
                    <label htmlFor="guests" className="block text-sm font-semibold text-gray-700 mb-2">Guests</label>
                    <div className="relative flex items-center">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={22} />
                        <div className="flex items-center justify-center w-full border-2 border-gray-300 rounded-full bg-white/70">
                            <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))} className="p-3 text-pink-600 hover:bg-pink-100 rounded-l-full"><Minus size={20}/></button>
                            <input type="text" id="guests" value={guests} readOnly className="w-full text-center border-l-2 border-r-2 border-gray-300 py-3 focus:outline-none bg-transparent font-semibold text-lg" />
                            <button type="button" onClick={() => setGuests(g => g + 1)} className="p-3 text-pink-600 hover:bg-pink-100 rounded-r-full"><Plus size={20}/></button>
                        </div>
                    </div>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-4">
                    {isSubmitting ? 'Catchin a Vibe...' : 'Book It!'}
                </Button>
            </form>
        </Card>
    );
}

// --- My Bookings Component ---
function MyBookings({ bookings }) {
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const confirmCancel = async () => {
        if (!bookingToCancel) return;
        setIsCancelling(true);
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/bookings`, bookingToCancel.id));
            setBookingToCancel(null);
        } catch (err) {
            console.error("Error cancelling booking:", err);
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <Card>
            <h2 className="text-4xl font-bold mb-8 text-center font-lobster text-gray-800">Your Scene</h2>
            {bookings.length === 0 ? (
                <p className="text-gray-600 text-center">You have no upcoming bookings. Time to make plans!</p>
            ) : (
                <div className="space-y-6">
                    {bookings.map(booking => (
                        <div key={booking.id} className="bg-white/90 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-2 border-peach-200">
                            <div>
                                <p className="font-semibold text-lg text-pink-600 font-lobster">
                                    {new Date(booking.dateTime).toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-gray-700 font-semibold">
                                    {new Date(booking.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - {booking.guests} Guests
                                </p>
                                <p className="text-sm text-gray-500">Table(s): {booking.tables.join(', ')}</p>
                            </div>
                            <Button onClick={() => setBookingToCancel(booking)} variant="danger" className="px-4 py-2 text-base">
                                <Trash2 size={18} className="inline mr-2" />
                                Cancel
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <Modal isOpen={!!bookingToCancel} onClose={() => setBookingToCancel(null)}>
                 <h3 className="text-2xl font-bold mb-4 font-lobster text-center text-gray-800">Woah There!</h3>
                 <p className="text-gray-700 mb-8 text-center">Are you sure you want to cancel this booking?</p>
                 <div className="flex justify-center space-x-4">
                     <Button variant="secondary" onClick={() => setBookingToCancel(null)}>Keep It</Button>
                     <Button variant="danger" onClick={confirmCancel} disabled={isCancelling}>
                         {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                     </Button>
                 </div>
            </Modal>
        </Card>
    );
}

// --- Menu Component ---
function Menu({ menu }) {
    const [pairing, setPairing] = useState({ itemId: null, text: '', isLoading: false, error: null });

    if (!menu) {
        return <Card><p>Loading the goods...</p></Card>;
    }
    
    const getDrinkPairing = async (mainCourse) => {
        setPairing({ itemId: mainCourse.name, text: '', isLoading: true, error: null });
        
        const drinkList = menu.drinks.map(d => d.name).join(', ');
        const prompt = `You are a fun, 70s-themed sommelier for a Laotian restaurant called "Juicy". Suggest a drink pairing for the dish "${mainCourse.name}". Choose a drink from this list: ${drinkList}. Explain the choice in a short, groovy, and exciting way (under 20 words).`;

        try {
            const apiKey = ""; // Leave empty
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0) {
                setPairing({ itemId: mainCourse.name, text: result.candidates[0].content.parts[0].text, isLoading: false, error: null });
            } else {
                 throw new Error("No pairing suggestion found.");
            }
        } catch (err) {
            console.error("Gemini API error:", err);
            setPairing({ itemId: mainCourse.name, text: '', isLoading: false, error: 'Could not get a suggestion right now.' });
        }
    };

    const renderMenuItems = (items, isMainCourse = false) => (
        <ul className="space-y-4">
            {items.map(item => (
                <li key={item.name} className="flex flex-col border-b-2 border-dashed border-peach-300 pb-3">
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-800 text-lg">{item.name}</span>
                        <span className="text-gray-800 font-semibold text-lg">£{item.price.toFixed(2)}</span>
                    </div>
                    {isMainCourse && (
                        <div className="mt-2">
                           <button onClick={() => getDrinkPairing(item)} disabled={pairing.isLoading && pairing.itemId === item.name} className="text-sm font-semibold text-pink-600 hover:text-pink-800 transition flex items-center gap-1 disabled:opacity-50">
                               <Wand2 size={14}/> {pairing.isLoading && pairing.itemId === item.name ? 'Thinking...' : '✨ Suggest a Drink'}
                           </button>
                           {pairing.itemId === item.name && !pairing.isLoading && (
                               <div className={`mt-2 p-3 rounded-lg text-sm ${pairing.error ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                                   {pairing.error || pairing.text}
                               </div>
                           )}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );

    return (
        <Card>
            <h2 className="text-4xl font-bold mb-8 text-center font-lobster text-gray-800 flex items-center justify-center">
                <Utensils className="mr-4 text-pink-500" size={36} /> The Goods
            </h2>
            <div className="space-y-10">
                <div>
                    <h3 className="text-3xl font-semibold mb-6 font-lobster text-pink-600">To Start</h3>
                    {renderMenuItems(menu.appetizers)}
                </div>
                <div>
                    <h3 className="text-3xl font-semibold mb-6 font-lobster text-pink-600">The Main Event</h3>
                    {renderMenuItems(menu.mains, true)}
                </div>
                <div>
                    <h3 className="text-3xl font-semibold mb-6 font-lobster text-pink-600">Sweet Sips</h3>
                    {renderMenuItems(menu.drinks)}
                </div>
            </div>
        </Card>
    );
}
