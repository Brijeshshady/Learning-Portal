---
name: Monolith EdTech
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#c8c5cd'
  on-secondary: '#303036'
  secondary-container: '#49484e'
  on-secondary-container: '#bab7be'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e4e1e9'
  secondary-fixed-dim: '#c8c5cd'
  on-secondary-fixed: '#1b1b20'
  on-secondary-fixed-variant: '#47464c'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  h1:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h3:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  stats:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is engineered for deep focus and academic rigor. It merges the structural clarity of **Minimalism** with the premium depth of **Glassmorphism**. Drawing inspiration from industry leaders like Linear and Stripe, the aesthetic is "Utility-Luxury"—where every pixel serves a functional purpose but is executed with high-end craftsmanship.

The system targets adult learners and professional educators who value efficiency over ornamentation. The emotional response is one of calm, organized control. UI elements are reduced to their essential forms, utilizing thin lines and subtle translucency to manage information density without overwhelming the user.

## Colors

This design system utilizes a "Deep Space" palette to minimize eye strain and maximize the vibrancy of the Electric Blue accent. 

- **Primary Background:** #0A0A0F serves as the foundation, providing a void-like depth that makes content pop.
- **Accents:** Electric Blue (#3B82F6) is reserved for primary actions and active progress states.
- **Semantic Logic:** 
    - **Active:** Blue indicates current focus.
    - **Theory:** Yellow signals conceptual or preparatory content.
    - **Completed:** Green provides a clear reward for progress.
    - **Locked:** Low-contrast Grey denotes restricted or upcoming paths.
- **Surfaces:** Utilize varying levels of opacity over the background rather than solid lighter grays to maintain the "Glass" effect.

## Typography

The typography strategy leverages **Space Grotesk** for technical, high-impact headings and **Inter** for sustained reading and interface labels. 

Headings use tighter letter spacing and aggressive line heights to create a structured, "engineered" look. Body text prioritizes legibility with a generous 1.6x line height. Labels and small metadata utilize Inter's geometric clarity, often in uppercase with slight tracking to differentiate UI controls from instructional content.

## Layout & Spacing

This design system uses a **Fixed-Fluid Hybrid Grid**. The main dashboard container is capped at 1440px to ensure line lengths remain readable, centered within the viewport. 

- **Grid:** A 12-column system with 24px gutters.
- **Rhythm:** An 8px linear scale (using a 4px base unit) governs all padding and margins to maintain mathematical harmony. 
- **Density:** High whitespace is prioritized in "Study Mode" views, while "Dashboard" views utilize tighter spacing (8-16px) for high-information density.

## Elevation & Depth

Depth is created through **Glassmorphism** and luminosity rather than traditional drop shadows.

- **Level 0 (Base):** Deep Navy (#0A0A0F).
- **Level 1 (Cards):** Semi-transparent white overlay (2-4% opacity) with a 20px backdrop blur.
- **Level 2 (Popovers/Modals):** Semi-transparent white (8% opacity) with 40px backdrop blur.
- **Borders:** "Ghost Borders" are essential. Instead of shadows, use 1px solid strokes with 10% white opacity to define edges.
- **Shadows:** Only used on active components, utilizing a very soft, diffused Electric Blue glow (`0 8px 32px rgba(59, 130, 246, 0.15)`).

## Shapes

The shape language is sophisticated and approachable. All primary containers (Cards, Modals) use a **16px (1rem)** corner radius. Smaller components like buttons or input fields use **8px (0.5rem)** to maintain a cohesive nested relationship (the 2:1 ratio). Progress bars and status tags utilize a pill-shape (full rounding) to contrast against the structured grid of the cards.

## Components

- **Glass Cards:** The primary container. Must have a 1px border (#FFFFFF at 10% opacity) and a backdrop-filter: blur(20px). No background images; strictly the blurred navy base.
- **Buttons:** 
    - *Primary:* Solid Electric Blue with white text. No gradient.
    - *Secondary:* Ghost style with 1px border and subtle hover fill (5% white).
- **Progress Trackers:** Thin (4px) horizontal lines. The "filled" portion uses a glow effect to indicate luminosity and energy.
- **Dividers:** Extremely subtle. 1px height, solid, #FFFFFF at 5% opacity.
- **Status Chips:** Small, pill-shaped tags with a 10% background tint of the status color and a 100% opacity dot indicator.
- **Inputs:** Darker than the base background (#050507) with a 1px border that illuminates to Electric Blue on focus.
- **Course Timeline:** A vertical 2px line (Grey) with nodes that change color/glow based on the status (Theory, Active, Completed).