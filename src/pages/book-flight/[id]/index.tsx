import { useRouter } from "next/router";
import { Plane, Luggage, Clock, Calendar, MapPin, CreditCard, AlertCircle, ArrowRight, Ticket, Check, TrendingUp, Snowflake, BarChart3, Info, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getflight, handleflightbooking, handlePriceFreezeApi } from "@/api";
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
  const { id, travelers: travelersParam } = router.query;

  // ── Read traveler count from query (default 1) ─────────────────────────────
  const travelers = Math.max(1, Math.min(9, parseInt(travelersParam as string) || 1));

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setopem] = useState(false);

  // ── CHANGED: array of selected seats instead of single string ─────────────
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const user = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();

  const [priceHistory, setPriceHistory] = useState([3800, 4100, 4000, 4500, 4900, 5600, 5800]);

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
    if (id) fetchFlights();
  }, [id, user]);

  // Reset selected seats when traveler count changes
  useEffect(() => {
    setSelectedSeats([]);
  }, [travelers]);

  if (loading) return <Loader />;
  if (flights.length === 0) return <div>No flight data available.</div>;

  const flight = flights[0];

  const frozenRecord = user?.priceFreezes?.find((freeze: any) => freeze.targetId === id);
  const isPriceFrozen = !!frozenRecord;

  const demandModifier = 1.15;
  const basePricePerPerson = isPriceFrozen
    ? frozenRecord.lockedPrice
    : Math.round(flight?.price * demandModifier);

  // ── CHANGED: seat upsell is per premium seat selected ──────────────────────
  const premiumSeatCount = selectedSeats.filter((s) => {
    const row = parseInt(s.replace(/\D/g, "")) || 0;
    return row >= 1 && row <= 4;
  }).length;
  const seatUpsellPrice = premiumSeatCount * 800;

  const totalTaxes = 1374 * travelers;
  const grandTotal = basePricePerPerson * travelers + totalTaxes + seatUpsellPrice;

  // ── CHANGED: toggle a seat in/out of the selectedSeats array ──────────────
  const toggleSeat = (seat: string) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else if (selectedSeats.length < travelers) {
      setSelectedSeats([...selectedSeats, seat]);
    }
    // If already at max travelers, do nothing (seat is "locked out")
  };

  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeats.length < travelers) {
      alert(`Please select ${travelers} seat${travelers > 1 ? "s" : ""} (${selectedSeats.length}/${travelers} selected).`);
      return;
    }

    try {
      const updatedUser = await handleflightbooking(
        user?.id,
        flight?.id,
        travelers,
        grandTotal,
        selectedSeats.join(", ")  // Store all seats as comma-separated string
      );
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
      const updatedUser = await handlePriceFreezeApi(user.id, flight.id, "FLIGHT", basePricePerPerson);
      dispatch(setUser(updatedUser));
      alert("Price frozen successfully for 24 hours! A holding fee of ₹199 has been applied.");
    } catch (error) {
      alert("Failed to freeze price. Please make sure backend is running.");
    }
  };

  const isSeatBooked = (seat: string) => {
    const flightHash = flight.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seatHash = seat.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (flightHash + seatHash) % 4 === 0;
  };

  // ── CHANGED: BookingContent uses multi-seat logic ──────────────────────────
  const BookingContent = () => (
    <DialogContent className="sm:max-w-[900px] bg-white max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Plane className="w-6 h-6 mr-2 text-blue-600" /> Complete Your Booking
        </DialogTitle>
      </DialogHeader>

      {/* Traveler progress indicator */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-800">
            Select seats for {travelers} traveler{travelers > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {Array.from({ length: travelers }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  i < selectedSeats.length
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-blue-300 text-blue-400"
                }`}
              >
                {i < selectedSeats.length ? <Check className="w-4 h-4" /> : i + 1}
              </div>
            ))}
            <span className="text-xs text-blue-600 font-semibold ml-1">
              {selectedSeats.length}/{travelers} seats picked
              {selectedSeats.length > 0 && ` — ${selectedSeats.join(", ")}`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
        {/* Seat Map */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-4">
            Select Your Seat{travelers > 1 ? "s" : ""}
          </h3>
          <div className="flex space-x-4 text-xs font-semibold text-gray-500 mb-4">
            <div className="flex items-center"><div className="w-3 h-3 bg-orange-100 border border-orange-400 rounded mr-1"></div> Premium (+₹800)</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-white border border-gray-300 rounded mr-1"></div> Standard</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-gray-300 rounded mr-1"></div> Booked</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-blue-600 rounded mr-1"></div> Selected</div>
          </div>

          {/* ── CHANGED: can't pick more than travelers count ── */}
          {selectedSeats.length >= travelers && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-700 font-semibold text-center">
              All {travelers} seat{travelers > 1 ? "s" : ""} selected. Tap a selected seat to deselect.
            </div>
          )}

          <div className="bg-white p-4 rounded-3xl shadow-inner border-4 border-gray-200 w-full max-w-[280px]">
            <div className="max-h-[420px] overflow-y-auto pr-2">
              {Array.from({ length: 25 }, (_, i) => i + 1).map((row) => (
                <div key={row} className="flex items-center justify-center mb-2">
                  <div className="w-6 text-center text-[10px] font-bold text-gray-400">{row}</div>
                  <div className="flex space-x-1.5">
                    {["A", "B", "C"].map((col) => {
                      const seat = `${row}${col}`;
                      const booked = isSeatBooked(seat);
                      const premium = row <= 4;
                      const selected = selectedSeats.includes(seat);
                      // Gray out unselected seats when limit reached
                      const maxReached = !selected && selectedSeats.length >= travelers;
                      return (
                        <button
                          key={seat}
                          disabled={booked || maxReached}
                          onClick={() => toggleSeat(seat)}
                          className={`w-8 h-8 rounded-t-lg rounded-b-sm border-2 transition-all flex-shrink-0 ${
                            booked
                              ? "bg-gray-300 border-gray-300 cursor-not-allowed"
                              : selected
                              ? "bg-blue-600 border-blue-600 text-white shadow-md transform scale-110"
                              : maxReached
                              ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                              : premium
                              ? "bg-orange-50 border-orange-400 hover:bg-orange-100 text-orange-800"
                              : "bg-white border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {selected ? (
                            <Check className="w-4 h-4 mx-auto" />
                          ) : (
                            <span className="text-[10px] font-bold">{col}</span>
                          )}
                        </button>
                      );
                    })}
                    <div className="w-3 flex-shrink-0"></div>
                    {["D", "E", "F"].map((col) => {
                      const seat = `${row}${col}`;
                      const booked = isSeatBooked(seat);
                      const premium = row <= 4;
                      const selected = selectedSeats.includes(seat);
                      const maxReached = !selected && selectedSeats.length >= travelers;
                      return (
                        <button
                          key={seat}
                          disabled={booked || maxReached}
                          onClick={() => toggleSeat(seat)}
                          className={`w-8 h-8 rounded-t-lg rounded-b-sm border-2 transition-all flex-shrink-0 ${
                            booked
                              ? "bg-gray-300 border-gray-300 cursor-not-allowed"
                              : selected
                              ? "bg-blue-600 border-blue-600 text-white shadow-md transform scale-110"
                              : maxReached
                              ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                              : premium
                              ? "bg-orange-50 border-orange-400 hover:bg-orange-100 text-orange-800"
                              : "bg-white border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {selected ? (
                            <Check className="w-4 h-4 mx-auto" />
                          ) : (
                            <span className="text-[10px] font-bold">{col}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedSeats.length > 0 && (
            <div className="mt-4 bg-blue-50 text-blue-800 px-4 py-2 rounded-lg border border-blue-200 font-bold w-full text-center text-sm">
              Selected: {selectedSeats.join(", ")}
              {premiumSeatCount > 0 && (
                <span className="text-orange-600 text-xs ml-2">
                  ({premiumSeatCount} premium +₹{(premiumSeatCount * 800).toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Fare Summary */}
        <div className="bg-gray-100 rounded-xl p-6 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" /> Fare Summary
            </h3>
            <div className="space-y-3">
              {/* ── CHANGED: show per-person price × count ── */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  Base Fare (₹{basePricePerPerson.toLocaleString()} × {travelers})
                </span>
                <span className="font-medium">₹ {(basePricePerPerson * travelers).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taxes & Surcharges (×{travelers})</span>
                <span className="font-medium">₹ {totalTaxes.toLocaleString()}</span>
              </div>
              {selectedSeats.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Seat Selection ({selectedSeats.join(", ")})
                  </span>
                  <span className={`font-medium ${premiumSeatCount > 0 ? "text-orange-600" : "text-gray-600"}`}>
                    {seatUpsellPrice > 0 ? `+ ₹ ${seatUpsellPrice.toLocaleString()}` : "Free"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4 mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-xl">Total Amount</span>
              <span className="font-black text-2xl text-blue-600">₹ {grandTotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 text-right mb-4">
              for {travelers} traveler{travelers > 1 ? "s" : ""}
            </p>
            <Button
              className={`w-full py-6 text-lg font-bold ${
                selectedSeats.length === travelers
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={handlebooking}
              disabled={selectedSeats.length < travelers}
            >
              {selectedSeats.length < travelers
                ? `Select ${travelers - selectedSeats.length} more seat${travelers - selectedSeats.length > 1 ? "s" : ""}`
                : "Confirm & Pay"}
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
            {/* Flight info card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-xl">{flight.flightName}</div>
                  <div className="text-sm text-gray-600">{flight.from} to {flight.to}</div>
                </div>
                {/* ── CHANGED: show traveler count badge ── */}
                <div className="ml-auto flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-700">
                    {travelers} Traveler{travelers > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-6">
                <div>
                  <div className="text-2xl font-bold">
                    {new Date(flight.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{flight.from}</div>
                </div>
                <Plane className="w-6 h-6 text-gray-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{flight.to}</div>
                </div>
              </div>
            </div>

            {/* Price insights */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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
                    <TrendingUp className="w-3 h-3 mr-1" /> High Demand (+15%)
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-6">
                {isPriceFrozen
                  ? "You have successfully locked in this price. It will not increase for the next 24 hours."
                  : "Prices for this route are currently higher than usual due to upcoming holiday travel. We recommend booking soon or freezing the price."}
              </p>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                  7-Day Price History (per person)
                </p>
                <div className="h-32 flex items-end justify-between space-x-2">
                  {priceHistory.map((price, idx) => {
                    const maxPrice = Math.max(...priceHistory);
                    const heightPercent = (price / maxPrice) * 100;
                    const isToday = idx === priceHistory.length - 1;
                    return (
                      <div key={idx} className="w-full flex flex-col items-center group relative">
                        <div className="absolute -top-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ₹{price}
                        </div>
                        <div
                          className={`w-full rounded-t-sm transition-all duration-300 ${isToday ? "bg-blue-600" : "bg-blue-200 group-hover:bg-blue-300"}`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <span className="text-[10px] text-gray-400 mt-2 font-medium">
                          {isToday ? "Today" : `Day ${idx + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <ReviewSection targetId={flight.id} targetType="FLIGHT" />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 border-t-4 border-blue-600">
              <h2 className="text-xl font-bold mb-1">Book This Flight</h2>
              {/* ── CHANGED: show traveler count prominently ── */}
              <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold mb-4">
                <Users className="w-4 h-4" />
                <span>{travelers} traveler{travelers > 1 ? "s" : ""} · {travelers} seat{travelers > 1 ? "s" : ""} required</span>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-semibold">Price per person</span>
                <div className="text-right">
                  {!isPriceFrozen && (
                    <div className="text-xs text-red-500 line-through">₹ {flight?.price}</div>
                  )}
                  <span className="font-black text-2xl">₹ {basePricePerPerson.toLocaleString()}</span>
                </div>
              </div>

              {/* ── CHANGED: show total for all travelers ── */}
              {travelers > 1 && (
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4 border-b pb-4">
                  <span>Estimated total ({travelers} travelers)</span>
                  <span className="font-bold text-gray-700">
                    ≈ ₹ {(basePricePerPerson * travelers + 1374 * travelers).toLocaleString()}
                  </span>
                </div>
              )}

              {!isPriceFrozen && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                  <div className="flex items-start mb-3">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-800 font-medium">
                      Not ready to book? Protect yourself from price surges.
                    </p>
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
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-bold shadow-md hover:shadow-xl transition-all">
                    Pick {travelers} Seat{travelers > 1 ? "s" : ""}
                  </Button>
                </DialogTrigger>
                {user ? (
                  <BookingContent />
                ) : (
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Login Required</DialogTitle>
                    </DialogHeader>
                    <p>Please log in to continue with your booking.</p>
                    <SignupDialog
                      trigger={
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          Log In / Sign Up
                        </Button>
                      }
                    />
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