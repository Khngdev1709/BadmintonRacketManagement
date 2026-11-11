package com.project01.badmintonracketmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Product_Images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;

    @Column(name = "ImageURL", nullable = false, length = 500)
    private String imageUrl;
}
