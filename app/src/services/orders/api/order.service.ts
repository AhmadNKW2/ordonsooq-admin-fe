import { httpClient } from "../../../lib/api/http-client";
import type { ApiResponse } from "../../../types/common.types";
import type { CreateOrderDto, Order } from "../types/order.types";

class OrderService {
  private endpoint = "/orders";

  listOrders(): Promise<ApiResponse<Order[]>> {
    return httpClient.get<ApiResponse<Order[]>>(this.endpoint);
  }

  getOrder(id: number): Promise<ApiResponse<Order>> {
    return httpClient.get<ApiResponse<Order>>(`${this.endpoint}/${id}`);
  }

  createOrder(data: CreateOrderDto): Promise<ApiResponse<Order>> {
    return httpClient.post<ApiResponse<Order>>(this.endpoint, data);
  }
}

export const orderService = new OrderService();
