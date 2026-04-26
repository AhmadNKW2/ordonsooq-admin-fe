import { httpClient } from "../../../lib/api/http-client";
import type { ApiResponse, PaginatedApiResponse, PaginatedResponse } from "../../../types/common.types";
import type {
  CreatePartnerDto,
  Partner,
  PartnerListParams,
  UpdatePartnerDto,
} from "../types/partner.types";

class PartnerService {
  private endpoint = "/partners";

  async listPartners(
    params?: PartnerListParams
  ): Promise<ApiResponse<PaginatedResponse<Partner>>> {
    const response = await httpClient.get<PaginatedApiResponse<Partner>>(this.endpoint, params);

    return {
      success: response.success,
      message: response.message,
      time: response.time,
      data: {
        data: response.data,
        pagination: response.meta,
      },
    };
  }

  async getPartner(id: number): Promise<ApiResponse<Partner>> {
    return httpClient.get<ApiResponse<Partner>>(`${this.endpoint}/${id}`);
  }

  async createPartner(data: CreatePartnerDto): Promise<ApiResponse<Partner>> {
    return httpClient.post<ApiResponse<Partner>>(this.endpoint, data);
  }

  async updatePartner(id: number, data: UpdatePartnerDto): Promise<ApiResponse<Partner>> {
    return httpClient.patch<ApiResponse<Partner>>(`${this.endpoint}/${id}`, data);
  }

  async deletePartner(id: number): Promise<ApiResponse<void>> {
    return httpClient.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }
}

export const partnerService = new PartnerService();