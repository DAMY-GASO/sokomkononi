// Mock API - replace with real API calls
export const getDealRoom = (id) => {
  return Promise.resolve({
    data: {
      id,
      buyerId: "buyer123",
      buyer: { id: "buyer123", name: "Mary Mwema" },
      seller: { id: "seller456", name: "Juma Mwalimu" },
      property: { 
        id: "prop789", 
        title: "Nyumba ya Vyumba 3 Mbezi",
        price: 85000000,
        images: ["https://picsum.photos/seed/soko-nyumba1/300/220"]
      },
      isAgreed: false,
      agreedPrice: null,
      messages: [
        { id: "msg1", senderId: "seller456", sender: { name: "Juma Mwalimu" }, message: "Karibu, unahitaji maelezo gani?", offerAmount: null },
        { id: "msg2", senderId: "buyer123", sender: { name: "Mary Mwema" }, message: "Je, bei inajadiliwa?", offerAmount: 80000000 },
      ]
    }
  });
};

export const sendDealMessage = (id, data) => {
  return Promise.resolve({ data: { success: true } });
};

export const agreeOnPrice = (id, amount) => {
  return Promise.resolve({ data: { success: true } });
};

export const createDealRoom = (propertyId) => {
  return Promise.resolve({
    data: { id: "dealroom123" }
  });
};
