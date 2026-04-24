import { create } from 'zustand';
import * as featuresApi from '../api/features';
import { FeatureMap } from '../api/features';

interface FeaturesState {
  plan: string | null;
  features: FeatureMap;
  loaded: boolean;

  loadFeatures: () => Promise<void>;
  clearFeatures: () => void;
  hasFeature: (name: string) => boolean;
}

export const useFeaturesStore = create<FeaturesState>((set, get) => ({
  plan: null,
  features: {},
  loaded: false,

  loadFeatures: async () => {
    try {
      const { plan, features } = await featuresApi.getCompanyFeatures();
      set({ plan, features, loaded: true });
    } catch {
      // If the call fails we treat every feature as disabled so the UI
      // matches the server's gating behavior instead of silently showing
      // features that would 403 on use.
      set({ plan: null, features: {}, loaded: true });
    }
  },

  clearFeatures: () => set({ plan: null, features: {}, loaded: false }),

  hasFeature: (name: string) => get().features[name] === true,
}));

export function useFeature(name: string): boolean {
  return useFeaturesStore((s) => s.features[name] === true);
}
