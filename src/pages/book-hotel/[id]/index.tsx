import { useRouter } from "next/router";
import { Star, MapPin, CreditCard, Ticket, Home, ChevronRight, Check, TrendingUp, Snowflake, BarChart3, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { gethotel, handlehotelbooking, handlePriceFreezeApi } from "@/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";
import ReviewSection from "@/components/ReviewSection";

interface Hotel {
  id: string; hotelName: string; location: string; pricePerNight: number; availableRooms: number; amenities: string;
}

const BookHotelPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [hotels, sethotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setopem] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("Standard Room");
  const user = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();

  const [priceHistory, setPriceHistory] = useState([2200, 2100, 2400, 2600, 2900, 3100, 3300]);

  useEffect(() => {
    const fetchhotels = async () => {
      try {
        const data = await gethotel();
        const filteredData = data.filter((hotel: any) => hotel.id === id);
        sethotels(filteredData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if(id) fetchhotels();
  }, [id, user]);

  if (loading) return <Loader />;
  if (hotels.length === 0) return <div>No hotel data available.</div>;

  const hotel = hotels[0];
  
  // --- FIX: Read frozen price directly from the user's database profile ---
  const frozenRecord = user?.priceFreezes?.find((freeze: any) => freeze.targetId === id);
  const isPriceFrozen = !!frozenRecord;

  const rawBasePrice = hotel?.pricePerNight;
  const demandModifier = 1.20; 
  // Use the exact locked price from the database if frozen
  const basePrice = isPriceFrozen ? frozenRecord.lockedPrice : Math.round(rawBasePrice * demandModifier);
  // -------------------------------------------------------------------------

  const roomTypes = [
    {
      name: "Standard Room",
      priceModifier: 0,
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400",
      perks: ["Queen Bed", "Free Wi-Fi", "City View"]
    },
    {
      name: "Deluxe King",
      priceModifier: 1500,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400",
      perks: ["King Bed", "Balcony", "Free Breakfast"]
    },
    {
      name: "Presidential Suite",
      priceModifier: 4000,
      image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400",
      perks: ["Living Room", "Ocean View", "Lounge Access"]
    }
  ];

  const activeRoomData = roomTypes.find(r => r.name === selectedRoom) || roomTypes[0];
  const totalTaxes = 527;
  const grandTotal = basePrice + activeRoomData.priceModifier + totalTaxes;

  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await handlehotelbooking(user?.id, hotel?.id, 1, grandTotal, selectedRoom);
      dispatch(setUser(updatedUser));
      setopem(false);
      router.push("/profile");
    } catch (error) {
      console.log(error);
    }
  };

  const handlePriceFreeze = async () => {
    if (!user) return alert("Please login to freeze prices.");
    try {
      const updatedUser = await handlePriceFreezeApi(user.id, hotel.id, "HOTEL", basePrice);
      dispatch(setUser(updatedUser));
      alert("Price frozen successfully for 24 hours! A holding fee of ₹199 has been applied.");
    } catch (error) {
      alert("Failed to freeze price. Please make sure backend is running.");
    }
  };

  const HotelContent = () => (
    <DialogContent className="sm:max-w-[800px] bg-white max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Home className="w-6 h-6 mr-2 text-blue-600" /> Choose Your Room Type
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
        <div className="space-y-4">
          {roomTypes.map((room) => (
            <div 
              key={room.name}
              onClick={() => setSelectedRoom(room.name)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center ${
                selectedRoom === room.name 
                  ? 'border-blue-600 bg-blue-50 shadow-md transform scale-[1.02]' 
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
            >
              <img src={room.image} alt={room.name} className="w-24 h-24 object-cover rounded-lg mr-4 shadow-sm" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-900">{room.name}</h4>
                  {selectedRoom === room.name && <Check className="w-5 h-5 text-blue-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-1">{room.perks.join(" • ")}</p>
                <p className="text-sm font-bold text-gray-900 mt-2">
                  {room.priceModifier > 0 ? `+ ₹ ${room.priceModifier}` : 'Base Price'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-100 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2" />Fare Summary</h3>
            <div className="space-y-3 border-b border-gray-300 pb-4 mb-4">
              <div className="flex justify-between items-center"><span className="text-gray-600">Base Fare (1 Night)</span><span className="font-medium">₹ {basePrice.toLocaleString()}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Room Upgrade ({selectedRoom})</span>
                <span className="font-medium text-blue-700">₹ {activeRoomData.priceModifier.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center"><span className="text-gray-600">Taxes and Fees</span><span className="font-medium">₹ {totalTaxes.toLocaleString()}</span></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-bold text-xl">Total Amount</span>
              <span className="font-black text-2xl text-blue-600">₹ {grandTotal.toLocaleString()}</span>
            </div>
          </div>
          <Button className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-bold" onClick={handlebooking}>
            Confirm & Pay
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{hotel.hotelName}</h1>
              <div className="flex items-center space-x-1">
                {[...Array(4)].map((_, i) => (<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="col-span-2 relative">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800" alt="Hotel Main" className="w-full h-[400px] object-cover rounded-xl shadow-sm" />
              </div>
              <div className="space-y-4">
                <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800" alt="Hotel Room" className="w-full h-[192px] object-cover rounded-xl shadow-sm" />
                <img src="https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800" alt="Hotel Amenity" className="w-full h-[192px] object-cover rounded-xl shadow-sm" />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Amenities Provided</h2>
              <div className="bg-white border border-gray-200 p-6 rounded-xl text-gray-700">
                {hotel.amenities}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" /> Price Insights
                </h3>
                {isPriceFrozen ? (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                    <Snowflake className="w-3 h-3 mr-1" /> Price Frozen
                  </span>
                ) : (
                  <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> High Demand (+20%)
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                {isPriceFrozen 
                  ? "You have successfully locked in this price. It will not increase for the next 24 hours."
                  : "Prices for this hotel are currently higher than usual due to upcoming holiday travel. We recommend booking soon or freezing the price."}
              </p>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">7-Day Price History</p>
                <div className="h-32 flex items-end justify-between space-x-2">
                  {priceHistory.map((price, idx) => {
                    const maxPrice = Math.max(...priceHistory);
                    const heightPercent = (price / maxPrice) * 100;
                    const isToday = idx === priceHistory.length - 1;
                    return (
                      <div key={idx} className="w-full flex flex-col items-center group relative">
                        <div className="absolute -top-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ₹ {price}
                        </div>
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-300 ${isToday ? 'bg-blue-600' : 'bg-blue-200 group-hover:bg-blue-300'}`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <span className="text-[10px] text-gray-400 mt-2 font-medium">
                          {isToday ? 'Today' : `Day ${idx + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <ReviewSection targetId={hotel.id} targetType="HOTEL" />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 border-t-4 border-blue-600">
              <h3 className="text-xl font-bold mb-2">Reserve Your Stay</h3>
              <p className="text-gray-500 mb-6 text-sm">Select your preferred room type in the next step.</p>

              <div className="space-y-2 mb-6 border-t pt-4">
                <div className="flex items-center justify-between"><span className="text-gray-500">Starting from:</span></div>
                <div className="flex items-center justify-between text-2xl font-bold">
                  {!isPriceFrozen && <div className="text-xs text-red-500 line-through mr-2">₹ {rawBasePrice}</div>}
                  <span>₹ {basePrice.toLocaleString()} <span className="text-sm font-normal text-gray-500">/ night</span></span>
                </div>
              </div>

              {!isPriceFrozen && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                  <div className="flex items-start mb-3">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-800 font-medium">Not ready to book? Protect yourself from price surges.</p>
                  </div>
                  <button 
                    onClick={handlePriceFreeze}
                    className="w-full bg-white text-blue-700 border border-blue-200 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Snowflake className="w-4 h-4 mr-2 text-blue-500" />
                    Freeze Price for 24h (₹ 199)
                  </button>
                </div>
              )}

              <Dialog open={open} onOpenChange={setopem}>
                <DialogTrigger asChild>
                  <button className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors mb-3 font-bold text-lg shadow-md">
                    Check Room Availability
                  </button>
                </DialogTrigger>
                {user ? (
                  <HotelContent />
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

export default BookHotelPage;