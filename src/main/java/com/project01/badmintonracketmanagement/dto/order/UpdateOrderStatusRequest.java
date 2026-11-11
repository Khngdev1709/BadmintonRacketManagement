package com.project01.badmintonracketmanagement.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderStatusRequest {

    @NotBlank(message = "Status is required")
    @Pattern(
            regexp = "^(?i)(Pending|Confirmed|Shipped|Delivered|Cancelled)$",
            message = "Status must be one of: Pending, Confirmed, Shipped, Delivered, Cancelled"
    )
    private String status;
}
