// src/types/index.ts: Дополнение типов моделью витрины гостевых настоек

export type VenueKind = 'production' | 'venue';
export type UserRole = 'owner' | 'staff' | 'viewer';
export type BatchStatus = 'настаивается' | 'готово' | 'разлито' | 'архив';
export type UnitType = 'г' | 'мл' | 'шт' | 'л' | 'кг';
export type RecipeCategory = 'ягодная' | 'фруктовая' | 'пряная' | 'наливка' | 'гастрономическая' | 'десертная' | 'цитрусовая' | 'другое';

export interface Venue {
  id: string;
  name: string;
  kind: VenueKind;
  is_active: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  venue_id: string | null;
  created_at?: string;
}

export interface Invite {
  id: string;
  token: string;
  role: UserRole;
  venue_id: string | null;
  created_by: string | null;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  venue_id: string;
  quantity: number;
  unit: UnitType;
  min_stock: number;
  expiry_date?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface RecipeIngredient {
  name: string;
  qty: number;   // на 1 литр базы
  unit: UnitType;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
  base_volume_мл: number; // 1000 мл
  days: number;
  target_abv: number;
  yield_мл: number;
  loss_pct: number;
  steps: string;
  category: RecipeCategory;
  notes?: string;
  created_by?: string | null;
}

export interface Infusion {
  id: string;
  name: string;
  recipe_id?: string | null;
  created_by?: string | null;
}

export interface SetCompositionItem {
  infusion_id: string;
  qty_шт: number;
}

export interface InfusionSet {
  id: string;
  title: string;
  composition: SetCompositionItem[];
  notes?: string;
}

export interface Batch {
  id: string;
  infusion_id: string;
  venue_id: string;
  volume_мл: number;
  start_date: string;
  ready_date: string;
  abv: number;
  status: BatchStatus;
  rating?: number | null;
  notes?: string;
  photo_url?: string | null;
  created_at?: string;
}

export interface Transfer {
  id: string;
  transfer_date: string;
  from_venue_id: string;
  to_venue_id: string;
  item_type: 'raw' | 'infusion';
  inventory_id?: string | null;
  infusion_id?: string | null;
  batch_id?: string | null;
  qty: number;
  unit: string;
  created_by?: string | null;
  photo_url?: string | null;
}

export interface Sale {
  id: string;
  report_period: string; // YYYY-MM-01
  venue_id: string;
  position_type: 'настойка' | 'сет';
  infusion_id?: string | null;
  set_id?: string | null;
  name_raw: string;
  portions_qty: number;
  portion_size: number;
  cost: number;
  revenue: number;
  source: 'import' | 'manual';
  created_at?: string;
}

export interface NameMapping {
  id: string;
  name_raw: string;
  infusion_id?: string | null;
  set_id?: string | null;
}

export interface OperationsLog {
  id: string;
  created_at: string;
  user_id?: string | null;
  action: string;
  object: string;
  delta: any;
  details: string;
  photo_url?: string | null;
}

// Витринная карточка настойки для гостей и ресторана
export interface ShowcaseItem {
  id: string;
  title: string;
  title_en: string;
  emoji: string;
  abv: number; // 28-32%
  aging_text: string; // '14 дней', '21 день', 'более месяца'
  category: 'ягодная' | 'цитрусовая' | 'пряная' | 'гастрономическая' | 'десертная' | 'фруктовая' | 'другое';
  flavor_profile: {
    sweetness: number; // 1-5
    acidity: number;   // 1-5
    spice: number;     // 1-5
    density: number;   // 1-5
    descriptors: string[];
  };
  storytelling: string;
  food_pairing: string;
  created_at?: string;
}

export interface AIIntent {
  action: 'batch_create' | 'transfer_item' | 'stock_consume' | 'recipe_suggest' | 'showcase_create' | 'none';
  target_venue?: string;
  items?: Array<{ name: string; qty: number; unit: string }>;
  volume_liters?: number;
  confidence?: number;
  suggested_recipe_id?: string;
  showcase_item?: Omit<ShowcaseItem, 'id'>;
}
