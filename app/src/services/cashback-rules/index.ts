export {
  useCashbackRules,
  useCreateCashbackRule,
  useUpdateCashbackRule,
  useDeleteCashbackRule,
} from "./hooks/use-cashback-rules";

export type {
  CashbackRule,
  CashbackRuleType,
  CreateCashbackRuleDto,
  UpdateCashbackRuleDto,
} from "./types/cashback-rule.types";

export { cashbackRuleService } from "./api/cashback-rule.service";
