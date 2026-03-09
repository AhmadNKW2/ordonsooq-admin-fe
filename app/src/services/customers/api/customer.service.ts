/**
 * Customer/User API Service
 * Handles all user-related API calls for /api/users
 */

import { httpClient } from "../../../lib/api/http-client";
import {
  Customer,
  CustomerWithWishlist,
  CustomerListResponse,
  CustomerFilters,
  CreateCustomerDto,
  UpdateCustomerDto,
  WishlistItem,
} from "../types/customer.types";

class CustomerService {
  private endpoint = "/users";

  /**
   * Get all users with optional filters
   * GET /api/users
   */
  async getCustomers(filters?: CustomerFilters): Promise<CustomerListResponse> {
    // Intercept array roles to bypass backend single-enum validation restrictions
    if (filters?.role && Array.isArray(filters.role)) {
      const roles = filters.role;
      const results = await Promise.all(
        roles.map((role) =>
          httpClient.get<CustomerListResponse>(this.endpoint, { ...filters, role })
        )
      );

      const mergedData = results.flatMap((res) => res.data || []);
      // If we ask for 10 per page, we might get 10 admins + 10 catalog_managers, 
      // which is 20 total. This is an acceptable tradeoff for frontend aggregation.
      
      const total = results.reduce((acc, res) => acc + (res.meta?.total || 0), 0);
      const limit = filters.limit || 10;

      return {
        data: mergedData,
        meta: {
          total,
          page: filters.page || 1,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return httpClient.get<CustomerListResponse>(this.endpoint, filters);
  }

  /**
   * Get a single user by ID (with wishlist)
   * GET /api/users/:id
   */
  async getCustomer(id: number): Promise<CustomerWithWishlist> {
    return httpClient.get<CustomerWithWishlist>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new user
   * POST /api/users
   */
  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    return httpClient.post<Customer>(this.endpoint, data);
  }

  /**
   * Update a user
   * PATCH /api/users/:id
   */
  async updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
    return httpClient.patch<Customer>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete a user
   * DELETE /api/users/:id
   */
  async deleteCustomer(id: number): Promise<void> {
    return httpClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Add a product to user's wishlist
   * POST /api/users/:id/wishlist
   */
  async addToWishlist(userId: number, productId: number): Promise<WishlistItem> {
    return httpClient.post<WishlistItem>(`${this.endpoint}/${userId}/wishlist`, {
      product_id: productId,
    });
  }

  /**
   * Remove a product from user's wishlist
   * DELETE /api/users/:id/wishlist/:productId
   */
  async removeFromWishlist(userId: number, productId: number): Promise<void> {
    return httpClient.delete<void>(`${this.endpoint}/${userId}/wishlist/${productId}`);
  }
}

export const customerService = new CustomerService();
