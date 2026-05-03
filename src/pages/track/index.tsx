import React, { useState, useEffect, useRef } from "react";
import { Plane, Clock, AlertCircle, CheckCircle2, BellRing, MapPin, X, Plus, Info, ArrowLeft } from "lucide-react";
import { getLiveFlightStatus } from "@/api";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

interface FlightStatus {
  flightId: string;
  flightName: string;
  from: string;
  to: string;
  status: string;
  delayMinutes: number;
  originalDeparture: string;
  originalArrival: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  message: string;
}

type FlightDataState = {
  loading: boolean;
  error: boolean;
  data: FlightStatus | null;
};

const TrackFlightPage = () => {
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();
  const [flightInput, setFlightInput] = useState("");
  const [trackedIds, setTrackedIds] = useState<string[]>([]);
  const [flightStates, setFlightStates] = useState<Record<string, FlightDataState>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const prevStatusRef = useRef<Record<string, string>>({});

  // Auto-track user bookings
  useEffect(() => {
    if (user?.bookings) {
      const flightBookings = user.bookings
        .filter((b: any) => b.type === "Flight" && b.status !== "CANCELLED")
        .map((b: any) => b.bookingId || b.id);
      
      const uniqueIds = Array.from(new Set(flightBookings)) as string[];
      if (uniqueIds.length > 0) {
        setTrackedIds(uniqueIds);
        // Initialize loading states
        const initialStates: Record<string, FlightDataState> = {};
        uniqueIds.forEach(id => {
          initialStates[id] = { loading: true, error: false, data: null };
        });
        setFlightStates(initialStates);
      }
    }
  }, [user]);

  // Polling mechanism
  useEffect(() => {
    if (trackedIds.length === 0) return;

    const fetchUpdates = async () => {
      setFlightStates((prev) => {
        const nextStates = { ...prev };
        trackedIds.forEach(id => {
          if (!nextStates[id]) nextStates[id] = { loading: true, error: false, data: null };
        });
        return nextStates;
      });

      for (const id of trackedIds) {
        const data = await getLiveFlightStatus(id);
        
        setFlightStates((prev) => ({
          ...prev,
          [id]: {
            loading: false,
            error: !data,
            data: data || null
          }
        }));

        if (data) {
          const prevStatus = prevStatusRef.current[id];
          if (prevStatus && prevStatus !== data.status) {
            triggerNotification(`Update for ${data.flightName}`, `Status changed to ${data.status}: ${data.message}`);
          }
          prevStatusRef.current[id] = data.status;
        }
      }
    };

    fetchUpdates();
    const intervalId = setInterval(fetchUpdates, 5000); 
    return () => clearInterval(intervalId);
  }, [trackedIds]);

  const triggerNotification = (title: string, message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, title, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

  const handleTrackNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightInput.trim()) return;
    if (!trackedIds.includes(flightInput.trim())) {
      setTrackedIds([...trackedIds, flightInput.trim()]);
    }
    setFlightInput("");
  };

  const removeTrackedFlight = (id: string) => {
    setTrackedIds(trackedIds.filter(tId => tId !== id));
    setFlightStates((prev) => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "--:--";
    try {
      return new Date(isoString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString; // fallback if malformed
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ON TIME": return "bg-green-100 text-green-700 border-green-200";
      case "DELAYED": return "bg-red-100 text-red-700 border-red-200";
      case "BOARDING": return "bg-blue-100 text-blue-700 border-blue-200";
      case "DEPARTED": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getProgressWidth = (status: string) => {
    if (status === "DEPARTED") return "50%";
    if (status === "BOARDING") return "10%";
    return "0%";
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 px-4 pb-12 relative overflow-hidden">
      
      {/* PUSH NOTIFICATIONS */}
      <div className="fixed top-24 right-4 z-50 space-y-3 w-80">
        {notifications.map((notif) => (
          <div key={notif.id} className="bg-white border-l-4 border-blue-500 shadow-xl rounded-r-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center text-blue-600 mb-1">
                <BellRing className="w-4 h-4 mr-2" />
                <h4 className="font-bold text-sm">{notif.title}</h4>
              </div>
              <button onClick={() => setNotifications(notifications.filter(n => n.id !== notif.id))} className="text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto">
        {/* BACK TO DASHBOARD BUTTON */}
        <button 
          onClick={() => router.push("/")}
          className="flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="mb-8 bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Plane className="w-8 h-8 mr-3" /> Live Flight Tracker
          </h1>
          <p className="text-blue-100 mb-6">Real-time tracking, delay alerts, and dynamic schedule updates.</p>
          
          <form onSubmit={handleTrackNew} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Enter Flight ID (e.g., 60c72b2...)" 
              value={flightInput}
              onChange={(e) => setFlightInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
            />
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg flex items-center font-bold">
              <Plus className="w-5 h-5 mr-2" /> Track Flight
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          {trackedIds.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
              <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-600">No Flights Tracked</h3>
              <p className="text-gray-500 text-sm mt-1">Enter a flight ID above or log in to automatically track your bookings.</p>
            </div>
          ) : (
            trackedIds.map(id => {
              const state = flightStates[id] || { loading: true, error: false, data: null };
              
              if (state.loading && !state.data && !state.error) {
                return (
                  <div key={id} className="bg-white rounded-xl shadow p-6 animate-pulse flex items-center justify-center h-40">
                    <div className="text-blue-500 font-bold flex items-center"><Clock className="animate-spin w-5 h-5 mr-2"/> Locating Flight Signal...</div>
                  </div>
                );
              }

              if (state.error || !state.data) {
                return (
                  <div key={id} className="bg-white rounded-xl shadow border border-red-200 p-6 flex justify-between items-center">
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="w-6 h-6 mr-3" />
                      <div>
                        <h3 className="font-bold">Flight Not Found</h3>
                        <p className="text-sm text-red-500">ID: {id} does not exist in our system.</p>
                      </div>
                    </div>
                    <button onClick={() => removeTrackedFlight(id)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-600" /></button>
                  </div>
                );
              }

              const flight = state.data;

              return (
                <div key={id} className="bg-white rounded-xl shadow-md border overflow-hidden transition-all hover:shadow-lg">
                  {/* Status Header */}
                  <div className="flex justify-between items-center p-4 border-b bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <Plane className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg">{flight.flightName}</h2>
                        <p className="text-xs text-gray-500 font-mono">ID: {flight.flightId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border flex items-center ${getStatusColor(flight.status)}`}>
                        {flight.status === "DELAYED" && <AlertCircle className="w-3.5 h-3.5 mr-1" />}
                        {flight.status === "ON TIME" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                        {flight.status}
                      </span>
                      <button onClick={() => removeTrackedFlight(id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Visual Flight Path */}
                    <div className="flex justify-between items-center mb-8 relative px-4">
                      {/* Background dashed line */}
                      <div className="absolute left-16 right-16 top-1/2 h-0.5 bg-gray-200 -z-10 border-dashed border-b-2 border-gray-300"></div>
                      
                      {/* Animated Progress Line */}
                      <div 
                        className="absolute left-16 top-1/2 h-0.5 bg-blue-500 -z-10 transition-all duration-1000 ease-in-out"
                        style={{ width: getProgressWidth(flight.status) }}
                      ></div>

                      <div className="text-center bg-white pr-4">
                        <p className="text-2xl font-black">{formatTime(flight.estimatedDeparture)}</p>
                        <p className="text-sm font-semibold text-gray-600 mt-1 flex items-center justify-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" /> {flight.from}
                        </p>
                        {flight.delayMinutes > 0 && (
                          <p className="text-xs text-red-500 line-through mt-1">Was {formatTime(flight.originalDeparture)}</p>
                        )}
                      </div>

                      {/* Moving Plane Icon */}
                      <div className="transition-all duration-1000 ease-in-out" style={{ transform: `translateX(calc(${getProgressWidth(flight.status)} * 1.5))` }}>
                        <Plane className={`w-8 h-8 ${flight.status === "DEPARTED" ? "text-green-500 animate-pulse" : "text-blue-500"}`} />
                      </div>

                      <div className="text-center bg-white pl-4">
                        <p className={`text-2xl font-black ${flight.delayMinutes > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatTime(flight.estimatedArrival)}
                        </p>
                        <p className="text-sm font-semibold text-gray-600 mt-1 flex items-center justify-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" /> {flight.to}
                        </p>
                        {flight.delayMinutes > 0 && (
                          <p className="text-xs text-red-500 line-through mt-1">Was {formatTime(flight.originalArrival)}</p>
                        )}
                      </div>
                    </div>

                    {/* Context / Message Area */}
                    <div className={`p-4 rounded-lg flex items-start ${flight.delayMinutes > 0 ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
                      {flight.delayMinutes > 0 ? <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" /> : <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className={`text-sm font-semibold ${flight.delayMinutes > 0 ? 'text-red-800' : 'text-blue-800'}`}>Live Status Update</p>
                        <p className={`text-sm mt-1 ${flight.delayMinutes > 0 ? 'text-red-600' : 'text-blue-700'}`}>{flight.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackFlightPage;