export interface Order {
  id: string;
  kid_id: string;
  parent_id: string;
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}
