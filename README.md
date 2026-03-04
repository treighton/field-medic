# Field Medic Prototype (Client-only React + TypeScript)

Generates a **JSON Scenario Packet** (solo mode) for WFR/EMT-style practice:
- Dice-table scenario generation
- MOI-influenced number of hidden injuries
- Precomputed wilderness vitals timeline (0/10/20/30 min)
- Expected actions (Gold Path)
- Escalation triggers
- End states
- Print-friendly HTML rendering + Export JSON

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Notes

- No persistence, no auth, no backend
- This is a training simulator; it is not medical advice
