export interface School {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  contact_email?: string;
  contact_phone?: string;
  opening_hour?: string;
  closing_hour?: string;
  monday_enabled: boolean;
  tuesday_enabled: boolean;
  wednesday_enabled: boolean;
  thursday_enabled: boolean;
  friday_enabled: boolean;
  saturday_enabled: boolean;
  sunday_enabled: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
