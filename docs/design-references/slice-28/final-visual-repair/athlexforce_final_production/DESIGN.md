---
name: AthlexForce Final Production
colors:
  background: '#050505'
  surface: '#121212'
  surface-bright: '#181818'
  surface-container: '#1A1A1A'
  primary: '#B6FF00'
  secondary: '#CAFF4A'
  on-surface: '#F7F7F7'
  warning: '#FFB020'
  error: '#FF4D4F'
  outline: rgba(247, 247, 247, 0.1)
  outline-variant: rgba(182, 255, 0, 0.4)
  surface-dim: '#101508'
  surface-container-lowest: '#0b1005'
  surface-container-low: '#191d10'
  surface-container-high: '#272c1d'
  surface-container-highest: '#323728'
  on-surface-variant: '#c2caad'
  inverse-surface: '#e0e5cf'
  inverse-on-surface: '#2d3223'
  surface-tint: '#9bd900'
  on-primary: '#243600'
  primary-container: '#b1f800'
  on-primary-container: '#4d6e00'
  inverse-primary: '#486800'
  on-secondary: '#263500'
  secondary-container: '#95c600'
  on-secondary-container: '#394e00'
  tertiary: '#ffffff'
  on-tertiary: '#243141'
  tertiary-container: '#d6e4f8'
  on-tertiary-container: '#586577'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b1f800'
  primary-fixed-dim: '#9bd900'
  on-primary-fixed: '#131f00'
  on-primary-fixed-variant: '#354e00'
  secondary-fixed: '#c0f43f'
  secondary-fixed-dim: '#a5d71f'
  on-secondary-fixed: '#151f00'
  on-secondary-fixed-variant: '#394d00'
  tertiary-fixed: '#d6e4f8'
  tertiary-fixed-dim: '#bac8dc'
  on-tertiary-fixed: '#0f1c2b'
  on-tertiary-fixed-variant: '#3a4858'
  on-background: '#e0e5cf'
  surface-variant: '#323728'
typography:
  font-family: Hanken Grotesk
  base-size: 16px
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  display-metrics:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.04em
layout:
  card-radius: 20px
  control-radius: 8px
  touch-target-min: 44px
  mobile-padding: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-target: 44px
  margin-mobile: 16px
  gutter: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

# AthlexForce Production Design System (v1.0)

## 1. Core Visual Identity
AthlexForce is a premium, iPhone-first athletic coaching platform. The visual language is precise, athletic, and performance-focused.

- **Background**: #050505 (Deepest Black)
- **Primary Surface**: #121212
- **Elevated Surface**: #181818
- **Secondary Surface**: #1A1A1A
- **Primary Accent**: #B6FF00 (Athlex Lime)
- **Secondary Accent**: #CAFF4A
- **Text**: #F7F7F7
- **Warning**: #FFB020
- **Error**: #FF4D4F

## 2. Typography
- **Primary Font**: Hanken Grotesk
- **Character**: Neutral, high-legibility, athletic.

## 3. Motion Principles
- **Rhythm**: Fast response, controlled deceleration.
- **MICRO**: 100–180ms
- **COMPONENT**: 220–380ms
- **STATE**: 400–650ms
- **Easing**:
  - ENTER: power3.out
  - EXIT: power2.in
  - EMPHASIS: expo.out
- **Constraint**: No elastic, bounce, or overshoot.

## 4. Interaction Standards
- **Touch Targets**: 44px minimum for all interactive zones.
- **Neutrality**: Metrics (RPE, Weight, RIR) are descriptive, not judgmental.
- **Truthfulness**: Distinguish between prescribed PLAN and athlete ACTUAL.