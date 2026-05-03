import { useRouter } from "next/router";
import {
  Star,
  MapPin,
  Camera,
  Image,
  CreditCard,
  Ticket,
  Home,
  ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { gethotel, handlehotelbooking } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";

// ---> 1. IMPORT THE REVIEW SECTION <---
import ReviewSection from "@/components/ReviewSection";

interface Hotel {
  id: string; 
  hotelName: string; 
  location: string; 
  pricePerNight: number; 
  availableRooms: number; 
  amenities: string; 
}

const BookHotelPage = () => {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { id } = router.query;
  const [hotels, sethotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: any) => state.user.user);
  const [open, setopem] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchhotels = async () => {
      try {
        const data = await gethotel();
        const filteredData = data.filter((hotel: any) => hotel.id === id);
        sethotels(filteredData);
      } catch (error) {
        console.error("Error fetching hotels:", error);
      } finally {
        setLoading(false);
      }
    };
    if(id) fetchhotels();
  }, [id, user]);

  if (loading) return <Loader />;
  if (hotels.length === 0) return <div>No hotel data available for this ID.</div>;

  const hotel = hotels[0];
  
  const hotelData = {
    rating: 4,
    maxRating: 5,
    description: "Experience luxury and comfort in the heart of the city. Perfect for both business and leisure travelers.",
    room: {
      type: "Premium Room",
      capacity: "Fits 2 Adults",
      features: ["Free Breakfast", "Free Wi-Fi", "Non-Refundable", "AC"],
      taxes: 527,
      discountedPrice: 200,
    },
    reviews: { rating: 4.2, count: 784, text: "Very Good" },
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = Number.parseInt(e.target.value);
    setQuantity(isNaN(value) ? 1 : Math.max(1, Math.min(value, hotel.availableRooms)));
  };

  const totalPrice = hotel?.pricePerNight * quantity;
  const totalTaxes = hotelData?.room.taxes * quantity;
  const totalDiscounts = hotelData?.room.discountedPrice * quantity;
  const grandTotal = totalPrice + totalTaxes - totalDiscounts;

  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await handlehotelbooking(
        user?.id,
        hotel?.id,
        quantity,
        grandTotal
      );
      dispatch(setUser(updatedUser));
      setopem(false);
      setQuantity(1);
      router.push("/profile");
    } catch (error) {
      console.log(error);
    }
  };

  const HotelContent = () => (
    <DialogContent className="sm:max-w-[600px] bg-white">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center"><Home className="w-6 h-6 mr-2" />Hotel Booking Details</DialogTitle>
      </DialogHeader>
      <div className="grid gap-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hotelName" className="flex items-center"><Home className="w-4 h-4 mr-2" />Hotel Name</Label>
            <Input id="hotelName" value={hotel.hotelName} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center"><MapPin className="w-4 h-4 mr-2" />Location</Label>
            <Input id="location" value={hotel.location} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricePerNight" className="flex items-center"><Ticket className="w-4 h-4 mr-2" />Price Per Night</Label>
            <Input id="pricePerNight" value={`₹ ${hotel.pricePerNight}`} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity" className="flex items-center"><Ticket className="w-4 h-4 mr-2" />Rooms Needed</Label>
            <Input id="quantity" type="number" min="1" max={hotel.availableRooms} value={quantity} onChange={handleQuantityChange} />
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2" />Fare Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><span className="text-gray-600">Base Fare</span><span className="font-medium">₹ {totalPrice.toLocaleString()}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">Taxes and Fees</span><span className="font-medium">₹ {totalTaxes.toLocaleString()}</span></div>
            <div className="flex justify-between items-center text-green-600"><span className="font-medium">Discounts</span><span className="font-medium">- ₹ {Math.abs(totalDiscounts).toLocaleString()}</span></div>
            <div className="border-t pt-2 mt-2"><div className="flex justify-between items-center"><span className="font-bold text-lg">Total Amount</span><span className="font-bold text-lg">₹ {grandTotal.toLocaleString()}</span></div></div>
          </div>
        </div>
      </div>
      <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={handlebooking}>Proceed to Payment</Button>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <a href="/" className="text-blue-500">Home</a><ChevronRight className="w-4 h-4 text-gray-400" />
            <a href="/" className="text-blue-500">{hotel?.location}</a><ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{hotel?.hotelName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{hotel.hotelName}</h1>
              <div className="flex items-center space-x-1">
                {[...Array(hotelData.rating)].map((_, i) => (<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="col-span-2 relative">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800" alt="Hotel Main" className="w-full h-80 object-cover rounded-lg" />
              </div>
              <div className="space-y-4">
                <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800" alt="Hotel Room" className="w-full h-[152px] object-cover rounded-lg" />
                <img src="https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800" alt="Hotel Amenity" className="w-full h-[152px] object-cover rounded-lg" />
              </div>
            </div>

            <p className="text-gray-600 mb-6">{hotelData.description}</p>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Amenities Provided</h2>
              <div className="bg-blue-50 p-4 rounded-lg text-blue-800 font-medium">
                {hotel.amenities}
              </div>
            </div>

            {/* ---> 2. REVIEW SECTION GOES HERE <--- */}
            <ReviewSection targetId={hotel.id} targetType="HOTEL" />

          </div>

          {/* Booking / Checkout Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="text-xl font-semibold mb-4">{hotelData.room.type}</h3>
              <p className="text-gray-600 mb-4">{hotelData.room.capacity}</p>

              <ul className="space-y-3 mb-6">
                {hotelData.room.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2"><span className="text-gray-400">•</span><span className="text-gray-600">{feature}</span></li>
                ))}
              </ul>
              
              <div className="space-y-2 mb-6 border-t pt-4">
                <div className="flex items-center justify-between"><span className="text-gray-500">Price Per Night:</span></div>
                <div className="flex items-center justify-between text-2xl font-bold">
                  <span>₹ {grandTotal}</span>
                  <span className="text-sm text-gray-500 font-normal">+ ₹ {totalTaxes} taxes & fees</span>
                </div>
              </div>

              <Dialog open={open} onOpenChange={setopem}>
                <DialogTrigger asChild>
                  <button className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors mb-3 font-bold text-lg">BOOK THIS NOW</button>
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