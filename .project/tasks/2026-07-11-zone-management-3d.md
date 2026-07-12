# 2026-07-11 — Zone Management UI with 3D Seating Visualization

## Prompt

"design zone management UI more better present some seating visualization with 3d views"

## What Was Done

Redesigned the entire zone management UI with a CSS-powered isometric 3D floor
plan visualization.

### Architecture

```
modules/zones/
  components/
    FloorPlanView.tsx   # Isometric 3D floor plan with perspective grid,
                        # stats bar, rotation control, seat selection
    SeatBlock.tsx       # 3D-ish isometric seat block with:
                        #   - Top face (isometric transform)
                        #   - Side faces (skew transforms)
                        #   - Status color coding (emerald/amber/red)
                        #   - Floor shadow with glow
                        #   - Hover lift effect
                        #   - Selected state with ring + scale
    ZoneHeader.tsx      # Zone detail header with back nav + seat count
    SeatForm.tsx        # Add/edit seat form (extracted from page)
  pages/
    ZoneListPage.tsx    # Enhanced with visual gradient zone cards
    ZoneSeatsPage.tsx   # Split layout: 3D floor plan + seat list panel
```

### 3D Visualization Details

- **Perspective**: CSS `perspective(800px) rotateX(55deg)` for isometric view
- **Grid floor**: Linear gradient stripes with perspective transform
- **Seat blocks**: Three CSS faces (top = `rotateX(55deg) rotateZ(45deg)`,
  right = `skewY(35deg)`, left = `skewX(35deg)`) with rounded corners
- **Rotation**: Button to rotate the entire scene 90° at a time
- **Status dots**: Pulsing amber for booked, solid green/red for available/occupied
- **Stats bar**: Live count of free/booked/occupied/total seats

### Files Changed

- `modules/zones/components/FloorPlanView.tsx` — created
- `modules/zones/components/SeatBlock.tsx` — created
- `modules/zones/components/ZoneHeader.tsx` — created
- `modules/zones/components/SeatForm.tsx` — created
- `modules/zones/pages/ZoneSeatsPage.tsx` — rewritten
- `modules/zones/pages/ZoneListPage.tsx` — rewritten
