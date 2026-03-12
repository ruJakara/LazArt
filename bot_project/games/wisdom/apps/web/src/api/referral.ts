import api from './client';

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
  getReferralCode: async (): Promise<ReferralInfo> => {
    const response = await api.get<ReferralInfo>('/referral/code');
    return response.data;
  },

  claimBonus: async (): Promise<ClaimBonusResponse> => {
    const response = await api.post<ClaimBonusResponse>('/referral/bonus');
    return response.data;
  },
};
