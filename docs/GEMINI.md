# Docs Directory Guide

**Purpose:** Feature Requirement Documents (FRDs) for MBudget.

## FRD Numbering

| Range | Priority      | Purpose                                  |
| ----- | ------------- | ---------------------------------------- |
| 00    | Index         | 00-INDEX.md (master navigation)          |
| 01-08 | P0 (Critical) | Core features needed for prototype       |
| 09    | P1            | API specification (reserved for Phase 2) |
| 10    | P1            | Prototype specifications (always FRD-10) |
| 11-19 | P1            | Production features (DB schema, etc.)    |
| 20+   | P2            | Advanced/future features                 |

## Rules

- Every FRD follows the standard template (see root GEMINI.md)
- FRD-01 is ALWAYS core data models
- FRD-10 is ALWAYS prototype specifications
- FRD-09 is RESERVED for API specification
- Update 00-INDEX.md whenever a new FRD is added
