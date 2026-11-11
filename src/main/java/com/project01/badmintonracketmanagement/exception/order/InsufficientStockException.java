package com.project01.badmintonracketmanagement.exception.order;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String productName, int available, int requested) {
        super(String.format(
                "Insufficient stock for product '%s'. Available: %d, requested: %d",
                productName, available, requested
        ));
    }
}
