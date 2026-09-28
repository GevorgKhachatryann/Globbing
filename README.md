# Globbing Automation Testing 

Automated end-to-end test suite for the **Globbing pre-production environment**, built with **Playwright** and **TypeScript**.

## About

This project contains automated end-to-end tests for the Globbing web application.

The automation covers different user flows, including authentication, registration, parcel management, and account settings.

The test suite is continuously being expanded with new automated tests.

## Tech Stack

* **Playwright** — End-to-end test automation
* **TypeScript** — Programming language
* **Node.js** — Runtime environment
* **Mail.tm API** — Temporary email accounts and email verification
* **Git / GitHub** — Version control
* **GitHub Actions** — CI/CD

## Project Structure

```text
Globbing/
│
├── .github/
│   └── workflows/        # GitHub Actions workflows
│
├── data/                  # Test data
│
├── pages/                 # Page Object Model classes
│
├── tests/                 # Playwright test files (.spec.ts)
│
├── utils/                 # Reusable utilities and helpers
│
├── playwright.config.ts   # Playwright configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Project dependencies and scripts
├── package-lock.json
└── README.md
```

## Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Git

Check the installed versions:

```bash
node --version
npm --version
git --version
```

## Installation

Clone the repository:

```bash
git clone https://github.com/GevorgKhachatryann/Globbing.git
```

Navigate to the project directory:

```bash
cd Globbing
```

Install the project dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

## Running Tests

Run all tests:

```bash
npx playwright test
```

Run tests in headed mode:

```bash
npx playwright test --headed
```

Run tests using Playwright UI Mode:

```bash
npx playwright test --ui
```

## Test Reports

After running the tests, open the Playwright HTML report with:

```bash
npx playwright show-report
```

The report can provide information about:

* Passed tests
* Failed tests
* Test duration
* Test steps
* Screenshots
* Videos
* Traces

depending on the Playwright configuration.

## Email Verification

The registration flow uses **Mail.tm** for temporary email accounts and email verification.

The Mail.tm functionality is implemented in the `utils` directory and is used to:

* Create temporary email accounts
* Authenticate with the Mail.tm API
* Receive verification emails
* Retrieve email messages
* Extract verification information
* Clean up the Mail.tm request context after the test run

This allows registration tests to verify email-based functionality automatically without manual email interaction.

## Page Object Model

The project uses the **Page Object Model (POM)** approach.

Page classes are stored in the `pages` directory and contain reusable page-specific:

* Locators
* Actions
* Navigation methods
* Page-related functionality

This helps keep test files cleaner and makes common UI interactions easier to maintain.

## Test Data

Test-related data is stored in the `data` directory.

Keeping test data separate from test implementation makes it easier to maintain and update data used by different test cases.

## Global Teardown

The project uses a global teardown to clean up resources after test execution.

This includes closing the Mail.tm API request context when it is no longer needed.

## Configuration

Playwright configuration is stored in:

```text
playwright.config.ts
```

The configuration includes settings such as:

* Test directory
* Browser projects
* Base URL
* Timeouts
* Retries
* Parallel execution
* Screenshots
* Videos
* Traces
* HTML reporting
* Global teardown

## TypeScript Configuration

TypeScript settings are defined in:

```text
tsconfig.json
```

The project uses modern TypeScript features and is configured for the Playwright test environment.

## Useful Commands

| Command                        | Description                  |
| ------------------------------ | ---------------------------- |
| `npm install`                  | Install project dependencies |
| `npx playwright install`       | Install Playwright browsers  |
| `npx playwright test`          | Run all tests                |
| `npx playwright test --headed` | Run tests with browser UI    |
| `npx playwright test --ui`     | Open Playwright UI Mode      |
| `npx playwright show-report`   | Open the HTML test report    |

## Current Automation Coverage

The current automation includes flows related to:

* Login
* Registration
* Parcel management
* Account settings
* Password management

The test suite is still under development, and additional automated tests will be added over time.
