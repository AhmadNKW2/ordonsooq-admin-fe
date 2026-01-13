export type CashbackRuleType = "percentage" | "fixed" | string;

export interface CashbackRule {
  id: number;
  name: string;
  type: CashbackRuleType;
  value: number;
  minOrderAmount?: number;
  maxCashbackAmount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateCashbackRuleDto {
  name: string;
  type: CashbackRuleType;
  value: number;
  minOrderAmount?: number;
  maxCashbackAmount?: number;
  isActive: boolean;
}

export interface UpdateCashbackRuleDto {
  name?: string;
  type?: CashbackRuleType;
  value?: number;
  minOrderAmount?: number;
  maxCashbackAmount?: number;
  isActive?: boolean;
}
