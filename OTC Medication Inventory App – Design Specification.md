# OTC Medication Inventory App – Design Specification
Version 1.2.0

## 1. Overview

### Purpose
A local-first medication inventory Progressive Web App (PWA) designed to track OTC medication inventory in a small healthcare setting, with emphasis on:

- Expiration tracking (critical compliance requirement)
- Accurate stock measurement across different forms
- Fast data entry (barcode scanning + minimal typing)
- Clear reordering signals
- Printable audit-ready reporting

---

### Design Philosophy

- Local-first (no required internet)
- Fast and frictionless
- Audit-friendly
- Error-resistant

---

## 2. Core Concepts

### 2.1 Product vs Inventory

#### Product (Static Definition)

A specific packaged item identified by UPC.

#### Inventory Entry (Dynamic State)

Represents stock tied to an expiration batch.

---

### 2.2 Inventory Concept vs Product

#### Inventory Concept

Represents the interchangeable medication the facility manages.

Examples:

- Vitamin C 500 mg tablet
- Ibuprofen 200 mg tablet
- Acetaminophen 160 mg / 5 mL liquid

Used for:

- Low stock detection
- Reordering decisions
- Reporting
- Dashboard grouping

#### Product

A specific branded/package version of a concept.

Examples:

- Nature Made Vitamin C 500 mg, 100 count
- Kirkland Vitamin C 500 mg, 500 count

Multiple products may map to one Inventory Concept.

---

### 2.3 Unopened Container Tracking Model

#### Core Rule

Only unopened containers are tracked.

- Each entry represents unopened containers
- Opened containers are excluded

#### Behavior

Inventory stored as container count

Total quantity derived from:

container_count × package_quantity

#### Rationale

- Eliminates estimation errors
- Improves audit clarity
- Simplifies data entry

---

### 2.4 Expiration Batch Model

#### Definition

A group of identical unopened containers sharing the same expiration date.

Each batch = one inventory entry.

#### Characteristics

- Same product
- Same expiration date
- Unopened containers only

#### Behavior

- Batches tracked separately
- FIFO encouraged
- Batch-level expiration status

---

## 3. Data Model

[unchanged sections omitted for brevity]

---

## 5. Core Features

[existing sections unchanged]

---

## 8. Architecture

- Progressive Web App (PWA)
- IndexedDB local database
- Service worker for offline use
- Browser camera access via getUserMedia
- UPC scanning via JavaScript/WASM barcode library
- PDF and CSV generation in browser
- Optional native Android wrapper later via Capacitor

### Scanner Abstraction Layer

Barcode scanning is implemented through a swappable scanner interface.

Purpose:

- Allow browser camera scanning for PWA operation
- Allow mock scanning during development/testing
- Allow optional native scanner integration later through Capacitor
- Prevent inventory workflow logic from depending on scanner implementation details

Scanner implementations may include:

- Mock scanner
- Browser barcode scanner
- Capacitor/native scanner

All scanner implementations expose a common interface:

scan() → UPC string

Inventory and workflow systems interact only with this abstraction layer.

### Development Structure Guidance

Implementation should maintain separation of concerns:

- UI
- Database
- Barcode scanning
- Reporting
- Inventory logic
- Settings

Exact folder structure is implementation-defined and may evolve.

---

## 9. Offline Capability

- Fully offline
- No external dependency required

---

## 10. Future Enhancements

- OCR expiration scanning
- Notifications
- Multi-location support

---

## 11. Non-Goals

- No prescription tracking
- No lot tracking
- No cloud dependency

---

## 12. MVP Scope

- Product tracking
- Barcode scanning
- Expiration tracking
- Concept-level inventory
- Reports

---

## 13. Success Criteria

- Add item <10 seconds
- No ambiguous inventory
- Clear reorder signals
- Audit-ready output
- Fully offline