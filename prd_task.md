# Product Requirements (PRD)

## Feature A: Patient Management (Master Data)
CRUD-S: Implement Create, Read, Update, Delete, and Soft Delete (mark as deleted without removing from DB).

Photo Upload: Ability to upload and store a patient profile picture.

Auto-Generate Medical Record No (No RM):

Format: YYMMDDXXX (e.g., 250221001)

Logic: Year(2) + Month(2) + Day(2) + Sequence(3). Resets daily.

## Feature B: Patient Registration (Transactions)
CRUD-S: Create, Read, Update, Delete, Soft Delete.

Mandatory Fields: Registration Date, Registration Number, Medical Record Number (Relational).

Auto-Generate Registration No:

Format: YYMMDDXXXXXX (e.g., 250221000001)

Logic: Year(2) + Month(2) + Day(2) + Sequence(6). Resets daily.

## Feature C: Search & API
Listing: Display patients sorted by Registration Date.

Global Search: Filter results by Name, Date of Birth, No RM, or Registration No.

## Feature D: Reporting & Export
Filtering: Select date range (Start Date/Time to End Date/Time).

Data Points: List of registered patients with full personal details.

Export Formats:

Excel: .xlsx download.

PDF: Must include a custom Letterhead (Kop Surat) at the top.

# Implementation Tasks (To-Do)
## Phase 1: Setup & Database
[x] Initialize Next.js project with TypeScript & Tailwind.

[x] Setup Database (PostgreSQL in Docker).

[x] Schema Definition: Define Patient and Registration models.

Note: Include deletedAt field for Soft Delete logic.

[ ] Setup UI Layout (Sidebar, Navbar) mimicking a Dashboard.

## Phase 2: Backend Logic (API Routes)
[x] Create API for Image Upload (Cloudinary multipart upload with MIME+magic+5MB cap).

[x] Create Utility Function: generateSequence(type: 'RM' | 'REG') to handle the YYMMDD + increment logic.

[x] Create CRUD API handlers for Patients (GET, POST, PUT, PATCH, DELETE).

[x] Create CRUD API handlers for Registrations (GET, POST, PUT, PATCH, DELETE).

## Phase 3: Frontend Implementation
[ ] Patient Page:

[ ] Form with Validation (React Hook Form).

[ ] Image Upload Input.

[ ] Table with Soft Delete action (Toggle deletedAt).

[ ] Registration Page:

[ ] Lookup input to select existing Patient (by No RM).

[ ] Auto-fill Registration Number on load.

[ ] Search Feature:

[ ] Implement debounced search bar querying the API.

## Phase 4: Exports
[ ] Excel: Implement xlsx library to dump filtered JSON to Excel.

[ ] PDF: Implement jspdf and jspdf-autotable.

[ ] Design the "Kop Surat" (Letterhead) component.

[ ] Map table data to PDF renderer.

## Phase 5: Finalization
[ ] Export Database SQL dump (as per requirement).

[ ] Commit and Push to Git repository.
