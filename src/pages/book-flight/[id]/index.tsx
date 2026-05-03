import { useRouter } from "next/router";
import {
  Plane,
  Luggage,
  Clock,
  Calendar,
  MapPin,
  CreditCard,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getflight, handleflightbooking } from "@/api";
import { useDispatch, useSelector } from "react-redux";
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
import { Ticket } from "lucide-react";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";

// ---> 1. IMPORT THE REVIEW SECTION <---
import ReviewSection from "@/components/ReviewSection";

interface Flight {
  id: string; 
  flightName: string; 
  from: string; 
  to: string; 
  departureTime: string; 
  arrivalTime: string; 
  price: number; 
  availableSeats: number; 
}

const BookFlightPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [open, setopem] = useState(false);
  const user = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const data = await getflight();
        const filteredData = data.filter((flight: any) => flight.id === id);
        setFlights(filteredData);
      } catch (error) {
        console.error("Error fetching flights:", error);
      } finally {
        setLoading(false);
      }
    };
    if(id) fetchFlights();
  }, [id, user]);

  if (loading) return <Loader />;
  if (flights.length === 0) return <div>No flight data available for this ID.</div>;

  const flight = flights[0];
  
  const flightDetails = {
    duration: "3h 0m",
    flightNo: "IX 2747",
    aircraft: "Airbus A320",
    cabinBaggage: "7 Kgs / Adult",
    checkInBaggage: "15 Kgs (1 piece only) / Adult",
  };

  const fareSummary = {
    taxes: 1374,
    otherServices: 249,
    discounts: -250,
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleString("en-US", options);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = Number.parseInt(e.target.value);
    setQuantity(isNaN(value) ? 1 : Math.max(1, Math.min(value, flight.availableSeats)));
  };

  const totalPrice = flight?.price * quantity;
  const totalTaxes = fareSummary?.taxes * quantity;
  const totalOtherServices = fareSummary?.otherServices * quantity;
  const totalDiscounts = fareSummary?.discounts * quantity;
  const grandTotal = totalPrice + totalTaxes + totalOtherServices - totalDiscounts;

  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await handleflightbooking(
        user?.id,
        flight?.id,
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

  const BookingContent = () => (
    <DialogContent className="sm:max-w-[600px] bg-white">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Plane className="w-6 h-6 mr-2" />
          Flight Booking Details
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="flightName" className="flex items-center"><Plane className="w-4 h-4 mr-2" />Flight Name</Label>
            <Input id="flightName" value={flight?.flightName} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from" className="flex items-center"><MapPin className="w-4 h-4 mr-2" />From</Label>
            <Input id="from" value={flight?.from} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to" className="flex items-center"><MapPin className="w-4 h-4 mr-2" />To</Label>
            <Input id="to" value={flight?.to} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departureTime" className="flex items-center"><Calendar className="w-4 h-4 mr-2" />Departure Time</Label>
            <Input id="departureTime" value={new Date(flight.departureTime).toLocaleString()} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrivalTime" className="flex items-center"><Clock className="w-4 h-4 mr-2" />Arrival Time</Label>
            <Input id="arrivalTime" value={new Date(flight.arrivalTime).toLocaleString()} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity" className="flex items-center"><Ticket className="w-4 h-4 mr-2" />Number of Tickets</Label>
            <Input id="quantity" type="number" min="1" max={flight.availableSeats} value={quantity} onChange={handleQuantityChange} />
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2" />Fare Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><span className="text-gray-600">Base Fare</span><span className="font-medium">₹ {totalPrice.toLocaleString()}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">Taxes and Surcharges</span><span className="font-medium">₹ {totalTaxes.toLocaleString()}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600">Other Services</span><span className="font-medium">₹ {totalOtherServices.toLocaleString()}</span></div>
            <div className="flex justify-between items-center text-green-600"><span className="font-medium">Discounts</span><span className="font-medium">- ₹ {Math.abs(totalDiscounts).toLocaleString()}</span></div>
            <div className="border-t pt-2 mt-2"><div className="flex justify-between items-center"><span className="font-bold text-lg">Total Amount</span><span className="font-bold text-lg">₹ {grandTotal.toLocaleString()}</span></div></div>
          </div>
        </div>
      </div>
      <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white" onClick={handlebooking}>Proceed to Payment</Button>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <div className="flex items-center flex-wrap gap-4 mb-2">
                    <h2 className="text-lg font-bold flex items-center">
                      <span>{flight?.from}</span>
                      <ArrowRight className="w-5 h-5 mx-2" />
                      <span>{flight?.to}</span>
                    </h2>
                    <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-medium">CANCELLATION FEES APPLY</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(flight.departureTime)}</span>
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Non Stop - {flightDetails.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Plane className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <div className="font-semibold">{flight.flightName}</div>
                  <div className="text-sm text-gray-600">{flightDetails.flightNo} • {flightDetails.aircraft}</div>
                </div>
                <div className="ml-auto text-sm">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full">Economy</span>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-6 border-t pt-6">
                <div>
                  <div className="text-2xl font-bold">{formatDate(flight.departureTime)}</div>
                  <div className="text-sm text-gray-600 mt-1 flex items-start"><MapPin className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />{flight.from} Airport</div>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className="text-sm text-gray-600 mb-1">{flightDetails.duration}</div>
                  <div className="w-32 h-0.5 bg-gray-300 relative my-2"><div className="absolute -top-2 right-0 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center"><Plane className="w-3 h-3 text-gray-600" /></div></div>
                  <div className="text-xs text-gray-500">Non-stop</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatDate(flight.arrivalTime)}</div>
                  <div className="text-sm text-gray-600 mt-1 flex items-start justify-end"><MapPin className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />{flight.to} Airport</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-600 border-t pt-4">
                <div className="flex items-center"><Luggage className="w-5 h-5 mr-2 text-gray-500" /><span>Cabin Baggage: {flightDetails.cabinBaggage}</span></div>
                <div className="flex items-center"><Luggage className="w-5 h-5 mr-2 text-gray-500" /><span>Check-in: {flightDetails.checkInBaggage}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-orange-500" />Cancellation & Date Change Policy</h2>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><Plane className="w-5 h-5 text-blue-600" /></div><span className="font-semibold">{flight.from} - {flight.to}</span></div>
                  <div className="font-bold text-lg text-green-600">50% Refund Guarantee</div>
                </div>
                <div className="text-sm text-gray-600">Cancel anytime before departure and receive an instant 50% refund on the total booking value directly to your account.</div>
              </div>
            </div>

            {/* ---> 2. REVIEW SECTION GOES HERE <--- */}
            <ReviewSection targetId={flight.id} targetType="FLIGHT" />

          </div>

          {/* Booking / Checkout Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-6 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-gray-600" />Fare Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-gray-600">Base Fare</span><span className="font-medium">₹ {totalPrice.toLocaleString()}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Taxes and Surcharges</span><span className="font-medium">₹ {totalTaxes.toLocaleString()}</span></div>
                <div className="flex justify-between items-center text-green-600"><span className="font-medium">Discounts</span><span className="font-medium">- ₹ {Math.abs(totalDiscounts).toLocaleString()}</span></div>
                <div className="border-t pt-2 mt-2"><div className="flex justify-between items-center"><span className="font-bold text-lg">Total Amount</span><span className="font-bold text-lg">₹ {grandTotal.toLocaleString()}</span></div></div>
              </div>
              <Dialog open={open} onOpenChange={setopem}>
                <DialogTrigger asChild>
                  <Button className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-6 text-lg">Book Now</Button>
                </DialogTrigger>
                {user ? (
                  <BookingContent />
                ) : (
                  <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle>Login Required</DialogTitle></DialogHeader>
                    <p>Please log in to continue with your booking.</p>
                    <SignupDialog trigger={<Button className="w-full bg-red-600 hover:bg-red-700 text-white">Log In / Sign Up</Button>} />
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