export interface Discount {
  id: string;
  name: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  target_type: string;
  target_id?: string;

  // Time-based restrictions
  start_date?: Date;
  end_date?: Date;
  start_time?: string;
  end_time?: string;

  // Day-based restrictions
  monday_enabled?: boolean;
  tuesday_enabled?: boolean;
  wednesday_enabled?: boolean;
  thursday_enabled?: boolean;
  friday_enabled?: boolean;
  saturday_enabled?: boolean;
  sunday_enabled?: boolean;

  // Special conditions
  minimum_purchase_amount?: number;
  minimum_quantity?: number;
  buy_quantity?: number;
  get_quantity?: number;

  is_stackable?: boolean;
  priority?: number;

  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
