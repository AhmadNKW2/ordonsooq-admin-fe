export interface OrderItemInput {
  productId: number;
  quantity: number;
  variantId?: number;
}

export interface ShippingAddress {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  country?: string;
  [key: string]: any;
}

export interface CreateOrderDto {
  items: OrderItemInput[];
  paymentMethod: string;
  shippingAddress: ShippingAddress;
}

export interface OrderItem {
  id?: number;
  productId?: number;
  variantId?: number;
  quantity?: number;
  price?: number;
  product?: any;
  variant?: any;
  [key: string]: any;
}

export interface Order {
  id: number;
  status?: string;
  paymentMethod?: string;
  total?: number;
  subtotal?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress;
  shipping_address?: ShippingAddress;
  user?: any;
  [key: string]: any;
}
