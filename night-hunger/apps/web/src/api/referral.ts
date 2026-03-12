import api from './client';
import { mockBackend, withMockApi } from './mockBackend';

export interface ReferralInfo {
  code: string;
  referredCount: number;
  totalBonusClaimed: number;
  pendingBonus: number;
  referralLink: string;
}

export interface ClaimBonusResponse {
  success: boolean;
  bonus: number;
  message: string;
}

export const referralApi = {
  getReferralCode: async (): Promise<ReferralInfo> =>
    withMockApi(
      async () => {
        const response = await api.get<ReferralInfo>('/referral/code');
        return response.data;
      },
      () => mockBackend.getReferralInfo(),
      'core',
    ),

  claimBonus: async (): Promise<ClaimBonusResponse> =>
    withMockApi(
      async () => {
        const response = await api.post<ClaimBonusResponse>('/referral/bonus');
        return response.data;
      },
      () => mockBackend.claimReferralBonus(),
      'core',
    ),
};
