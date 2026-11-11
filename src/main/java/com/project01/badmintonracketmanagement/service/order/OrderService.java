package com.project01.badmintonracketmanagement.service.order;

import com.project01.badmintonracketmanagement.dto.order.OrderItemRequest;
import com.project01.badmintonracketmanagement.dto.order.OrderRequest;
import com.project01.badmintonracketmanagement.dto.order.OrderResponse;
import com.project01.badmintonracketmanagement.entity.Order;
import com.project01.badmintonracketmanagement.entity.OrderDetail;
import com.project01.badmintonracketmanagement.entity.Product;
import com.project01.badmintonracketmanagement.entity.User;
import com.project01.badmintonracketmanagement.exception.BadRequestException;
import com.project01.badmintonracketmanagement.exception.ResourceNotFoundException;
import com.project01.badmintonracketmanagement.exception.order.InsufficientStockException;
import com.project01.badmintonracketmanagement.iservice.order.IOrderService;
import com.project01.badmintonracketmanagement.repository.auth.UserRepository;
import com.project01.badmintonracketmanagement.repository.order.OrderDetailRepository;
import com.project01.badmintonracketmanagement.repository.order.OrderRepository;
import com.project01.badmintonracketmanagement.repository.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService implements IOrderService {

    private static final String CONDITION_NEW = "New";
    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_PENDING = "Pending";
    private static final String STATUS_CANCELLED = "Cancelled";
    private static final List<String> ALLOWED_STATUSES =
            List.of("Pending", "Confirmed", "Shipped", "Delivered", STATUS_CANCELLED);

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public OrderResponse createOrder(Integer userId, OrderRequest request) {
        log.info("Creating order for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        List<OrderDetail> details = new ArrayList<>();
        BigDecimal finalAmount = BigDecimal.ZERO;

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        for (Map.Entry<Integer, Integer> item : aggregateQuantities(request.getItems()).entrySet()) {
            Product product = lockProduct(item.getKey());
            int quantity = item.getValue();
            validateProductForSale(product, quantity);
            product.setStockQuantity(product.getStockQuantity() - quantity);

            details.add(OrderDetail.builder()
                    .product(product)
                    .quantity(quantity)
                    .unitPrice(product.getSellPrice())
                    .build());
            finalAmount = finalAmount.add(product.getSellPrice().multiply(BigDecimal.valueOf(quantity)));
        }

        Order order = orderRepository.save(Order.builder()
                .user(user)
                .finalAmount(finalAmount)
                .orderStatus(STATUS_PENDING)
                .paymentMethod(request.getPaymentMethod().trim())
                .shippingAddress(request.getShippingAddress().trim())
                .build());

        details.forEach(detail -> detail.setOrder(order));
        orderDetailRepository.saveAll(details);

        log.info("Order ID: {} created with final amount: {}", order.getId(), finalAmount);
        return OrderResponse.fromEntity(order, details);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(Integer userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (orders.isEmpty()) {
            return List.of();
        }

        List<Integer> orderIds = orders.stream().map(Order::getId).toList();
        Map<Integer, List<OrderDetail>> detailsByOrderId = orderDetailRepository
                .findByOrderIdsWithProduct(orderIds).stream()
                .collect(Collectors.groupingBy(detail -> detail.getOrder().getId()));

        return orders.stream()
                .map(order -> OrderResponse.fromEntity(order, detailsByOrderId.getOrDefault(order.getId(), List.of())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        if (orders.isEmpty()) {
            return List.of();
        }

        List<Integer> orderIds = orders.stream().map(Order::getId).toList();
        Map<Integer, List<OrderDetail>> detailsByOrderId = orderDetailRepository
                .findByOrderIdsWithProduct(orderIds).stream()
                .collect(Collectors.groupingBy(detail -> detail.getOrder().getId()));

        return orders.stream()
                .map(order -> OrderResponse.fromEntity(order, detailsByOrderId.getOrDefault(order.getId(), List.of())))
                .toList();
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Integer orderId, String status) {
        String newStatus = normalizeStatus(status);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (STATUS_CANCELLED.equals(order.getOrderStatus())) {
            throw new BadRequestException("Cancelled orders cannot be updated");
        }

        List<OrderDetail> details = orderDetailRepository.findByOrderIdWithProduct(orderId);
        if (STATUS_CANCELLED.equals(newStatus)) {
            restoreStock(details);
        }

        log.info("Updating order ID: {} status from {} to {}", orderId, order.getOrderStatus(), newStatus);
        order.setOrderStatus(newStatus);
        return OrderResponse.fromEntity(orderRepository.save(order), details);
    }

    /**
     * Merges duplicate product lines and sorts by product ID so row locks are always
     * acquired in the same order, which prevents deadlocks between concurrent orders.
     */
    private Map<Integer, Integer> aggregateQuantities(List<OrderItemRequest> items) {
        return items.stream().collect(Collectors.toMap(
                OrderItemRequest::getProductId,
                OrderItemRequest::getQuantity,
                Integer::sum,
                TreeMap::new
        ));
    }

    private Product lockProduct(Integer productId) {
        return productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));
    }

    private void validateProductForSale(Product product, int quantity) {
        if (!STATUS_ACTIVE.equalsIgnoreCase(product.getStatus())) {
            throw new BadRequestException("Product '" + product.getName() + "' is not available");
        }
        if (!CONDITION_NEW.equalsIgnoreCase(product.getCondition())) {
            throw new BadRequestException("Product '" + product.getName() + "' is not a new product and cannot be sold");
        }
        if (product.getSellPrice() == null) {
            throw new BadRequestException("Product '" + product.getName() + "' does not have a sell price");
        }
        int available = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        if (available < quantity) {
            throw new InsufficientStockException(product.getName(), available, quantity);
        }
    }

    private void restoreStock(List<OrderDetail> details) {
        for (OrderDetail detail : details) {
            Product product = lockProduct(detail.getProduct().getId());
            product.setStockQuantity(product.getStockQuantity() + detail.getQuantity());
        }
    }

    private String normalizeStatus(String status) {
        return ALLOWED_STATUSES.stream()
                .filter(allowed -> allowed.equalsIgnoreCase(status == null ? "" : status.trim()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Invalid order status: " + status));
    }
}
