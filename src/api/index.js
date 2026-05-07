import axios from "axios";

const BACKEND_URL = "http://localhost:8080";

export const login = async (email, password) => {
  try {
    const url = `${BACKEND_URL}/user/login?email=${email}&password=${password}`;
    const res = await axios.post(url);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const signup = async (firstName, lastName, email, phoneNumber, password) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/signup`, {
      firstName, lastName, email, phoneNumber, password,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getuserbyemail = async (email) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/user/email?email=${email}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const editprofile = async (id, firstName, lastName, email, phoneNumber) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/edit?id=${id}`, {
      firstName, lastName, email, phoneNumber,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getflight = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const addflight = async (flightName, from, to, departureTime, arrivalTime, price, availableSeats) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/flight`, {
      flightName, from, to, departureTime, arrivalTime, price, availableSeats,
    });
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const editflight = async (id, flightName, from, to, departureTime, arrivalTime, price, availableSeats) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/flight/${id}`, {
      flightName, from, to, departureTime, arrivalTime, price, availableSeats,
    });
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const gethotel = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/hotel`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const addhotel = async (hotelName, location, pricePerNight, availableRooms, amenities) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/hotel`, {
      hotelName, location, pricePerNight, availableRooms, amenities,
    });
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const edithotel = async (id, hotelName, location, pricePerNight, availableRooms, amenities) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/hotel/${id}`, {
      hotelName, location, pricePerNight, availableRooms, amenities,
    });
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

// Inside src/api/index.js, update these two functions:

export const handleflightbooking = async (userId, flightId, seats, price, selectedSeat = "") => {
  try {
    const url = `${BACKEND_URL}/booking/flight?userId=${userId}&flightId=${flightId}&seats=${seats}&price=${price}&selectedSeat=${selectedSeat}`;
    const res = await axios.post(url);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const handlehotelbooking = async (userId, hotelId, rooms, price, selectedRoom = "") => {
  try {
    const url = `${BACKEND_URL}/booking/hotel?userId=${userId}&hotelId=${hotelId}&rooms=${rooms}&price=${price}&selectedRoom=${selectedRoom}`;
    const res = await axios.post(url);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const cancelBooking = async (userId, bookingId, reason) => {
  try {
    const url = `${BACKEND_URL}/booking/cancel?userId=${userId}&bookingId=${bookingId}&reason=${reason}`;
    const res = await axios.post(url);
    return res.data; 
  } catch (error) {
    console.log("Cancellation error:", error);
    throw error;
  }
};

// Add to the bottom of src/api/index.js

export const getReviews = async (targetId, targetType) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/reviews?targetId=${targetId}&targetType=${targetType}`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const addReview = async (reviewData) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews`, reviewData);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const addReplyToReview = async (reviewId, replyData) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/reply`, replyData);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const voteReviewHelpful = async (reviewId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/helpful`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const flagReview = async (reviewId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/flag`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

// Add to the bottom of src/api/index.js

export const getLiveFlightStatus = async (flightId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/live/flight/${flightId}`);
    return res.data;
  } catch (error) {
    console.log("Error fetching live status:", error);
    return null;
  }
};


// Add this to your src/api/index.js

export const handlePriceFreezeApi = async (userId, targetId, type, price) => {
  try {
    const url = `${BACKEND_URL}/booking/freeze?userId=${userId}&targetId=${targetId}&type=${type}&price=${price}`;
    const res = await axios.post(url);
    return res.data; // Returns the updated User object containing the new freeze
  } catch (error) {
    console.error("Error freezing price:", error);
    throw error;
  }
};