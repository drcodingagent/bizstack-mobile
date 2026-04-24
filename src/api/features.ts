import apiClient from './client';

export type FeatureMap = Record<string, boolean>;

export interface CompanyFeatures {
  plan: string | null;
  features: FeatureMap;
}

export async function getCompanyFeatures(): Promise<CompanyFeatures> {
  const response = await apiClient.get('/company/features');
  const payload = response.data?.data ?? response.data;
  return {
    plan: payload?.plan ?? null,
    features: payload?.features ?? {},
  };
}
