export interface IProduct {
  _id: string;
  title: string;
  content: string;
  shortDescription: string;
  categories: string[];
  slug: string;
  price: number;
  SKU: string;
  stock: number;
  discountedPrice: number;
  cost: number; //last cost
  productType: string;
  thumbnail: string;
  images: string[];
  supplier_id: string;
  status: string;
  deleted: boolean;
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubProduct {
  _id: string;
  price: number;
  SKU: string;
  stock: number;
  discountedPrice: number;
  cost: number; //last cost
  productType: "simple" | "variations";
  thumbnail: string;
  deleted: boolean;
  deletedAt: Date;
}
