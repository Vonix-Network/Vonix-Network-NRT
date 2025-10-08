# 🎨 Vonix Network - Theme Reference Guide

## Color Palette

### Background Colors

#### Primary Backgrounds
```css
--bg-primary: #0f151b
```
**Deep Charcoal** - Main page background  
Used for: Body background, main containers  
RGB: rgb(15, 21, 27)

```css
--bg-secondary: #151b22
```
**Dark Slate** - Section backgrounds  
Used for: Feature sections, alternating backgrounds  
RGB: rgb(21, 27, 34)

```css
--bg-tertiary: #1a2129
```
**Slate Gray** - Tertiary backgrounds  
Used for: Nested containers, input backgrounds  
RGB: rgb(26, 33, 41)

```css
--bg-card: #242d38
```
**Card Background** - Primary card color  
Used for: Cards, modals, panels  
RGB: rgb(36, 45, 56)

```css
--bg-hover: #2a3441
```
**Hover State** - Interactive hover background  
Used for: Button hovers, card hovers, list items  
RGB: rgb(42, 52, 65)

---

### Accent Colors

#### Gaming Green (Primary)
```css
--accent-primary: #00d97e
```
**Bright Gaming Green** - Main accent color  
Used for: Buttons, links, highlights, logos  
RGB: rgb(0, 217, 126)  
HSL: hsl(155, 100%, 43%)

```css
--accent-secondary: #00b368
```
**Dark Green** - Secondary accent  
Used for: Hover states, darker variants  
RGB: rgb(0, 179, 104)

```css
--accent-tertiary: #008c52
```
**Deep Green** - Tertiary accent  
Used for: Active states, pressed buttons  
RGB: rgb(0, 140, 82)

#### Status Colors
```css
--accent-success: #00d97e
```
**Success Green** - Same as primary  
Used for: Success messages, confirmations

```css
--accent-warning: #f59e0b
```
**Warning Orange**  
Used for: Warnings, caution messages  
RGB: rgb(245, 158, 11)

```css
--accent-error: #ef4444
```
**Error Red**  
Used for: Errors, destructive actions  
RGB: rgb(239, 68, 68)

---

### Text Colors

```css
--text-primary: #ffffff
```
**White** - Primary text color  
Used for: Headlines, body text, important info  
RGB: rgb(255, 255, 255)

```css
--text-secondary: #9ca3af
```
**Light Gray** - Secondary text  
Used for: Descriptions, metadata, labels  
RGB: rgb(156, 163, 175)

```css
--text-tertiary: #6b7280
```
**Medium Gray** - Tertiary text  
Used for: Muted text, timestamps, hints  
RGB: rgb(107, 114, 128)

---

### Border & Effects

```css
--border-color: #2a3441
```
**Border Gray** - Standard border color  
Used for: Borders, dividers, outlines  
RGB: rgb(42, 52, 65)

#### Shadow Effects
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.5)
```

#### Glow Effects
```css
--glow-primary: 0 0 20px rgba(0, 217, 126, 0.3)
```
**Green Glow** - Primary glow effect  
Used for: Button hovers, active states

```css
--glow-secondary: 0 0 20px rgba(0, 217, 126, 0.5)
```
**Intense Green Glow** - Stronger glow  
Used for: Emphasis, special highlights

---

## Tailwind Custom Colors

### Usage in Tailwind Classes

#### Dark Shades
```jsx
// Background colors
<div className="bg-dark-500">    // #0f151b
<div className="bg-dark-400">    // #151b22
<div className="bg-dark-300">    // #1a2129
```

#### Gaming Green
```jsx
// Green accent colors
<div className="bg-gaming-green-500">  // #00d97e
<div className="bg-gaming-green-600">  // #00b368
<div className="bg-gaming-green-700">  // #008c52

// Text colors
<p className="text-gaming-green-500">Green text</p>

// Border colors
<div className="border border-gaming-green-500">
```

#### Minecraft Theme Colors
```jsx
// Direct access
<div className="bg-minecraft-dark-bg">    // #1a2129
<div className="bg-minecraft-card-bg">    // #242d38
<div className="text-minecraft-green">    // #00d97e
<div className="border-minecraft-border"> // #2a3441
```

#### Custom Shadows
```jsx
// Glow effects
<button className="shadow-glow-green">
<div className="shadow-glow-green-lg">
```

---

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 
             'Cantarell', 'Fira Sans', 'Droid Sans', 
             'Helvetica Neue', sans-serif;
```

**Primary Font**: Inter (Google Fonts)  
**Fallbacks**: System fonts for performance  
**Loaded**: Via Google Fonts CDN in index.html

### Font Weights
- **300** - Light (rarely used)
- **400** - Regular (body text)
- **500** - Medium (labels, nav items)
- **600** - Semi-bold (card titles)
- **700** - Bold (section headers)
- **800** - Extra-bold (page titles)
- **900** - Black (hero titles, emphasis)

### Typography Scale
```css
/* Headlines */
.hero-title: 4rem (64px)
.page-title: 2.5rem (40px)
.section-title: 2.5rem (40px)

/* Body */
.hero-subtitle: 1.5rem (24px)
.body-large: 1.2rem (19.2px)
.body-regular: 1rem (16px)
.body-small: 0.875rem (14px)

/* UI */
.button-text: 1rem (16px)
.label-text: 0.875rem (14px)
.caption-text: 0.75rem (12px)
```

---

## Component Styling Examples

### Button Styles

#### Primary Button (Green)
```css
background: var(--accent-primary);
color: white;
padding: 0.75rem 1.5rem;
border-radius: 8px;
font-weight: 600;
transition: all 0.2s ease;

/* Hover */
background: var(--accent-secondary);
transform: translateY(-2px);
box-shadow: var(--glow-primary);
```

#### Secondary Button
```css
background: var(--bg-tertiary);
color: var(--text-primary);
border: 1px solid var(--border-color);

/* Hover */
background: var(--bg-hover);
border-color: var(--accent-primary);
```

### Card Styles
```css
background: var(--bg-card);
border: 1px solid var(--border-color);
border-radius: 12px;
padding: 1.5rem;
transition: all 0.3s ease;

/* Hover */
border-color: var(--accent-primary);
box-shadow: var(--glow-primary);
```

### Navigation Links
```css
color: var(--text-secondary);
font-weight: 500;
position: relative;

/* Underline */
&::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent-primary);
  box-shadow: 0 0 8px var(--accent-primary);
  transition: width 0.3s ease;
}

/* Active/Hover */
color: var(--text-primary);
&::after {
  width: 100%;
}
```

---

## Animations

### Keyframe Animations
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Tailwind Animations
```jsx
<div className="animate-slide-up">
<div className="animate-fade-in">
<div className="animate-pulse">
```

---

## Responsive Breakpoints

### Tailwind Breakpoints
```css
/* Mobile First */
Default: 0px+          /* Mobile */
sm: 640px+             /* Small tablets */
md: 768px+             /* Tablets */
lg: 1024px+            /* Laptops */
xl: 1280px+            /* Desktops */
2xl: 1536px+           /* Large desktops */
```

### Custom Breakpoints in CSS
```css
@media (max-width: 768px) {
  /* Mobile styles */
}

@media (max-width: 1024px) {
  /* Tablet styles */
}
```

---

## Best Practices

### Color Usage Guidelines

1. **Backgrounds**: Use dark shades (#0f151b to #2a3441)
2. **Accents**: Use green (#00d97e) sparingly for emphasis
3. **Text**: White for primary, gray for secondary
4. **Borders**: Subtle gray (#2a3441) for definition
5. **Hover**: Add glow effects with green

### Contrast Ratios
- **Text on Dark BG**: >7:1 (AAA)
- **Green on Dark BG**: >4.5:1 (AA)
- **Gray Text**: >4.5:1 (AA)

### Spacing Scale
```css
0.25rem  /* 4px  - tiny gaps */
0.5rem   /* 8px  - small gaps */
0.75rem  /* 12px - medium gaps */
1rem     /* 16px - regular gaps */
1.5rem   /* 24px - large gaps */
2rem     /* 32px - section gaps */
3rem     /* 48px - major gaps */
4rem     /* 64px - hero gaps */
```

---

## Quick Reference

### Most Used Colors
```css
Background: #0f151b
Card: #242d38
Green: #00d97e
Text: #ffffff
Gray: #9ca3af
Border: #2a3441
```

### Most Used Classes
```jsx
// Backgrounds
className="bg-dark-500"
className="bg-minecraft-card-bg"

// Text
className="text-white"
className="text-gaming-green-500"
className="text-gray-400"

// Buttons
className="btn btn-primary"
className="bg-gaming-green-500 hover:shadow-glow-green"

// Cards
className="bg-dark-300 border border-dark-50 rounded-xl p-6"
```

---

**This reference guide is your go-to resource for maintaining consistent styling across the Vonix Network platform. 🎨**
