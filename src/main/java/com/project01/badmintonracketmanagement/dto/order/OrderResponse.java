package com.project01.badmintonracketmanagement.dto.order;

import com.project01.badmintonracketmanagement.entity.Order;
import com.project01.badmintonracketmanagement.entity.OrderDetail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Integer id;
    private Integer userId;
    private String orderStatus;
    private BigDecimal finalAmount;
    private String paymentMethod;
    private String shippingAddress;
    private LocalDateTime createdAt;
    private List<OrderDetailResponse> orderDetails;

    public static OrderResponse fromEntity(Order order, List<OrderDetail> details) {
        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .orderStatus(order.getOrderStatus())
                .finalAmount(order.getFinalAmount())
                .paymentMethod(order.getPaymentMethod())
                .shippingAddress(order.getShippingAddress())
                .createdAt(order.getCreatedAt())
                .orderDetails(details.stream().map(OrderDetailResponse::fromEntity).toList())
                .build();
    }
}
