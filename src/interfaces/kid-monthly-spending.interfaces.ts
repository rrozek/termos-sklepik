export interface KidMonthlySpending {
  id: string;
  kid_id: string;
  year: number;
  month: number;
  spending_amount: number;
  created_at: Date;
  updated_at: Date;
}
