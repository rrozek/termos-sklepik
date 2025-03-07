export enum UserRole {
  ADMIN = 'admin',
  PARENT = 'parent',
  STAFF = 'staff',
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  portal_user_id: number;
  phone?: string;
  is_active: boolean;
  created_at: Date | undefined;
  updated_at: Date | undefined;
}
