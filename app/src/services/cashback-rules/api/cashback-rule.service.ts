import { httpClient } from "../../../lib/api/http-client";
import type { ApiResponse } from "../../../types/common.types";
import type {
  CashbackRule,
  CreateCashbackRuleDto,
  UpdateCashbackRuleDto,
} from "../types/cashback-rule.types";

class CashbackRuleService {
  private endpoint = "/wallet/cashback-rules";

  listRules(): Promise<ApiResponse<CashbackRule[]>> {
    return httpClient.get<ApiResponse<CashbackRule[]>>(this.endpoint);
  }

  createRule(data: CreateCashbackRuleDto): Promise<ApiResponse<CashbackRule>> {
    return httpClient.post<ApiResponse<CashbackRule>>(this.endpoint, data);
  }

  updateRule(
    id: number,
    data: UpdateCashbackRuleDto
  ): Promise<ApiResponse<CashbackRule>> {
    return httpClient.patch<ApiResponse<CashbackRule>>(`${this.endpoint}/${id}`, data);
  }

  deleteRule(id: number): Promise<ApiResponse<void>> {
    return httpClient.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }
}

export const cashbackRuleService = new CashbackRuleService();
