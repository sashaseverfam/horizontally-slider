import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { WINDOW_PROVIDERS, WINDOW_SIZE } from './providers/window.providers';
import {
  debounceTime,
  fromEvent,
  Observable,
  pairwise,
  startWith,
  Subscription,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [WINDOW_PROVIDERS],
})
export class HorizontallySliderComponent implements OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly windowSize$ = inject(WINDOW_SIZE);

  @Input() dragStep = 5;
  @Input() clickStep = 100;
  @Input() wheelStep = 100;
  @Input() showAlwaysArrows = false;
  @Input() showArrowsOnMobile = false;
  @Input() noGap = false;
  @Input() scrollRefresh$ = new Subject<void>();

  @ViewChild('track', { static: false })
  trackElement?: ElementRef<HTMLDivElement>;

  @ViewChild('leftArrow', { static: false })
  leftArrowElement?: ElementRef<HTMLDivElement>;

  @ViewChild('rightArrow', { static: false })
  rightArrowElement?: ElementRef<HTMLDivElement>;

  private subscriptions: Subscription[] = [];

  isRightArrowVisible = false;
  isLeftArrowVisible = false;
  isTouchDevice = false;

  private isSafari = false;

  constructor() {
    afterNextRender(() => {
      this.isTouchDevice = isTouchDevice();
      this.isSafari = isSafari();

      if (this.trackElement) {
        this.initWheelHandler(this.trackElement);
        this.initDragHandler(this.trackElement);
        this.initArrowHandler(this.trackElement);
        this.initResizeHandler(this.trackElement);
        this.initTouchHandler(this.trackElement);
        this.initScrollEndHandler(this.trackElement);
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private addSubscription(subscription: Subscription) {
    this.subscriptions.push(subscription);
  }

  private initWheelHandler(elementRef: ElementRef) {
    this.addSubscription(
      fromEvent<WheelEvent>(elementRef.nativeElement, 'wheel')
        .pipe(
          filter(() => this.isTouchDevice),
          tap((event) => {
            event.preventDefault();
            this.scrollByDelta(elementRef, event.deltaY, 0);
          }),
        )
        .subscribe(),
    );
  }

  private initDragHandler(elementRef: ElementRef) {
    const mouseDown$ = fromEvent<MouseEvent>(elementRef.nativeElement, 'mousedown');
    const mouseUp$ = fromEvent<MouseEvent>(elementRef.nativeElement, 'mouseup');
    const mouseMove$ = fromEvent<MouseEvent>(elementRef.nativeElement, 'mousemove');
    const mouseLeave$ = fromEvent<MouseEvent>(elementRef.nativeElement, 'mouseleave');

    this.addSubscription(
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
        )
        .subscribe(),
    );
  }

  private initArrowHandler(elementRef: ElementRef) {
    if (this.leftArrowElement) {
      this.initClickHandler(elementRef, this.leftArrowElement, ArrowAction.PREV);
      this.initTouchArrowHandler(elementRef, this.leftArrowElement, ArrowAction.PREV);
    }
    if (this.rightArrowElement) {
      this.initClickHandler(elementRef, this.rightArrowElement, ArrowAction.NEXT);
      this.initTouchArrowHandler(elementRef, this.rightArrowElement, ArrowAction.NEXT);
    }
  }

  private initClickHandler(
    elementRef: ElementRef,
    arrowElement: ElementRef,
    action: ArrowAction,
  ) {
    this.addSubscription(
      fromEvent<MouseEvent>(arrowElement.nativeElement, 'click')
        .pipe(
          tap((event) => {
            event.stopPropagation();
            this.handleArrowAction(elementRef, action);
          }),
        )
        .subscribe(),
    );
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

    this.addSubscription(
      longTouch$
        .pipe(
          switchMap((event) => {
            event.stopPropagation();
            return interval(1000).pipe(takeUntil(touchEnd$));
          }),
          tap(() => this.handleArrowAction(elementRef, action)),
        )
        .subscribe(),
    );
  }

  private handleArrowAction(elementRef: ElementRef, action: ArrowAction) {
    if (action === ArrowAction.PREV) {
      this.scrollLeft(elementRef, this.clickStep);
    } else {
      this.scrollRight(elementRef, this.clickStep);
    }
    if (this.isSafari) {
      this.updateArrowsVisibility(elementRef);
    }
  }

  private initResizeHandler(elementRef: ElementRef) {
    this.addSubscription(
      combineLatest([this.windowSize$, this.scrollRefresh$.pipe(startWith(null))])
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          tap(([windowSize]) => {
            this.updateArrowsVisibility(elementRef, windowSize.width);
          }),
        )
        .subscribe(),
    );
  }

  private initTouchHandler(elementRef: ElementRef) {
    this.addSubscription(
      fromEvent<TouchEvent>(elementRef.nativeElement, 'touchmove')
        .pipe(tap((event) => event.stopPropagation()))
        .subscribe(),
    );
  }

  private initScrollEndHandler(elementRef: ElementRef) {
    this.addSubscription(
      fromEvent<TouchEvent>(elementRef.nativeElement, 'scrollend')
        .pipe(withLatestFrom(this.windowSize$))
        .subscribe(([, windowSize]) => {
          this.updateArrowsVisibility(elementRef, windowSize.width);
          this.cdr.detectChanges();
        }),
    );

    if (this.isSafari) {
      this.addSubscription(
        fromEvent<TouchEvent>(elementRef.nativeElement, 'scroll')
          .pipe(withLatestFrom(this.windowSize$), debounceTime(300))
          .subscribe(([, windowSize]) => {
            this.updateArrowsVisibility(elementRef, windowSize.width);
            this.cdr.detectChanges();
          }),
      );
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
    if (!this.showArrowsOnMobile && (windowWidth || 0) <= 740 && this.isTouchDevice) {
      this.isLeftArrowVisible = false;
      this.isRightArrowVisible = false;
    } else {
      const el = elementRef.nativeElement;
      this.isLeftArrowVisible = el.scrollLeft > 0;
      this.isRightArrowVisible = !(el.scrollLeft + 1 + el.clientWidth >= el.scrollWidth);
    }

    this.cdr.detectChanges();
  }
}
