export const validOrder = {
  customerName: "Michel Dupont",
  items: [
    {
      productId: 1,
      quantity: 2,
    },
    {
      productId: 2,
      quantity: 1,
    },
    {
      productId: 3,
      quantity: 2
    }
  ]
};

export const invalidOrders = {
  shortCustomerName: {
    customerName: "Ha",
    items: [
      {
        productId: 1,
        quantity: 2,
      },
      {
        productId: 2,
        quantity: 1,
      },
      {
        productId: 3,
        quantity: 2
      }
    ]
  },
  noItems: {
    customerName: "Slipman",
    items: [
    ]
  },
  wrongItemId: {
    customerName: "Martin Mystère",
    items: [
      {
        productId: "abc",
        quantity: 1,
      },
    ]
  },
  wrongItemQuantity: {
    customerName: "Babare",
    items: [
      {
        productId: 12,
        quantity: -999999999,
      },
    ]
  }
}

export const mockOrders = [
  {
    customerName: "Jose Fernandez",
    items: [
      {
        productId: 182,
        quantity: 15,
      },
    ]
  },
  {
    customerName: "P'tit Louis",
    items: [
      {
        productId: 85,
        quantity: 1,
      },
      {
        productId: 44,
        quantity: 65
      },
      {
        productId: 1,
        quantity: 5
      }
    ]
  },
  {
    customerName: "Vache Kiri",
    items: [
      {
        productId: 3,
        quantity: 9,
      },
      {
        productId: 6,
        quantity: 1
      },
      {
        productId: 123,
        quantity: 44
      },
      {
        productId: 56,
        quantity: 9
      }
    ]
  },
]