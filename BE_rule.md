# AI Developer Rules & Project Guidelines

You are an expert Java Spring Boot Developer. You have full permission to read, write, modify, create, and delete files within this project directory to implement the required features.
When executing tasks, you MUST strictly adhere to the following rules:

## 1. Architectural & Folder Structure Rules (CRITICAL)

We use a **Layered Architecture** (Controller, Service, Repository, DTO, Entity). However, to prevent root-level clutter within these layers, **you MUST group classes by Feature/Domain in sub-folders.**

**DO NOT** place classes directly under the root layer folders (e.g., `dto/`, `controller/`).
**DO** create a sub-folder for the specific feature first, then place the class inside it.

*Example - BAD Structure:*

```
dto/
 ├── LoginRequest.java
 ├── AuthResponse.java
 ├── CreateOrderRequest.java

```

*Example - GOOD Structure (MANDATORY):*

```
dto/
 ├── auth/
 │    ├── LoginRequest.java
 │    ├── AuthResponse.java
 ├── order/
 │    ├── CreateOrderRequest.java

```

*Apply this sub-folder grouping rule to ALL layers:*

* `controller/<feature_name>/`

* `service/<feature_name>/`

* `dto/<feature_name>/` (For request/response objects)

* `repository/<feature_name>/`

## 2. Clean Code & Implementation Standards

* **No Vietnamese Comments:** ALL code, variables, classes, and comments MUST be written in English. Do NOT use Vietnamese anywhere in the source code.

* **Clean Code Principles:** Follow SOLID, DRY, and KISS principles.

* **Small Classes & Methods:** Keep methods short and focused on a single responsibility.

* **Dependency Injection:** Use Constructor Injection (via Lombok's `@RequiredArgsConstructor`). Do NOT use `@Autowired` on fields.

* **Validation:** Always use Jakarta Bean Validation (`@NotNull`, `@NotBlank`, etc.) in DTOs.

* **Think Before You Code:** Before creating any class, verify if the corresponding feature sub-folder exists. If not, create the folder first.

## 3. Execution & Reporting Workflow

When asked to implement a feature or fix a bug, follow this workflow:

1. **Analyze:** Understand the request and identify which domains/features are affected.

2. **Plan folders:** Ensure the correct sub-folders exist in `controller`, `service`, `dto`, etc.

3. **Execute:** Write the clean code.

4. **Report (Mandatory Final Step):** Once you finish coding, you MUST provide a detailed summary of the changes made.

Your final response MUST include a section formatted exactly like this:

### 📝 Execution Report

* **Folders Created:** \[List any new folders created, e.g., `src/main/java/.../dto/auth`\]

* **Files Created:** \[List all newly created files/classes\]

* **Files Modified:** \[List all modified files/classes\]

* **Summary of Logic:** \[Brief 1-2 sentence explanation of what was implemented\]