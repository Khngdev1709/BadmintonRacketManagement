package com.project01.badmintonracketmanagement.dto.rental;

import com.project01.badmintonracketmanagement.entity.RentalContract;
import com.project01.badmintonracketmanagement.entity.RentalDetail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalContractResponse {

    private Integer id;
    private Integer userId;
    private LocalDateTime expectedReturnDate;
    private LocalDateTime actualReturnDate;
    private String depositType;
    private BigDecimal rentalFeeTotal;
    private BigDecimal surcharge;
    private BigDecimal grandTotal;
    private String note;
    private String status;
    private LocalDateTime createdAt;
    private Long rentalDays;
    private List<RentalDetailResponse> rentalDetails;

    public static RentalContractResponse fromEntity(RentalContract contract, List<RentalDetail> details) {
        LocalDateTime start = contract.getCreatedAt() != null ? contract.getCreatedAt() : LocalDateTime.now();
        LocalDateTime end = contract.getExpectedReturnDate();
        long days = ChronoUnit.DAYS.between(start.toLocalDate(), end.toLocalDate());
        if (days <= 0) {
            days = 1;
        }

        long finalDays = days;
        List<RentalDetailResponse> detailResponses = details.stream()
                .map(d -> RentalDetailResponse.fromEntity(d, finalDays))
                .toList();

        BigDecimal surcharge = contract.getSurcharge() != null ? contract.getSurcharge() : BigDecimal.ZERO;
        BigDecimal grandTotal = contract.getRentalFeeTotal().add(surcharge);

        return RentalContractResponse.builder()
                .id(contract.getId())
                .userId(contract.getUser().getId())
                .expectedReturnDate(contract.getExpectedReturnDate())
                .actualReturnDate(contract.getActualReturnDate())
                .depositType(contract.getDepositType())
                .rentalFeeTotal(contract.getRentalFeeTotal())
                .surcharge(surcharge)
                .grandTotal(grandTotal)
                .note(contract.getNote())
                .status(contract.getStatus())
                .createdAt(contract.getCreatedAt())
                .rentalDays(days)
                .rentalDetails(detailResponses)
                .build();
    }
}
