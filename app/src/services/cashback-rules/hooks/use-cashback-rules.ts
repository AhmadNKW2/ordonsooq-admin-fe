import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/query-keys";
import { showSuccessToast } from "../../../lib/toast";
import { cashbackRuleService } from "../api/cashback-rule.service";
import type {
  CreateCashbackRuleDto,
  UpdateCashbackRuleDto,
} from "../types/cashback-rule.types";

export const useCashbackRules = () => {
  return useQuery({
    queryKey: [queryKeys.cashbackRules.all],
    queryFn: () => cashbackRuleService.listRules(),
    select: (response) => response.data,
  });
};

export const useCreateCashbackRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCashbackRuleDto) => cashbackRuleService.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.cashbackRules.all] });
      showSuccessToast("Cashback rule created");
    },
  });
};

export const useUpdateCashbackRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCashbackRuleDto }) =>
      cashbackRuleService.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.cashbackRules.all] });
      showSuccessToast("Cashback rule updated");
    },
  });
};

export const useDeleteCashbackRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cashbackRuleService.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.cashbackRules.all] });
      showSuccessToast("Cashback rule deleted");
    },
  });
};
