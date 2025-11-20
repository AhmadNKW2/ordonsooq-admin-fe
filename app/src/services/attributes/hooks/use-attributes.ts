/**
 * React Query hooks for attributes
 */

import { useQuery } from "@tanstack/react-query";
import { attributeService } from "../api/attribute.service";
import { queryKeys } from "../../../lib/query-keys";

export const useAttributes = () => {
  return useQuery({
    queryKey: [queryKeys.attributes.all],
    queryFn: () => attributeService.getAttributes(),
    select: (response) => response.data,
  });
};
