package com.project01.badmintonracketmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Rental_Contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Column(name = "ExpectedReturnDate", nullable = false)
    private LocalDateTime expectedReturnDate;

    @Column(name = "ActualReturnDate")
    private LocalDateTime actualReturnDate;

    @Column(name = "DepositType", nullable = false, length = 50)
    private String depositType;

    @Column(name = "RentalFeeTotal", nullable = false, precision = 18, scale = 2)
    private BigDecimal rentalFeeTotal;

    @Builder.Default
    @Column(name = "Surcharge", precision = 18, scale = 2)
    private BigDecimal surcharge = BigDecimal.ZERO;

    @Column(name = "Note", length = 500)
    private String note;

    @Builder.Default
    @Column(name = "Status", length = 50)
    private String status = "Renting";

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.surcharge == null) {
            this.surcharge = BigDecimal.ZERO;
        }
        if (this.status == null) {
            this.status = "Renting";
        }
    }
}
