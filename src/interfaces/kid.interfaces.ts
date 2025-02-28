export interface Kid {
  id: string;
  name: string;
  parent_id: string;
  rfid_token: string[];
  monthly_spending_limit?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
