import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/query-keys";
import { showSuccessToast } from "../../../lib/toast";
import { orderService } from "../api/order.service";
import type { CreateOrderDto } from "../types/order.types";

export const useOrders = () => {
  return useQuery({
    queryKey: [queryKeys.orders.all],
    queryFn: () => orderService.listOrders(),
    select: (response) => response.data,
  });
};

export const useOrder = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderService.getOrder(id),
    select: (response) => response.data,
    enabled: options?.enabled ?? !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderDto) => orderService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.orders.all] });
      showSuccessToast("Order created successfully");
    },
  });
};
