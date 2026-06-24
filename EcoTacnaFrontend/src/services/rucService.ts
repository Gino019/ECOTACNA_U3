import { rucApi, RucLookupData } from "./rucApi";

export type RucLookupResponse = RucLookupData;

export const rucService = {
  lookup: async (ruc: string): Promise<RucLookupResponse> => {
    return rucApi.consultarRuc(ruc);
  },
};
