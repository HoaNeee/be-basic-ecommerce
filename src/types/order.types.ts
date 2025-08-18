export interface IOrder {
  _id: string;
  user_id: string;
  products: [
    {
      title: string;
      price: number;
      thumbnail: string;
      options: string[];
      quantity: number;
      cost: number;
      SKU: string;
      product_id: string;
      sub_product_id: string;
    }
  ];
  promotion: {
    promotionType: string;
    value: string;
    code: string;
  };
  shippingAddress: {
    name: string;
    address: string;
    phone: string;
  };
  totalPrice: number;
  orderNo: string;
  status: string;
  paymentMethod: string;
  paymentStatus: number;
  deleted: boolean;
  estimatedDelivery: Date;
  delivered: Date;
  resonCancel: string;
  canceledBy: string;
  createdAt: string;
  updatedAt: string;
}
