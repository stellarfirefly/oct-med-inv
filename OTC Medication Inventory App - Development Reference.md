# OTC Medication Inventory App – Development Reference
Version 1.0.0

Purpose:

This document provides implementation guidance for AI agents and developers. It is not a product specification. If this document conflicts with the Design Specification, the Design Specification takes precedence.

---

# Technology Stack

Preferred stack:

- React
- TypeScript
- Vite
- IndexedDB
- Dexie.js
- PWA support
- Service Worker
- ZXing or Quagga barcode scanning
- jsPDF or pdfmake
- Capacitor (optional future support)

---

# General Principles

- Local-first
- Offline-first
- Strong separation of concerns
- Prefer composition over coupling
- Minimize external dependencies
- Avoid hidden state
- Favor explicit interfaces

---

# Proposed Directory Structure

src/

    app/
        routes/
        layouts/

    components/
        inventory/
        products/
        reports/
        scanner/
        settings/

    pages/

    database/
        schema/
        repositories/

    inventory/

    concepts/

    scanner/
        Scanner.ts
        MockScanner.ts
        BrowserScanner.ts
        NativeScanner.ts

    reporting/

    hooks/

    services/

    utils/

    types/

---

# Scanner Architecture

Scanner implementations must be swappable.

Required interface:

interface Scanner {

    scan(): Promise<string>;

}

Workflow code must never directly reference browser or native APIs.

Allowed:

InventoryFlow
    ↓
Scanner interface
    ↓
Implementation

Not allowed:

InventoryFlow
    ↓
Direct camera access

---

# Development Testing

Mock scanning should exist.

Example:

Mock scan result:

012345678905

Development mode should allow simulated scans without camera access.

---

# IndexedDB Guidance

Use Dexie wrapper around IndexedDB.

Suggested database modules:

database/

    schema/
    repositories/
    migrations/

Keep business logic outside database code.

Repositories should return domain objects.

---

# React Guidance

Prefer:

Functional components

Hooks

Small reusable components

Avoid:

Large components

Deep prop chains

Global mutable state

---

# Suggested State Management

Begin with:

React Context + hooks

Only add larger solutions if needed later.

Possible future:

Zustand

Redux

---

# Barcode Notes

Support:

- UPC-A
- UPC-E
- EAN-13

Scanner should expose normalized UPC output.

---

# PWA Notes

Requirements:

- Installable
- Offline capable
- Service worker enabled

Must function without internet.

---

# Future Native Support

Capacitor may be added later.

Future native modules:

- Scanner
- Notifications
- Filesystem
- Camera

Do not tightly couple app logic to native APIs.

---

# AI Development Notes

AI agents should:

- Preserve scanner abstraction
- Avoid bypassing repositories
- Avoid direct IndexedDB calls from UI
- Preserve inventory concept separation
- Preserve unopened-container model
- Follow Design Specification first