import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Edit2,
  MapPin,
  Calendar,
  CreditCard,
  X,
  Check,
  LogOut,
  Plane,
  Building2,
  AlertCircle,
  Clock,
  Landmark,
  CheckCircle2,
  LayoutDashboard,
  Home,
  FileText,
  Activity
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { clearUser, setUser } from "@/store";
import { editprofile, cancelBooking } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- VISUAL TIMELINE TRACKER ---
const RefundTimeline = ({ status }: { status: string }) => {
  const getProgressWidth = () => {
    if (status === "COMPLETED") return "100%";
    if (status === "PROCESSED") return "50%";
    return "0%"; 
  };

  return (
    <div className="w-full py-6 mt-2 border-t border-red-100">
      <h4 className="text-sm font-bold text-gray-700 mb-6">Refund Tracker</h4>
      <div className="relative flex items-center justify-between px-2 sm:px-8">
        <div className="absolute left-[10%] right-[10%] top-4 h-1 bg-gray-200 z-0 rounded-full"></div>
        <div 
          className="absolute left-[10%] top-4 h-1 bg-green-500 z-0 rounded-full transition-all duration-700 ease-in-out" 
          style={{ width: `calc(${getProgressWidth()} * 0.8)` }}
        ></div>

        <div className="relative z-10 flex flex-col items-center w-24">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs mt-3 font-bold text-gray-800 text-center">Cancelled</span>
          <span className="text-[10px] text-gray-500 text-center">Done</span>
        </div>

        <div className="relative z-10 flex flex-col items-center w-24">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors duration-500 ${
            status === "PENDING" ? "bg-orange-500 text-white animate-pulse" : "bg-green-500 text-white"
          }`}>
            {status === "PENDING" ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <span className={`text-xs mt-3 font-bold text-center ${status === "PENDING" ? "text-orange-600" : "text-gray-800"}`}>
            Processing
          </span>
          <span className="text-[10px] text-gray-500 text-center">
            {status === "PENDING" ? "Under Review" : "Done"}
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center w-24">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors duration-500 ${
            status === "COMPLETED" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
          }`}>
            <Landmark className="w-4 h-4" />
          </div>
          <span className={`text-xs mt-3 font-bold text-center ${status === "COMPLETED" ? "text-green-600" : "text-gray-500"}`}>
            Refunded
          </span>
          <span className="text-[10px] text-gray-500 text-center">
            {status === "COMPLETED" ? "Credited to Bank" : "5-7 Business Days"}
          </span>
        </div>
      </div>
    </div>
  );
};
// ----------------------------------------------

const index = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  const logout = () => {
    dispatch(clearUser());
    router.push("/");
  };
  
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: user?.firstName ? user?.firstName : "",
    lastName: user?.lastName ? user?.lastName : "",
    email: user?.email ? user?.email : "",
    phoneNumber: user?.phoneNumber ? user?.phoneNumber : "",
  });

  const [editForm, setEditForm] = useState({ ...userData });
  
  // Cancellation State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Booking Details State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<any>(null);

  const handleSave = async () => {
    try {
      const data = await editprofile(
        user?.id,
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phoneNumber
      );
      dispatch(setUser(data));
      setIsEditing(false);
    } catch (error) {
      setUserData(editForm);
      setIsEditing(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason) return alert("Please select a reason for cancellation");
    try {
      const updatedUser = await cancelBooking(user.id, selectedBooking.id, cancelReason);
      dispatch(setUser(updatedUser)); 
      setCancelModalOpen(false);
      setSelectedBooking(null);
      setCancelReason("");
    } catch (error) {
      alert("Failed to cancel booking. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleEditFormChange = (field: any, value: any) => {
    setUserData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Profile</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-red-600 flex items-center space-x-1 hover:text-red-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) => handleEditFormChange("firstName", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) => handleEditFormChange("lastName", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleEditFormChange("email", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={userData.phoneNumber}
                      onChange={(e) => handleEditFormChange("phoneNumber", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({ ...user });
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <p>{user?.email}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <p>{user?.phoneNumber}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <button
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                      onClick={() => router.push("/")}
                    >
                      <Home className="w-4 h-4" />
                      <span>Main Dashboard</span>
                    </button>

                    {user?.role === "ADMIN" && (
                      <button
                        className="w-full flex items-center justify-center space-x-2 bg-gray-800 text-white py-2.5 rounded-lg hover:bg-gray-900 transition-colors font-medium shadow-sm"
                        onClick={() => router.push("/admin")}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </button>
                    )}

                    <button
                      className="w-full flex items-center justify-center space-x-2 text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-lg transition-colors font-medium"
                      onClick={logout}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bookings Section */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
              <div className="space-y-6">
                {user?.bookings && user.bookings.length > 0 ? (
                  user.bookings.map((booking: any, index: any) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {booking.status === "CANCELLED" && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                          CANCELLED
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {booking?.type === "Flight" ? (
                            <div className={`p-2 rounded-lg ${booking.status === "CANCELLED" ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600"}`}>
                              <Plane className="w-6 h-6" />
                            </div>
                          ) : (
                            <div className={`p-2 rounded-lg ${booking.status === "CANCELLED" ? "bg-gray-100 text-gray-400" : "bg-green-100 text-green-600"}`}>
                              <Building2 className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <h3 className={`font-semibold ${booking.status === "CANCELLED" ? "text-gray-500 line-through" : "text-black"}`}>
                              {booking?.type}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Booking ID: {booking?.id || booking?.bookingId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${booking.status === "CANCELLED" ? "text-gray-400" : "text-black"}`}>
                            ₹ {booking?.totalPrice?.toLocaleString("en-IN")}
                          </p>
                          <p className="text-sm text-gray-500">Total Paid</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(booking?.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>Qty: {booking?.quantity}</span>
                        </div>
                      </div>

                      {/* Status and Action Area */}
                      <div className="mt-4 pt-4 border-t">
                        {booking.status === "CANCELLED" ? (
                          <div className="bg-red-50 p-4 pb-2 rounded-lg flex flex-col">
                            <div className="flex justify-between items-start w-full">
                              <div>
                                <p className="font-bold text-red-800 flex items-center">
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Booking Cancelled
                                </p>
                                <p className="text-sm text-red-600 mt-1">Reason: {booking.cancellationReason}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-600">
                                  Refund Amount
                                </p>
                                <p className="font-bold text-lg mt-1 text-green-700">₹ {booking.refundAmount?.toLocaleString("en-IN")}</p>
                              </div>
                            </div>
                            
                            <RefundTimeline status={booking.refundStatus || "PENDING"} />
                            
                            <div className="border-t border-red-200 mt-4 pt-3 flex justify-end">
                              <button 
                                onClick={() => { setViewBooking(booking); setDetailsModalOpen(true); }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center"
                              >
                                <FileText className="w-4 h-4 mr-1" /> View Full Details
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                             <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmed
                             </span>
                             <div className="flex space-x-4">
                               <button 
                                 onClick={() => { setViewBooking(booking); setDetailsModalOpen(true); }}
                                 className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline decoration-transparent hover:decoration-blue-800 transition-all"
                               >
                                 View Details
                               </button>
                               <button 
                                 onClick={() => { setSelectedBooking(booking); setCancelModalOpen(true); }}
                                 className="text-red-500 hover:text-red-700 text-sm font-semibold underline decoration-transparent hover:decoration-red-700 transition-all"
                               >
                                 Cancel Booking
                               </button>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">You have no bookings yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center border-b pb-4">
              {viewBooking?.type === "Flight" ? (
                <Plane className="w-6 h-6 mr-2 text-blue-600" />
              ) : (
                <Building2 className="w-6 h-6 mr-2 text-green-600" />
              )}
              {viewBooking?.type} Booking Details
            </DialogTitle>
          </DialogHeader>
          
          {viewBooking && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Booking ID</span>
                <span className="font-semibold text-gray-900 font-mono">{viewBooking.id || viewBooking.bookingId}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Booking Date</span>
                <span className="font-medium text-gray-900">{formatDate(viewBooking.date)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">{viewBooking.type === "Flight" ? "Tickets/Seats" : "Rooms"}</span>
                <span className="font-medium text-gray-900">{viewBooking.quantity}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Total Price Paid</span>
                <span className="font-bold text-gray-900">₹ {viewBooking.totalPrice?.toLocaleString("en-IN")}</span>
              </div>
              
              {/* ---> ADDED SEAT AND ROOM SELECTION BLOCK <--- */}
              <div className="flex justify-between items-center py-3 my-2 border border-blue-100 bg-blue-50 px-3 rounded-lg">
                <span className="text-blue-800 text-sm font-semibold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {viewBooking.type === "Flight" ? "Selected Seat" : "Selected Room"}
                </span>
                <span className="font-black text-blue-900 text-lg">
                  {viewBooking.type === "Flight" ? viewBooking.selectedSeat || 'Auto-Assigned' : viewBooking.selectedRoom || 'Standard Room'}
                </span>
              </div>
              {/* --------------------------------------------- */}

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Current Status</span>
                <span className={`font-bold px-2 py-1 rounded-md text-xs ${viewBooking.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {viewBooking.status}
                </span>
              </div>

              {/* LIVE TRACKING BANNER FOR CONFIRMED FLIGHTS */}
              {viewBooking.type === "Flight" && viewBooking.status !== "CANCELLED" && (
                <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-blue-800 flex items-center">
                      <Activity className="w-4 h-4 mr-2" /> Live Flight Tracker
                    </h4>
                    <p className="text-xs text-blue-600 mt-1">Get real-time updates and boarding info.</p>
                  </div>
                  <button 
                    onClick={() => router.push("/track")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
                  >
                    Track Now
                  </button>
                </div>
              )}

              {/* CANCELLATION INFO FOR CANCELLED BOOKINGS */}
              {viewBooking.status === "CANCELLED" && (
                <div className="bg-red-50 p-4 rounded-lg mt-4 border border-red-100">
                  <h4 className="font-bold text-red-800 mb-2 border-b border-red-200 pb-2">Cancellation Info</h4>
                  <div className="space-y-2 mt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-red-700">Reason</span>
                      <span className="font-medium text-red-900 text-right">{viewBooking.cancellationReason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Refund Amount</span>
                      <span className="font-bold text-red-900">₹ {viewBooking.refundAmount?.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Refund Status</span>
                      <span className="font-medium text-red-900">{viewBooking.refundStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="pt-4 border-t border-gray-100">
            <button 
              onClick={() => setDetailsModalOpen(false)} 
              className="w-full py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Close Details
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Cancel Booking
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 text-orange-800 p-3 rounded-md text-sm">
              <p><strong>Note:</strong> As per our cancellation policy, you are eligible for a <strong>50% refund</strong> on the total paid amount. The rest will be charged as a cancellation fee.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Please tell us why you are cancelling:</label>
              <select 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-red-500 focus:ring-red-500 p-3 border outline-none bg-gray-50"
              >
                <option value="">Select a reason...</option>
                <option value="Plans changed">Plans changed</option>
                <option value="Found a better deal">Found a better deal</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Booking done by mistake">Booking done by mistake</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 mt-6">
              <button 
                onClick={() => setCancelModalOpen(false)} 
                className="w-full sm:w-auto px-4 py-2 mt-3 sm:mt-0 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Keep Booking
              </button>
              <button 
                onClick={handleCancelSubmit} 
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default index;