package com.project01.badmintonracketmanagement.dto.rental;

import com.project01.badmintonracketmanagement.entity.RentalDetail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalDetailResponse {

    private Integer id;
    private Integer productId;
    private String productName;
    private String thumbnailImage;
    private Integer quantity;
    private BigDecimal pricePerDay;
    private BigDecimal subtotal;

    public static RentalDetailResponse fromEntity(RentalDetail detail, long rentalDays) {
        BigDecimal days = BigDecimal.valueOf(rentalDays);
        BigDecimal subtotal = detail.getPricePerDay()
                .multiply(BigDecimal.valueOf(detail.getQuantity()))
                .multiply(days);

        return RentalDetailResponse.builder()
                .id(detail.getId())
                .productId(detail.getProduct().getId())
                .productName(detail.getProduct().getName())
                .thumbnailImage(detail.getProduct().getThumbnailImage())
                .quantity(detail.getQuantity())
                .pricePerDay(detail.getPricePerDay())
                .subtotal(subtotal)
                .build();
    }
}
