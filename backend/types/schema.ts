// Existing types remain the same...
export type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
};

export type InsertUser = Omit<User, "id" | "createdAt">;

export type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
};

export type InsertCategory = Omit<Category, "id">;

export type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  originalPrice: string | null;
  categoryId: number;
  imageUrl: string;
  rating: string;
  reviewCount: number;
  downloadCount: number;
  tags: string[];
  downloadUrl: string;
  isFree: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertProduct = {
  title: string;
  description: string;
  price: string;
  originalPrice: string | null;
  categoryId: number;
  imageUrl: string;
  rating: string;
  reviewCount: number;
  downloadCount: number;
  tags: string[];
  downloadUrl: string;
  isFree: boolean;
  isActive: boolean;
};

export type CartItem = {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  createdAt: Date;
};

export type InsertCartItem = Omit<CartItem, "id" | "createdAt">;

export type Order = {
  id: number;
  userId: number;
  totalAmount: string;
  status: string;
  paymentMethod: string | null;
  createdAt: Date;
  paymentId?: string;
};

export type InsertOrder = Omit<Order, "id" | "createdAt">;

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
};

export type InsertOrderItem = Omit<OrderItem, "id">;

export type ProductWithCategory = Product & { category: Category };

export type CartItemWithProduct = CartItem & { product: ProductWithCategory };

export type OrderWithItems = Order & { items: Array<OrderItem & { product: Product }> };


export interface NOWPaymentsResponse {
  payment_id: string;
  payment_status: string;
  pay_address?: string;
  pay_amount?: string;
  payment_url?: string;
  message?: string;
}
export interface Review {
  id: number;
  productId: number;
  userId: number;
  username: string;
  text: string;
  rating: number;
  createdAt: string;
}