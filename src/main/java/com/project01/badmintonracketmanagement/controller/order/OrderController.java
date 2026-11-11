package com.project01.badmintonracketmanagement.controller.order;

import com.project01.badmintonracketmanagement.dto.ApiResponse;
import com.project01.badmintonracketmanagement.dto.order.OrderRequest;
import com.project01.badmintonracketmanagement.dto.order.OrderResponse;
import com.project01.badmintonracketmanagement.dto.order.UpdateOrderStatusRequest;
import com.project01.badmintonracketmanagement.iservice.order.IOrderService;
import com.project01.badmintonracketmanagement.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final IOrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody OrderRequest request) {
        OrderResponse response = orderService.createOrder(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<OrderResponse> response = orderService.getUserOrders(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Order history retrieved successfully", response));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrdersExplicit(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<OrderResponse> response = orderService.getUserOrders(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Order history retrieved successfully", response));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByUser(@PathVariable Integer userId) {
        List<OrderResponse> response = orderService.getUserOrders(userId);
        return ResponseEntity.ok(ApiResponse.success("User orders retrieved successfully", response));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        List<OrderResponse> response = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success("All orders retrieved successfully", response));
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Integer orderId,
            @RequestBody(required = false) UpdateOrderStatusRequest request,
            @RequestParam(value = "status", required = false) String statusParam) {
        String newStatus = request != null && request.getStatus() != null ? request.getStatus() : statusParam;
        OrderResponse response = orderService.updateOrderStatus(orderId, newStatus);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", response));
    }
}
