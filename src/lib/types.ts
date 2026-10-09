export type Product = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: string;
  price_kobo: number;
  compare_at_kobo?: number | null;
  image_url: string;
  badge?: string | null;
  is_featured?: boolean;
  stock?: number;
  sort_order?: number;
};

export type CartLine = { productId: string; quantity: number };

export type ShopUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};
