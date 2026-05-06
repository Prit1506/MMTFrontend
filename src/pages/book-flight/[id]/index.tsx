import { useRouter } from "next/router";
import { Plane, Luggage, Clock, Calendar, MapPin, CreditCard, AlertCircle, ArrowRight, Ticket, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getflight, handleflightbooking } from "@/api";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";
import ReviewSection from "@/components/ReviewSection";

interface Flight {
  id: string; flightName: string; from: string; to: string; departureTime: string; arrivalTime: string; price: number; availableSeats: number;
}

const BookFlightPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setopem] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState("");
  const user = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const data = await getflight();
        const filteredData = data.filter((flight: any) => flight.id === id);
        setFlights(filteredData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if(id) fetchFlights();
  }, [id, user]);

  if (loading) return <Loader />;
  if (flights.length === 0) return <div>No flight data available.</div>;

  const flight = flights[0];
  
  // Updated Premium Logic to handle up to 25 rows
  const rowNumber = parseInt(selectedSeat.replace(/\D/g, '')) || 0;
  const isPremiumSeat = rowNumber >= 1 && rowNumber <= 4;
  const seatUpsellPrice = isPremiumSeat ? 800 : 0;
  
  const totalPrice = flight?.price;
  const totalTaxes = 1374;
  const grandTotal = totalPrice + totalTaxes + seatUpsellPrice;

  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return alert("Please select a seat to continue.");
    
    try {
      const updatedUser = await handleflightbooking(user?.id, flight?.id, 1, grandTotal, selectedSeat);
      dispatch(setUser(updatedUser));
      setopem(false);
      router.push("/profile");
    } catch (error) {
      console.log(error);
    }
  };

  const isSeatBooked = (seat: string) => {
    // Improved mock booked seats dynamically based on flight ID so it stays consistent across 25 rows
    const flightHash = flight.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seatHash = seat.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (flightHash + seatHash) % 4 === 0; 
  };

  const BookingContent = () => (
    <DialogContent className="sm:max-w-[800px] bg-white max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Plane className="w-6 h-6 mr-2 text-blue-600" /> Complete Your Booking
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Interactive Seat Map */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            Select Your Seat
          </h3>
          <div className="flex space-x-4 text-xs font-semibold text-gray-500 mb-6">
            <div className="flex items-center"><div className="w-3 h-3 bg-orange-100 border border-orange-400 rounded mr-1"></div> Premium</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-white border border-gray-300 rounded mr-1"></div> Standard</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-gray-300 rounded mr-1"></div> Booked</div>
          </div>
          
          <div className="bg-white p-4 rounded-3xl shadow-inner border-4 border-gray-200 w-full max-w-[280px]">
             {/* Scrollable container for 25 rows - ZOOMED OUT (taller height) */}
             <div className="max-h-[480px] overflow-y-auto pr-2">
               {Array.from({ length: 25 }, (_, i) => i + 1).map((row) => (
                 <div key={row} className="flex items-center justify-center mb-2">
                   <div className="w-6 text-center text-[10px] font-bold text-gray-400">{row}</div>
                   <div className="flex space-x-1.5">
                     {['A', 'B', 'C'].map((col) => {
                       const seat = `${row}${col}`;
                       const booked = isSeatBooked(seat);
                       const premium = row <= 4; // Rows 1-4 are premium
                       const selected = selectedSeat === seat;
                       return (
                         <button
                           key={seat}
                           disabled={booked}
                           onClick={() => setSelectedSeat(seat)}
                           // ZOOMED OUT: Changed from w-10 h-10 to w-8 h-8
                           className={`w-8 h-8 rounded-t-lg rounded-b-sm border-2 transition-all flex-shrink-0 ${
                             booked ? 'bg-gray-300 border-gray-300 cursor-not-allowed' :
                             selected ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-110' :
                             premium ? 'bg-orange-50 border-orange-400 hover:bg-orange-100 text-orange-800' :
                             'bg-white border-gray-300 hover:border-blue-400'
                           }`}
                         >
                           {/* ZOOMED OUT: Changed icon and text size */}
                           {selected ? <Check className="w-4 h-4 mx-auto" /> : <span className="text-[10px] font-bold">{col}</span>}
                         </button>
                       )
                     })}
                     <div className="w-3 flex-shrink-0"></div> {/* Aisle (narrower) */}
                     {['D', 'E', 'F'].map((col) => {
                       const seat = `${row}${col}`;
                       const booked = isSeatBooked(seat);
                       const premium = row <= 4;
                       const selected = selectedSeat === seat;
                       return (
                         <button
                           key={seat}
                           disabled={booked}
                           onClick={() => setSelectedSeat(seat)}
                           // ZOOMED OUT: Changed from w-10 h-10 to w-8 h-8
                           className={`w-8 h-8 rounded-t-lg rounded-b-sm border-2 transition-all flex-shrink-0 ${
                             booked ? 'bg-gray-300 border-gray-300 cursor-not-allowed' :
                             selected ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-110' :
                             premium ? 'bg-orange-50 border-orange-400 hover:bg-orange-100 text-orange-800' :
                             'bg-white border-gray-300 hover:border-blue-400'
                           }`}
                         >
                           {selected ? <Check className="w-4 h-4 mx-auto" /> : <span className="text-[10px] font-bold">{col}</span>}
                         </button>
                       )
                     })}
                   </div>
                 </div>
               ))}
             </div>
          </div>
          {selectedSeat && (
            <div className="mt-6 bg-blue-50 text-blue-800 px-4 py-2 rounded-lg border border-blue-200 font-bold w-full text-center">
              Seat {selectedSeat} Selected {isPremiumSeat && <span className="text-orange-600 text-xs ml-2">(Premium Upgrade +₹800)</span>}
            </div>
          )}
        </div>

        {/* Fare Summary */}
        <div className="bg-gray-100 rounded-xl p-6 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2" />Fare Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-gray-600">Base Fare (1 Adult)</span><span className="font-medium">₹ {totalPrice.toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-600">Taxes and Surcharges</span><span className="font-medium">₹ {totalTaxes.toLocaleString()}</span></div>
              {selectedSeat && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Seat Selection ({selectedSeat})</span>
                  <span className={`font-medium ${isPremiumSeat ? 'text-orange-600' : 'text-gray-600'}`}>
                    {isPremiumSeat ? '+ ₹ 800' : 'Free'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-300 pt-4 mt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-xl">Total Amount</span>
              <span className="font-black text-2xl text-blue-600">₹ {grandTotal.toLocaleString()}</span>
            </div>
            <Button 
              className={`w-full py-6 text-lg font-bold ${selectedSeat ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} 
              onClick={handlebooking}
              disabled={!selectedSeat}
            >
              {selectedSeat ? 'Confirm & Pay' : 'Select a Seat First'}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Plane className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <div className="font-semibold text-xl">{flight.flightName}</div>
                  <div className="text-sm text-gray-600">{flight.from} to {flight.to}</div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-6">
                <div>
                  <div className="text-2xl font-bold">{new Date(flight.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  <div className="text-sm text-gray-600 mt-1">{flight.from}</div>
                </div>
                <Plane className="w-6 h-6 text-gray-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold">{new Date(flight.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  <div className="text-sm text-gray-600 mt-1">{flight.to}</div>
                </div>
              </div>
            </div>
            <ReviewSection targetId={flight.id} targetType="FLIGHT" />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 border-t-4 border-blue-600">
              <h2 className="text-xl font-bold mb-2">Book This Flight</h2>
              <p className="text-gray-500 mb-6 text-sm">You can select your seat in the next step.</p>
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600 font-semibold">Starting Price</span>
                <span className="font-black text-3xl">₹ {totalPrice.toLocaleString()}</span>
              </div>
              
              <Dialog open={open} onOpenChange={setopem}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-bold shadow-md hover:shadow-xl transition-all">Proceed to Seat Map</Button>
                </DialogTrigger>
                {user ? (
                  <BookingContent />
                ) : (
                  <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle>Login Required</DialogTitle></DialogHeader>
                    <p>Please log in to continue with your booking.</p>
                    <SignupDialog trigger={<Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Log In / Sign Up</Button>} />
                  </DialogContent>
                )}
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookFlightPage;