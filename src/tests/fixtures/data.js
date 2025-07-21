// Données de test réutilisables
export const validProduct = {
  name: 'Burger Classic',
  description: 'Burger bœuf avec salade et tomate',
  price: 9.99,
  stock: 50
};

export const invalidProduct = {
  name: 'AB',           // Trop court
  description: 'Desc',  // Trop court
  price: -5,            // Négatif
  stock: 'invalid'      // Pas un nombre
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
