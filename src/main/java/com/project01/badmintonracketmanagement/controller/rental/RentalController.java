package com.project01.badmintonracketmanagement.controller.rental;

import com.project01.badmintonracketmanagement.dto.ApiResponse;
import com.project01.badmintonracketmanagement.dto.rental.RentalContractRequest;
import com.project01.badmintonracketmanagement.dto.rental.RentalContractResponse;
import com.project01.badmintonracketmanagement.dto.rental.ReturnRentalRequest;
import com.project01.badmintonracketmanagement.iservice.rental.IRentalService;
import com.project01.badmintonracketmanagement.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
public class RentalController {

    private final IRentalService rentalService;

    @PostMapping
    public ResponseEntity<ApiResponse<RentalContractResponse>> createRentalContract(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody RentalContractRequest request) {
        RentalContractResponse response = rentalService.createRentalContract(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Rental contract created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RentalContractResponse>>> getMyRentals(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<RentalContractResponse> response = rentalService.getUserRentals(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Rental history retrieved successfully", response));
    }

    @GetMapping("/my-rentals")
    public ResponseEntity<ApiResponse<List<RentalContractResponse>>> getMyRentalsExplicit(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<RentalContractResponse> response = rentalService.getUserRentals(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Rental history retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RentalContractResponse>> getRentalById(@PathVariable Integer id) {
        RentalContractResponse response = rentalService.getRentalById(id);
        return ResponseEntity.ok(ApiResponse.success("Rental contract details retrieved successfully", response));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<RentalContractResponse>>> getRentalsByUser(@PathVariable Integer userId) {
        List<RentalContractResponse> response = rentalService.getUserRentals(userId);
        return ResponseEntity.ok(ApiResponse.success("User rentals retrieved successfully", response));
    }

    @PostMapping("/{contractId}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<RentalContractResponse>> returnRentalPost(
            @PathVariable Integer contractId,
            @Valid @RequestBody(required = false) ReturnRentalRequest request) {
        BigDecimal surcharge = request != null && request.getSurcharge() != null ? request.getSurcharge() : BigDecimal.ZERO;
        String returnNote = request != null ? request.getReturnNote() : null;
        RentalContractResponse response = rentalService.returnRental(contractId, surcharge, returnNote);
        return ResponseEntity.ok(ApiResponse.success("Rental returned successfully", response));
    }

    @PatchMapping("/{contractId}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<RentalContractResponse>> returnRentalPatch(
            @PathVariable Integer contractId,
            @Valid @RequestBody(required = false) ReturnRentalRequest request) {
        BigDecimal surcharge = request != null && request.getSurcharge() != null ? request.getSurcharge() : BigDecimal.ZERO;
        String returnNote = request != null ? request.getReturnNote() : null;
        RentalContractResponse response = rentalService.returnRental(contractId, surcharge, returnNote);
        return ResponseEntity.ok(ApiResponse.success("Rental returned successfully", response));
    }
}
