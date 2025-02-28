export interface Product {
  id: string;
  name: string;
  description?: string;
  ingredients?: string;
  barcode?: string;
  image_url?: string;
  price: number;
  product_group_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
