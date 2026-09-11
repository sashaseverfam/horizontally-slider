# Horizontally Slider

Angular standalone component for horizontal scrolling with arrow navigation, mouse drag, wheel and touch support.

## Installation

```bash
npm install @severfam/horizontally-slider
```

## Peer Dependencies

- `@angular/common ^21.2.0`
- `@angular/core ^21.2.0`

## Usage

```typescript
import { HorizontallySliderComponent } from '@severfam/horizontally-slider';

@Component({
  selector: 'app-root',
  imports: [HorizontallySliderComponent],
  template: `
    <lib-horizontally-slider [showAlwaysArrows]="true">
      <div left-arrow class="arrow arrow--left">
        <svg>...</svg>
      </div>

      <div slider class="track">
        @for (item of items; track item) {
          <div class="item">{{ item.name }}</div>
        }
      </div>

      <div right-arrow class="arrow arrow--right">
        <svg>...</svg>
      </div>
    </lib-horizontally-slider>
  `,
})
export class App {}
```

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `dragStep` | `number` | `5` | Scroll step (px) on wheel event |
| `clickStep` | `number` | `100` | Scroll step (px) on arrow click |
| `wheelStep` | `number` | `100` | Scroll step (px) on wheel |
| `showAlwaysArrows` | `boolean` | `false` | Always show arrows regardless of scroll position |
| `showArrowsOnMobile` | `boolean` | `false` | Show arrows on touch devices (<=740px) |
| `noGap` | `boolean` | `false` | Remove gap between items |
| `scrollRefresh$` | `Subject<void>` | `new Subject()` | Emit to recalculate arrow visibility |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| `selectedChange` | `number` | Emits index of clicked item |

## Content Projection

The component uses `ng-content` with attribute selectors for three projection slots:

| Attribute | Description |
|-----------|-------------|
| `[left-arrow]` | Left arrow content |
| `[slider]` | Main scrollable content |
| `[right-arrow]` | Right arrow content |

Each slot is a required `div` with the corresponding attribute:

```html
<div left-arrow>...</div>
<div slider>...</div>
<div right-arrow>...</div>
```

## CSS Classes (BEM)

### Block

`.horizontally-slider__track` — scrollable container with hidden scrollbar

### Modifiers

| Class | Description |
|-------|-------------|
| `.horizontally-slider__track--no-gap` | Remove gap between items |

### Arrows

| Class | Description |
|-------|-------------|
| `.horizontally-slider__arrow` | Arrow wrapper (hidden by default) |
| `.horizontally-slider__arrow--left` | Left arrow position |
| `.horizontally-slider__arrow--right` | Right arrow position |
| `.horizontally-slider__arrow--visible` | Show arrow (applied automatically) |

### Default Styles

```scss
:host {
  width: 100%;
  position: relative;
  display: block;
}

.horizontally-slider__track {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    display: none;
  }
}

.horizontally-slider__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  display: none;
  align-items: center;
  justify-content: center;

  &--visible {
    display: flex;
  }

  &--left { left: 0; }
  &--right { right: 0; }
}
```

## Interface

```typescript
interface SliderPhoto {
  url: string | SafeResourceUrl;
  name: string;
  alt: string;
  disabled?: boolean;
}
```

## Features

- Standalone component (no module required)
- Mouse drag scrolling (1:1 ratio)
- Arrow key / click / long-touch navigation
- Wheel scrolling
- Touch device support
- Safari-compatible scroll handling
- Automatic arrow visibility based on scroll position
- Window resize reactive
- `ChangeDetectionStrategy.OnPush` with Angular signals

## License

MIT
