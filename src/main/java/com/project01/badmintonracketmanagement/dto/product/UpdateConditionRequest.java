package com.project01.badmintonracketmanagement.dto.product;

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
public class UpdateConditionRequest {

    @NotBlank(message = "Condition is required")
    @Pattern(regexp = "^(?i)(New|Used)$", message = "Condition must be either 'New' or 'Used'")
    private String condition;
}
