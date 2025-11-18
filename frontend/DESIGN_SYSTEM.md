# APP23 Financial Dashboard - Design System

## Overview
This design system ensures visual consistency, accessibility, and maintainability across the APP23 Financial Dashboard application.

---

## 1. Color System

### Primary Colors
```javascript
// Defined in: frontend/src/config/chartTheme.js
primary: '#2C5F7F'      // Navy - Primary brand (Tailwind primary-500)
success: '#2D7A5C'      // Sage Green - Profit/Success (Tailwind success-500)
danger: '#C44536'       // Warm Red - Loss/Danger (Tailwind danger-500)
```

### Chart Colors
```javascript
// Financial Metrics
income: '#3b82f6'       // Blue - Revenue/Income
expenses: '#ef4444'     // Red - Expenses
profit: '#2D7A5C'       // Sage Green - Profit/NOI
cogs: '#f59e0b'         // Amber - COGS

// Margins
grossMargin: '#2D7A5C'  // Sage Green (matches profit)
netMargin: '#8b5cf6'    // Purple
```

### Comparison Colors (Multi-Series)
10 distinct, WCAG AAA compliant colors for clinic comparisons:
```javascript
['#2C5F7F', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
 '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']
```

### Usage Rules
- **Profit/Success:** Always use `#2D7A5C` (Tailwind `success-*` classes)
- **Loss/Danger:** Always use `#C44536` (Tailwind `danger-*` classes)
- **Income/Revenue:** Use `#3b82f6` (blue)
- **Expenses:** Use `#ef4444` (red)

---

## 2. Typography

### Text Colors
```css
/* Primary text */
text-gray-900           /* Headings, body text */

/* Secondary text */
text-gray-600           /* Supporting text, labels */

/* Muted text */
text-gray-500           /* Placeholder, disabled states */

/* Financial indicators */
text-danger-600         /* Negative values, losses */
text-success-600        /* Positive growth, gains */
```

### ⚠️ Deprecated
```css
/* DO NOT USE - Use text-gray-* instead */
text-stone-*
border-stone-*
```

### Headings
```jsx
// Page titles (handled by AppLayout)
<h1 className="text-3xl font-bold text-gray-900">

// Section/Card titles
<h3 className="text-lg font-semibold text-gray-900 mb-4">

// Subsections
<h4 className="text-base font-semibold text-gray-900 mb-3">
```

### Font Weights
- Page titles: `font-bold`
- Section headers: `font-semibold`
- Buttons/labels: `font-medium`
- Body text: `font-normal` (default)

---

## 3. Spacing

### Vertical Stacking
```jsx
// Main page content
<div className="space-y-4">

// Card internal spacing
<div className="p-6">        // Large cards
<div className="p-4">        // Compact cards

// Section spacing below headings
className="mb-4"             // Standard heading spacing
className="mb-6"             // Large section breaks
```

### Grid Gaps
```jsx
// Feature grids (KPI cards, major components)
<div className="grid gap-6">

// Utility grids (filters, small cards)
<div className="grid gap-4">
```

---

## 4. Components

### Buttons
Use the shared `Button` component:

```jsx
import Button from '../components/shared/Button';

// Variants
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="success">Export</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">More Options</Button>

// Sizes
<Button size="md">Default</Button>
<Button size="sm">Compact</Button>
```

**Standard Styling:**
```css
.btn-primary    bg-primary-600 hover:bg-primary-700
.btn-secondary  bg-gray-100 hover:bg-gray-200
.btn-success    bg-success-600 hover:bg-success-700
```

### Cards
```jsx
// Standard card
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

// Compact card
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
```

**Shadows:**
- Cards at rest: `shadow-sm`
- Cards on hover: `hover:shadow-md`
- Elevated elements (tooltips, dropdowns): `shadow-lg`

**Border Radius:**
- Cards: `rounded-lg`
- Small UI elements: `rounded-md`
- Tooltips/popovers: `rounded-lg`

### Tooltips
Use the shared `CustomTooltip` component:

```jsx
import CustomTooltip from '../components/shared/CustomTooltip';

// In charts
<Tooltip content={<CustomTooltip />} />

// With custom formatter
<Tooltip content={<CustomTooltip formatter={percentFormatter} />} />
```

---

## 5. Charts (Recharts)

### Standard Configuration
**Always import and use:**
```javascript
import { CHART_COLORS, CHART_CONFIG } from '../../config/chartTheme';
import CustomTooltip from '../shared/CustomTooltip';
```

### Chart Elements
```jsx
// Grid
<CartesianGrid {...CHART_CONFIG.grid} />

// Axes
<XAxis {...CHART_CONFIG.axis} />
<YAxis tickFormatter={formatAxisValue} {...CHART_CONFIG.axis} />

// Tooltip
<Tooltip content={<CustomTooltip />} />

// Legend
<Legend {...CHART_CONFIG.legend} />

// Animations (ALL chart elements)
animationDuration={CHART_CONFIG.animation.duration}  // 300ms
```

### Accessibility
**Every chart MUST have:**
```jsx
<div role="img" aria-label="descriptive chart label">
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} aria-hidden="true">
      {/* chart content */}
    </BarChart>
  </ResponsiveContainer>
</div>
```

**ARIA Label Format:**
```javascript
// Example
aria-label="stacked bar chart showing monthly performance across 12 months"
aria-label="line chart showing profit margin trends over 24 months"
aria-label="pie chart showing expense breakdown across 6 categories"
```

---

## 6. Data Formatting

### Currency
```javascript
import { formatCurrency, formatCurrencyAccounting } from '../utils/dataTransformers';

// Standard formatting
formatCurrency(12345)  // → "$12,345"

// Accounting format (for financial tables)
formatCurrencyAccounting(12345)   // → "$12,345"
formatCurrencyAccounting(-12345)  // → "($12,345)"
```

### Negative Values
**Tables - Accounting Format:**
```jsx
<td className={value < 0 ? 'text-danger-600 font-semibold' : 'text-gray-900'}>
  {formatCurrencyAccounting(value)}
</td>
```

**Charts - Conditional Coloring:**
```jsx
{data.map((entry, index) => {
  const cellColor = entry.value < 0 ? CHART_COLORS.danger : color;
  return <Cell key={index} fill={cellColor} />;
})}
```

### Percentages
```javascript
import { formatPercent } from '../utils/dataTransformers';

formatPercent(45.7)  // → "45.7%"
```

---

## 7. Tables

### Standard Table
```jsx
<table className="w-full border-collapse text-sm">
  <thead className="sticky top-0 z-20">
    <tr className="bg-gray-50">
      <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b-2 border-gray-300">
        Header
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 border-b border-gray-200">
        Data
      </td>
    </tr>
  </tbody>
</table>
```

### Compact Table
```jsx
<table className="w-full border-collapse text-xs">
  <thead className="sticky top-0 z-20">
    <tr className="bg-gray-100">
      <th className="px-2 py-1 text-left font-semibold text-gray-900 border-b-2 border-gray-400">
        Header
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="px-2 py-0.5 border-b border-gray-300">
        Data
      </td>
    </tr>
  </tbody>
</table>
```

### Sticky Headers (z-index layering)
```css
z-10    /* Sticky first column */
z-20    /* Sticky header row */
z-30    /* Sticky header + first column intersection */
```

---

## 8. Form Elements

### Input Fields
```jsx
<input
  className="w-full px-3 py-2 border border-gray-300 rounded-md
             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
/>

<select
  className="w-full px-3 py-2 border border-gray-300 rounded-md
             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
/>
```

**Border Radius:** Always use `rounded-md` for inputs

---

## 9. Icons

### Sizing
```jsx
// Inline button icons
<Download className="w-4 h-4" />

// Feature/KPI card icons
<DollarSign className="w-5 h-5" />

// Large feature icons
<TrendingUp className="w-6 h-6" />
```

---

## 10. Animation & Transitions

### Standard Durations
```css
/* Charts */
animationDuration={300}

/* Buttons, hover states */
transition-colors
transition-all duration-150
```

---

## 11. Responsive Breakpoints

### Grid Patterns
```jsx
// Mobile → Tablet → Desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Standard pattern:
// 1 column: mobile (default)
// 2 columns: md: (768px+) tablets
// 3+ columns: lg: (1024px+) desktop
```

---

## 12. Accessibility Standards

### Required for All Interactive Elements
- Focus states: `focus:outline-none focus:ring-2 focus:ring-primary-500`
- Disabled states: `disabled:opacity-50 disabled:cursor-not-allowed`
- ARIA labels for charts and complex UI
- Semantic HTML (button, nav, main, etc.)

### Color Contrast
- All text meets WCAG AA standards
- All chart colors meet WCAG AAA standards (verified in COMPARISON_COLORS)

---

## 13. File Structure

```
frontend/src/
├── components/
│   ├── shared/           # Reusable components
│   │   ├── Button.jsx
│   │   ├── CustomTooltip.jsx
│   │   └── ChartCard.jsx
│   ├── charts/           # Chart components
│   │   ├── FlexibleTrendChart.jsx
│   │   ├── FlexibleComparisonChart.jsx
│   │   └── ChartControls.jsx
│   └── ...
├── config/
│   ├── chartTheme.js     # ALL chart configuration
│   └── lineItems.js
├── utils/
│   └── dataTransformers.js  # ALL formatting utilities
└── ...
```

---

## 14. Quick Reference Checklist

When creating/updating components:

- [ ] Use `CHART_COLORS` from chartTheme.js (not hardcoded colors)
- [ ] Use `CHART_CONFIG` for grid, axes, tooltips, legends
- [ ] Add ARIA labels to all charts
- [ ] Use `CustomTooltip` component (not custom tooltips)
- [ ] Use `formatCurrencyAccounting()` for financial tables
- [ ] Use `text-gray-*` (not `text-stone-*`)
- [ ] Add `animationDuration={CHART_CONFIG.animation.duration}`
- [ ] Use shared `Button` component with variants
- [ ] Follow spacing standards (p-6 for cards, gap-4 for grids)
- [ ] Add focus states to all interactive elements
- [ ] Test color contrast for accessibility

---

## Version
**Last Updated:** November 2025
**Status:** Active - All standards enforced across application
