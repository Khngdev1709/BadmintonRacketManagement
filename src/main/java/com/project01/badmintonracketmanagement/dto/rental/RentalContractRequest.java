package com.project01.badmintonracketmanagement.dto.rental;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalContractRequest {

    @NotEmpty(message = "Rental contract must contain at least one item")
    @JsonAlias({"products", "rentalItems"})
    private List<@Valid RentalItemRequest> items;

    @NotNull(message = "Expected return date is required")
    @Future(message = "Expected return date must be in the future")
    private LocalDateTime expectedReturnDate;

    @NotBlank(message = "Deposit type is required")
    @Size(max = 50, message = "Deposit type must not exceed 50 characters")
    private String depositType;

    @Size(max = 500, message = "Note must not exceed 500 characters")
    private String note;
}
