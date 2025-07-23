// Données de test réutilisables
export const validProduct = {
  name: 'Burger Classic',
  description: 'Burger bœuf avec salade et tomate',
  price: 9.99,
  stock: 50
};

export const invalidProducts = {
  all: {
    name: 'AB',           // Trop court
    description: 'Desc',  // Trop court
    price: -5,            // Négatif
    stock: 'invalid'      // Pas un nombre
  },
  shortName: {
    name: "No",
    description: "Aucun soucis sur la description",
    price: 10.00,
    stock: 5
  },
  shortDescription: {
    name: "Superman le film",
    description: "Ha",
    price: 10.00,
    stock: 5
  },
  invalidPrice: {
    name: "Superman le film",
    description: "Haaaaaaaaaaaaaaaaaa !",
    price: -99.99,
    stock: 5
  },
  invalidStock: {
    name: "Superman le film",
    description: "Haaaaaaaaaaaaaaaaaa !",
    price: 5.55,
    stock: -1
  },

};



export const validOrder = {
  customerName: 'Jean Dupont',
  items: [
    { productId: 1, quantity: 2 },
    { productId: 2, quantity: 1 }
  ]
};

export const invalidOrder = {
  customerName: 'J',    // Trop court
  items: []             // Vide
};

export const mockProducts = [
  {
    id: 1,
    name: 'Burger Classic',
    description: 'Burger bœuf avec salade',
    price: 9.99,
    stock: 50,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Pizza Margherita',
    description: 'Pizza tomate mozzarella basilic',
    price: 12.50,
    stock: 25,
    created_at: '2024-01-14T09:30:00Z',
    updated_at: '2024-01-14T09:30:00Z'
  },
  {
    id: 3,
    name: 'Salade César',
    description: 'Salade verte avec poulet et croûtons',
    price: 8.75,
    stock: 30,
    created_at: '2024-01-13T14:15:00Z',
    updated_at: '2024-01-13T14:15:00Z'
  }
];
