# UI Wireframe Plan (Neo‑Brutalist, Low‑Distraction)

## Goals
- Build a **wireframe-first** UI that maps directly to the backend API.
- Keep visuals minimal (grayscale, bold borders), prioritize **clarity and function**.
- Support **budgeting + efficiency** comparisons without subjective language.
- Use **Font Awesome** icons where needed for affordances.

## Design Principles (Neo‑Brutalist)
- High-contrast black/white, sparse accent color only for status.
- Thick borders, rectangular blocks, visible grid and spacing rhythm.
- Large labels, small subtext; no gradients or decorative elements.
- Information density > aesthetic; every panel has a purpose.

## Information Architecture (Wireframe)
1) **Workload Inputs**
   - Budget vs Tokens toggle
   - Currency selector
   - Tokens input (in/out or ratio) or Budget input
2) **Scenario Selection**
   - Provider + model
   - Tool plan selection (optional)
   - Region selector
3) **Results**
   - Token‑meter baseline
   - Plan price floor
   - Plan‑effective estimates (if computable)
   - Confidence + warnings
4) **Plan Matrix**
   - Plans that fit budget
   - Coverage (providers/models/modalities)
   - Evidence status
5) **Assumptions & Evidence**
   - Assumptions list
   - Source IDs + verification status

## Minimal Component Inventory
- Inputs: `Select`, `TextInput`, `NumberInput`, `Toggle`, `Slider`
- Actions: `Button`, `SecondaryButton`, `Reset`
- Layout: `Panel`, `Fieldset`, `Grid`, `Divider`
- Data: `Table`, `Badge` (confidence), `Alert` (warnings)
- Iconography: Font Awesome only where it adds clarity

## API Binding (No UI Logic)
- `GET /api/catalog` → inputs/options
- `POST /api/calculate` → scenario results
- `POST /api/plan-matrix` → budgeting + bundles
- `GET /api/datasets/*` → raw data inspection (optional debug panel)

## Framework Evaluation Criteria
- **Completeness:** component coverage for forms, tables, layout
- **Next.js fit:** App Router guidance, SSR compatibility
- **Simplicity:** low config, minimal boilerplate
- **Styling control:** easy to enforce neo‑brutalist look

## Shortlist (Initial)
- **Primary candidate:** shadcn/ui + Tailwind + Radix (max control, minimal styling overhead)
- **Alternate:** Mantine (complete components, fast setup)
- **Backup:** Chakra UI (complete, but more opinionated)
- **Avoid for now:** HeroUI v2 (deprecated) until v3 web guidance is stable

## Next Decisions
1) Choose framework: shadcn/ui vs Mantine (speed vs control)
2) Confirm icon pipeline (Font Awesome Pro kit vs package install)
3) Approve wireframe layout → implement UI skeleton
