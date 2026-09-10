import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WINDOW_PROVIDERS, WINDOW_SIZE } from './providers/window.providers';
import {
  debounceTime,
  fromEvent,
  Observable,
  pairwise,
  startWith,
  switchMap,
  takeUntil,
  withLatestFrom,
  tap,
  distinctUntilChanged,
  interval,
  combineLatest,
  of,
  delay,
  filter,
  Subject,
} from 'rxjs';
import { isSafari, isTouchDevice } from './utils/device.utils';
import { ArrowAction } from './enums/slider.enums';

const LONG_CLICK_DELAY = 200;

@Component({
  selector: 'lib-horizontally-slider',
  imports: [],
  templateUrl: './horizontally-slider.component.html',
  styleUrls: ['./horizontally-slider.component.scss'],
  providers: [WINDOW_PROVIDERS],
})
export class HorizontallySliderComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly windowSize$ = inject(WINDOW_SIZE);

  readonly dragStep = input(5);
  readonly clickStep = input(100);
  readonly wheelStep = input(100);
  readonly showAlwaysArrows = input(false);
  readonly showArrowsOnMobile = input(false);
  readonly noGap = input(false);
  readonly scrollRefresh$ = input<Subject<void>>(new Subject());

  readonly trackElement = viewChild<ElementRef<HTMLDivElement>>('track');
  readonly leftArrowElement = viewChild<ElementRef<HTMLDivElement>>('leftArrow');
  readonly rightArrowElement = viewChild<ElementRef<HTMLDivElement>>('rightArrow');

  readonly isLeftArrowVisible = signal(false);
  readonly isRightArrowVisible = signal(false);

  private isTouchDevice = false;
  private isSafari = false;

  readonly leftArrowVisible = computed(() =>
    this.showAlwaysArrows()
      ? this.isLeftArrowVisible()
      : this.isLeftArrowVisible() && !this.isTouchDevice,
  );

  readonly rightArrowVisible = computed(() =>
    this.showAlwaysArrows()
      ? this.isRightArrowVisible()
      : this.isRightArrowVisible() && !this.isTouchDevice,
  );

  readonly selectedChange = output<number>();

  constructor() {
    afterNextRender(() => {
      this.isTouchDevice = isTouchDevice();
      this.isSafari = isSafari();

      const track = this.trackElement();
      if (track) {
        this.initWheelHandler(track);
        this.initDragHandler(track);
        this.initArrowHandler(track);
        this.initResizeHandler(track);
        this.initTouchHandler(track);
        this.initScrollEndHandler(track);
      }
    });
  }

  private initWheelHandler(elementRef: ElementRef) {
    fromEvent<WheelEvent>(elementRef.nativeElement, 'wheel')
      .pipe(
        filter(() => this.isTouchDevice),
        tap((event) => {
          event.preventDefault();
          this.scrollByDelta(elementRef, event.deltaY, 0);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private initDragHandler(elementRef: ElementRef) {
    const mouseDown$ = fromEvent<MouseEvent>(elementRef.nativeElement, 'mousedown');
    const mouseUp$ = fromEvent<MouseEvent>(elementRef.nativeElement, 'mouseup');
    const mouseMove$ = fromEvent<MouseEvent>(elementRef.nativeElement, 'mousemove');
    const mouseLeave$ = fromEvent<MouseEvent>(elementRef.nativeElement, 'mouseleave');

    mouseDown$
      .pipe(
        switchMap((downEvent) => {
          downEvent.preventDefault();
          return mouseMove$.pipe(
            pairwise(),
            tap(([current, prev]) => {
              this.scrollByDelta(elementRef, prev.clientX, current.clientX);
            }),
            debounceTime(100),
            tap(() => this.updateArrowsVisibility(elementRef)),
            takeUntil(mouseUp$),
            takeUntil(mouseLeave$),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private initArrowHandler(elementRef: ElementRef) {
    const left = this.leftArrowElement();
    const right = this.rightArrowElement();

    if (left) {
      this.initClickHandler(elementRef, left, ArrowAction.PREV);
      this.initTouchArrowHandler(elementRef, left, ArrowAction.PREV);
    }
    if (right) {
      this.initClickHandler(elementRef, right, ArrowAction.NEXT);
      this.initTouchArrowHandler(elementRef, right, ArrowAction.NEXT);
    }
  }

  private initClickHandler(
    elementRef: ElementRef,
    arrowElement: ElementRef,
    action: ArrowAction,
  ) {
    fromEvent<MouseEvent>(arrowElement.nativeElement, 'click')
      .pipe(
        tap((event) => {
          event.stopPropagation();
          this.handleArrowAction(elementRef, action);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private initTouchArrowHandler(
    elementRef: ElementRef,
    arrowElement: ElementRef,
    action: ArrowAction,
  ) {
    const touchStart$ = fromEvent<TouchEvent>(arrowElement.nativeElement, 'touchstart');
    const touchEnd$ = fromEvent<TouchEvent>(arrowElement.nativeElement, 'touchend');

    const longTouch$ = touchStart$.pipe(
      switchMap((event) => of(event).pipe(delay(LONG_CLICK_DELAY), takeUntil(touchEnd$))),
    );

    longTouch$
      .pipe(
        switchMap((event) => {
          event.stopPropagation();
          return interval(1000).pipe(takeUntil(touchEnd$));
        }),
        tap(() => this.handleArrowAction(elementRef, action)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private handleArrowAction(elementRef: ElementRef, action: ArrowAction) {
    const step = this.clickStep();

    if (action === ArrowAction.PREV) {
      this.scrollLeft(elementRef, step);
    } else {
      this.scrollRight(elementRef, step);
    }
    if (this.isSafari) {
      this.updateArrowsVisibility(elementRef);
    }
  }

  private initResizeHandler(elementRef: ElementRef) {
    combineLatest([this.windowSize$, this.scrollRefresh$().pipe(startWith(null))])
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        tap(([windowSize]) => {
          this.updateArrowsVisibility(elementRef, windowSize.width);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private initTouchHandler(elementRef: ElementRef) {
    fromEvent<TouchEvent>(elementRef.nativeElement, 'touchmove')
      .pipe(
        tap((event) => event.stopPropagation()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private initScrollEndHandler(elementRef: ElementRef) {
    fromEvent<TouchEvent>(elementRef.nativeElement, 'scrollend')
      .pipe(withLatestFrom(this.windowSize$), takeUntilDestroyed(this.destroyRef))
      .subscribe(([, windowSize]) => {
        this.updateArrowsVisibility(elementRef, windowSize.width);
      });

    if (this.isSafari) {
      fromEvent<TouchEvent>(elementRef.nativeElement, 'scroll')
        .pipe(withLatestFrom(this.windowSize$), debounceTime(300), takeUntilDestroyed(this.destroyRef))
        .subscribe(([, windowSize]) => {
          this.updateArrowsVisibility(elementRef, windowSize.width);
        });
    }
  }

  private scrollByDelta(elementRef: ElementRef, startValue: number, endValue: number) {
    const diff = startValue - endValue;

    if (diff > 0) {
      this.scrollLeft(elementRef, diff);
    }

    if (diff < 0) {
      this.scrollRight(elementRef, Math.abs(diff));
    }
  }

  private scrollLeft(elementRef: ElementRef, step: number) {
    const el = elementRef.nativeElement;
    el.scrollLeft = el.scrollLeft - step < 0 ? 0 : el.scrollLeft - step;
  }

  private scrollRight(elementRef: ElementRef, step: number) {
    elementRef.nativeElement.scrollLeft += step;
  }

  private updateArrowsVisibility(elementRef: ElementRef, windowWidth?: number) {
    if (!this.showArrowsOnMobile() && (windowWidth || 0) <= 740 && this.isTouchDevice) {
      this.isLeftArrowVisible.set(false);
      this.isRightArrowVisible.set(false);
    } else {
      const el = elementRef.nativeElement;
      this.isLeftArrowVisible.set(el.scrollLeft > 0);
      this.isRightArrowVisible.set(!(el.scrollLeft + 1 + el.clientWidth >= el.scrollWidth));
    }
  }
}
