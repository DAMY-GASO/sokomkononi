export const fetchProperty = (id) => {
  return Promise.resolve({
    data: {
      id,
      title: "Nyumba ya Vyumba 3 Mbezi",
      price: 85000000,
      location: "Dar es Salaam",
      description: "Nyumba nzuri yenye vyumba 3, sebule, jikoni, bafu mbili, na karakta. Iko katika eneo salama.",
      status: "available",
      seller: { id: "seller456", name: "Juma Mwalimu" }
    }
  });
};
