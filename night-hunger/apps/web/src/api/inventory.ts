import api from './client';
import { mockBackend, withMockApi } from './mockBackend';

export interface InventoryItem {
  itemId: string;
  itemType: string;
  quantity: number;
  name?: string;
  icon?: string;
  effectValue?: number | null;
}

export interface UseItemRequest {
  itemId: string;
}

export interface UseItemResponse {
  success: boolean;
  itemId: string;
  message: string;
  effect?: {
    type: string;
    value: number;
  };
}

export interface SellItemRequest {
  itemId: string;
  quantity?: number;
}

export interface SellItemResponse {
  success: boolean;
  itemId: string;
  soldQuantity: number;
  totalReceived: number;
  message: string;
}

export const inventoryApi = {
  getInventory: async (): Promise<InventoryItem[]> =>
    withMockApi(
      async () => {
        const response = await api.get<InventoryItem[]>('/inventory');
        return response.data;
      },
      () => mockBackend.getInventory(),
      'core',
    ),

  useItem: async (itemId: string): Promise<UseItemResponse> =>
    withMockApi(
      async () => {
        const response = await api.post<UseItemResponse>('/inventory/use', { itemId });
        return response.data;
      },
      () => mockBackend.useItem(itemId),
      'core',
    ),

  sellItem: async (itemId: string, quantity: number = 1): Promise<SellItemResponse> =>
    withMockApi(
      async () => {
        const response = await api.post<SellItemResponse>('/inventory/sell', { itemId, quantity });
        return response.data;
      },
      () => mockBackend.sellItem(itemId, quantity),
      'core',
    ),
};
