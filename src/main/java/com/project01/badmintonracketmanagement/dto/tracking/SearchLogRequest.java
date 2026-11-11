package com.project01.badmintonracketmanagement.dto.tracking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchLogRequest {

    @NotBlank(message = "Keyword is required")
    @Size(max = 200, message = "Keyword must not exceed 200 characters")
    private String keyword;
}
