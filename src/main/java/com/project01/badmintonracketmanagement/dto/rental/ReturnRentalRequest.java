package com.project01.badmintonracketmanagement.dto.rental;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRentalRequest {

    @DecimalMin(value = "0.0", message = "Surcharge must be greater than or equal to 0")
    @Builder.Default
    private BigDecimal surcharge = BigDecimal.ZERO;

    @Size(max = 500, message = "Return note must not exceed 500 characters")
    private String returnNote;
}
