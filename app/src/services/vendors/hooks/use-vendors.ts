/**
 * React Query hooks for vendors
 */

import { useQuery } from "@tanstack/react-query";
import { vendorService } from "../api/vendor.service";
import { queryKeys } from "../../../lib/query-keys";

export const useVendors = () => {
  return useQuery({
    queryKey: [queryKeys.vendors.all],
    queryFn: () => vendorService.getVendors(),
    select: (response) => response.data,
  });
};
