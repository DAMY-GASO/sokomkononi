export const createReservation = ({ dealRoomId, durationHours }) => {
  return Promise.resolve({
    data: { 
      id: "res123", 
      dealRoomId, 
      status: "pending",
      expiresAt: new Date(Date.now() + durationHours * 3600000).toISOString()
    }
  });
};
