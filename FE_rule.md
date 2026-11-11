# AI Frontend Developer Rules & Project Guidelines

You are an expert Frontend Developer. You have full permission to read, write, modify, create, and delete files within the frontend directories of this project (specifically within `src/main/resources/static` and `src/main/resources/templates`).
When executing tasks, you MUST strictly adhere to the following rules:

## 1. Architectural & Folder Structure Rules (CRITICAL)

To prevent root-level clutter in the frontend asset folders, **you MUST group HTML, CSS, and JavaScript files by Feature/Domain in sub-folders.**

**DO NOT** dump all scripts or stylesheets directly into a generic `js/` or `css/` folder.
**DO** create a sub-folder for the specific feature first, then place the files inside it.

*Example - BAD Structure:*
```text
src/main/resources/static/
 ├── css/
 │    ├── login.css
 │    ├── order.css
 ├── js/
 │    ├── login.js
 │    ├── api.js
```

*Example - GOOD Structure (MANDATORY):*
```text
src/main/resources/static/
 ├── css/
 │    ├── auth/
 │    │    ├── login.css
 │    ├── order/
 │    │    ├── checkout.css
 ├── js/
 │    ├── auth/
 │    │    ├── login.js
 │    │    ├── auth-api.js
 │    ├── order/
 │    │    ├── order-logic.js
```
*(If using Thymeleaf/HTML in `templates/`, apply the exact same feature-grouping rule: `templates/auth/login.html`, `templates/product/list.html`)*

## 2. Clean Code & Implementation Standards

* **No Vietnamese Comments:** ALL HTML, CSS, JavaScript code, variables, classes, IDs, and comments MUST be written in English. Do NOT use Vietnamese anywhere in the source code.
* **Separation of Concerns:** Do NOT mix inline CSS or raw JavaScript inside HTML files. Keep HTML for structure, CSS for styling, and JS for logic.
* **API Centralization:** Do NOT scatter `fetch()` calls randomly across UI event listeners. Abstract API calls into dedicated service files (e.g., `js/product/product-api.js`) and call those functions from your UI logic.
* **DOM Manipulation:** Keep DOM queries efficient. Use clear, descriptive `id` and `class` names (e.g., using BEM naming convention for CSS is highly encouraged).
* **Think Before You Code:** Before creating any frontend asset, verify if the corresponding feature sub-folder exists in `css`, `js`, or `templates`. If not, create the folder first.

## 3. Execution & Reporting Workflow

When asked to implement a UI feature or fix a frontend bug, follow this workflow:

1. **Analyze:** Understand the UI/UX request and identify which domains/features are affected.
2. **Plan folders:** Ensure the correct sub-folders exist in `static/js`, `static/css`, and `templates/`.
3. **Execute:** Write the clean, modular code.
4. **Report (Mandatory Final Step):** Once you finish coding, you MUST provide a detailed summary of the changes made.

Your final response MUST include a section formatted exactly like this:

### 📝 Execution Report
- **Folders Created:** [List any new folders created, e.g., `src/main/resources/static/js/auth`]
- **Files Created:** [List all newly created files]
- **Files Modified:** [List all modified files]
- **Summary of Logic:** [Brief 1-2 sentence explanation of the UI components or logic implemented]