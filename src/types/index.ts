export interface RPGSystem {
  id: string;
  name: string;
  advancement_label?: string;
}

export interface Chronicle {
  id: string;
  title: string;
  slug: string;
  system_id: string;
  master_name: string;
  systems?: RPGSystem; // From Supabase join
}

export interface Player {
  id: string;
  chronicle_id: string;
  real_name: string;
  char_name: string;
  face_url: string;
  body_url: string;
  description: string;
  is_active: boolean;
  race?: string;
  class?: string;
  level_points?: string;
}

export interface Session {
  id: string;
  chronicle_id: string;
  title: string;
  date_str: string;
  order_index: number;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  session_id: string;
  title: string;
  content: string;
  image_url: string;
  order_index: number;
}
