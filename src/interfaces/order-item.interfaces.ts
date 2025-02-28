export interface OrderItem {
  id: string | null;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_applied?: number;
  created_at: Date;
  updated_at: Date;
}
