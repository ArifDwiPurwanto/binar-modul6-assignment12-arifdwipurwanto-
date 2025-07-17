# Update-Profile: A Fullstack Next.js Project

## Project Description

This project is a sample full-stack application built with Next.js (App Router). It includes a simple frontend with login and profile update forms, a mock backend with API routes, and a complete testing and CI/CD setup.

## How to Run the Project

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd update-profile
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

    _Note: If you had issues with the automated dependency installation, you may need to install the testing libraries manually:_

    ```bash
    npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:

    ```bash
    cp .env.example .env
    ```

    Update the `.env` file with your local configuration if needed.

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

5.  **Run tests:**

    ```bash
    npm test
    ```

    To run tests with coverage, use:

    ```bash
    npm test -- --coverage
    ```

6.  **View Code Coverage Report:**
    After running the coverage command, an interactive HTML report is generated. To view it, open the following file in your browser:
    ```
    coverage/lcov-report/index.html
    ```
    This report provides a line-by-line view of which code is covered by your tests, similar to `go tool cover`.

## Folder Structure

```
update-profile/
├── .github/
│   └── workflows/
│       └── test.yml      # GitHub Actions workflow for CI
├── __tests__/             # Jest test files
│   ├── api-password.test.ts
│   ├── api-profile.test.ts
│   ├── login.test.tsx
│   └── profile.test.tsx
├── src/
│   └── app/
│       ├── api/          # API routes
│       │   ├── login/
│       │   ├── password/
│       │   └── profile/
│       ├── login/        # Login page
│       └── profile/      # Profile page
├── .env.example          # Example environment variables
├── .gitignore
├── codecov.yml           # Codecov configuration
├── jest.config.js        # Jest configuration
├── jest.setup.js         # Jest setup file
├── next.config.js
├── package.json
└── README.md
```

## Role Breakdown

- **Frontend (FE):**

  - Responsible for the UI and client-side logic.
  - Files: `src/app/login/page.tsx`, `src/app/profile/page.tsx`

- **Backend (BE):**

  - Responsible for the API endpoints and server-side logic.
  - Files: `src/app/api/login/route.ts`, `src/app/api/profile/route.ts`, `src/app/api/password/route.ts`

- **QA (Quality Assurance):**

  - Drives the testing strategy and defines test cases.
  - The `api-password` route is an example of QA-driven development, where tests are created before the implementation.

- **DevOps:**
  - Manages the CI/CD pipeline and deployment processes.
  - Files: `.github/workflows/test.yml`, `codecov.yml`

## CI/CD and Coverage

- **Continuous Integration (CI):** The project uses GitHub Actions to run tests automatically on every push and pull request to the `main` branch. The workflow is defined in `.github/workflows/test.yml`.
- **Code Coverage:** Code coverage is generated on each test run and uploaded to Codecov. This helps in tracking the quality of the tests and ensuring that new code is adequately tested. The `codecov.yml` file configures how coverage is reported.

## Notes

- **Purpose:** This project serves as a template or a starting point for building full-stack Next.js applications with a focus on best practices for testing and CI/CD.
- **Extensibility:** The project can be easily extended by adding more pages, API routes, and components. The existing structure provides a clear separation of concerns, making it scalable for larger applications.
