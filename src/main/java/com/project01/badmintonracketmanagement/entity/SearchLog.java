package com.project01.badmintonracketmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Search_Logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "Keyword", nullable = false, length = 200)
    private String keyword;

    @Column(name = "SearchTime")
    private LocalDateTime searchTime;

    @PrePersist
    public void prePersist() {
        if (this.searchTime == null) {
            this.searchTime = LocalDateTime.now();
        }
    }
}
