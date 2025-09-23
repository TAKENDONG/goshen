export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'employee' | 'feed_manager' | 'accountant' | 'cooperative_member';

export interface Farm {
  id: string;
  name: string;
  total_capacity: number;
  created_at: string;
}

export interface Flock {
  id: string;
  farm_id: string;
  name: string;
  capacity: number;
  current_count: number;
  start_date: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface EggProduction {
  id: string;
  flock_id: string;
  date: string;
  eggs_produced: number;
  recorded_by: string;
  created_at: string;
}

export interface Mortality {
  id: string;
  flock_id: string;
  date: string;
  deaths: number;
  cause?: string;
  recorded_by: string;
  created_at: string;
}

export interface FeedConsumption {
  id: string;
  flock_id: string;
  date: string;
  quantity_kg: number;
  feed_type: string;
  recorded_by: string;
  created_at: string;
}

export interface Vaccination {
  id: string;
  flock_id: string;
  vaccine_name: string;
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  administered_by?: string;
  status: 'scheduled' | 'completed' | 'overdue';
  created_at: string;
}

export interface EggSale {
  id: string;
  date: string;
  trays_count: number;
  unit_price: number;
  client_name: string;
  total_amount: number;
  recorded_by: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  recorded_by: string;
  created_at: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  unit_price: number;
  supplier?: string;
  created_at: string;
}

export interface FeedProduction {
  id: string;
  date: string;
  feed_type: string;
  quantity_produced: number;
  raw_materials_used: any; // JSON object
  production_cost: number;
  recorded_by: string;
  created_at: string;
}

export interface FeedSale {
  id: string;
  date: string;
  client_name: string;
  feed_type: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  recorded_by: string;
  created_at: string;
}