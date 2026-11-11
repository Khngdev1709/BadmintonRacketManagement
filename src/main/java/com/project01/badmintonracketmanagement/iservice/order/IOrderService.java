package com.project01.badmintonracketmanagement.iservice.order;

import com.project01.badmintonracketmanagement.dto.order.OrderRequest;
import com.project01.badmintonracketmanagement.dto.order.OrderResponse;

import java.util.List;

public interface IOrderService {

    /**
     * Create a sales order: validates products, deducts stock and persists the order with its details.
     */
    OrderResponse createOrder(Integer userId, OrderRequest request);

    /**
     * Get all orders of a specific user, newest first.
     */
    List<OrderResponse> getUserOrders(Integer userId);

    /**
     * Get all orders in the system for admin, newest first.
     */
    List<OrderResponse> getAllOrders();

    /**
     * Update the status of an order. Cancelling an order restores product stock.
     */
    OrderResponse updateOrderStatus(Integer orderId, String status);
}
