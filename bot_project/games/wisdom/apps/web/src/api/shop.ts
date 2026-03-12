import api from './client';

export interface ShopItem {
  id: number;
  itemId: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  rarity: string;
  price: number;
  currency: string;
  stock: number | null;
  minLevel: number;
  canAfford: boolean;
  meetsLevelRequirement: boolean;
}

export interface BuyItemRequest {
  itemId: string;
  shopType?: string;
}

export interface BuyItemResponse {
  success: boolean;
  itemId: string;
  itemName: string;
  quantity: number;
  totalPaid: number;
  message: string;
}

export const shopApi = {
  getItems: async (type: string = 'default'): Promise<ShopItem[]> => {
    const response = await api.get<ShopItem[]>(`/shop/items?type=${type}`);
    return response.data;
  },

  buyItem: async (itemId: string, shopType?: string): Promise<BuyItemResponse> => {
    const response = await api.post<BuyItemResponse>('/shop/buy', { itemId, shopType });
    return response.data;
  },
};
