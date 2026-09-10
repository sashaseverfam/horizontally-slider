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
import { EArrowAction } from './enums/slider.enums';

const DELAY_LONG_CLICK = 200;

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

  @Input() deltaMouseMove = 5;
  @Input() deltaClick = 100;
  @Input() deltaWheel = 100;
  @Input() isShowAlwaysArrows = false;
  @Input() isShowArrowsMobile = false;

  @Input() modificator?: string;

  @Input() updateScroll$ = new Subject<void>();

  @ViewChild('invisibleHorizontallyScroll', { static: false })
  invisibleHorizontallyScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('leftArrow', { static: false })
  leftArrow?: ElementRef<HTMLDivElement>;
  @ViewChild('rightArrow', { static: false })
  rightArrow?: ElementRef<HTMLDivElement>;

  private _subs: Subscription[] = [];
  set subs(sub: Subscription) {
    this._subs.push(sub);
  }

  isShowRightArrow = false;
  isShowLeftArrow = false;

  public isTouchDevice = false;
  private isSafari = false;

  constructor() {
    afterNextRender(() => {
      this.isTouchDevice = isTouchDevice();
      this.isSafari = isSafari();

      if (this.invisibleHorizontallyScroll) {
        this.initWheelActions(this.invisibleHorizontallyScroll);
        this.initMouseActions(this.invisibleHorizontallyScroll);

        this.initArrowActions(this.invisibleHorizontallyScroll);
        this.initResizeActions(this.invisibleHorizontallyScroll);
        this.initTouchActions(this.invisibleHorizontallyScroll);

        this.initScrollEnd(this.invisibleHorizontallyScroll);
      }
    });
  }

  ngOnDestroy() {
    this._subs.forEach((s) => s.unsubscribe());
  }

  private initWheelActions(elementRef: ElementRef) {
    this.subs = fromEvent<WheelEvent>(elementRef.nativeElement, 'wheel')
      .pipe(
        filter(() => this.isTouchDevice),
        tap((event) => {
          event.preventDefault();
          this.scrollElement(elementRef, event.deltaY, 0, this.deltaWheel);
        }),
      )
      .subscribe();
  }

  private initMouseActions(elementRef: ElementRef) {
    const mouseDownEvent$: Observable<MouseEvent> = fromEvent(
      elementRef.nativeElement,
      'mousedown',
    );
    const mouseUpEvent$: Observable<MouseEvent> = fromEvent(elementRef.nativeElement, 'mouseup');
    const mouseMoveEvent$: Observable<MouseEvent> = fromEvent(
      elementRef.nativeElement,
      'mousemove',
    );
    const mouseLeaveEvent$: Observable<MouseEvent> = fromEvent(
      elementRef.nativeElement,
      'mouseleave',
    );

    this.subs = mouseDownEvent$
      .pipe(
        switchMap((mouseStartEvent) => {
          mouseStartEvent.preventDefault();
          return mouseMoveEvent$.pipe(
            pairwise(),
            tap(([mouseMoveEventCurr, mouseMoveEventPrev]) => {
              this.scrollElement(
                elementRef,
                mouseMoveEventPrev.clientX,
                mouseMoveEventCurr.clientX,
                this.deltaMouseMove,
              );
            }),
            debounceTime(100),
            tap(() => {
              this.conditionsForArrows(elementRef);
            }),
            takeUntil(mouseUpEvent$),
            takeUntil(mouseLeaveEvent$),
          );
        }),
      )
      .subscribe();
  }

  private initArrowActions(elementRef: ElementRef) {
    if (this.leftArrow) {
      this.initClickMethods(elementRef, this.leftArrow, EArrowAction.STEPPREVSLIDER);
      this.initTouchMethods(elementRef, this.leftArrow, EArrowAction.STEPPREVSLIDER);
    }
    if (this.rightArrow) {
      this.initClickMethods(elementRef, this.rightArrow, EArrowAction.STEPNEXTSLIDER);
      this.initTouchMethods(elementRef, this.rightArrow, EArrowAction.STEPNEXTSLIDER);
    }
  }

  private initClickMethods(
    elementRef: ElementRef,
    arrowElementRef: ElementRef,
    typeArrowAction: EArrowAction,
  ) {
    const click$ = fromEvent<MouseEvent>(arrowElementRef.nativeElement, 'click');

    this.subs = click$
      .pipe(
        tap((event: MouseEvent) => {
          event.stopPropagation();
          switch (typeArrowAction) {
            case EArrowAction.STEPPREVSLIDER: {
              this.deltaDecrease(elementRef, this.deltaClick);
              if (this.isSafari) {
                this.conditionsForArrows(elementRef);
              }
              break;
            }
            case EArrowAction.STEPNEXTSLIDER: {
              this.deltaIncrease(elementRef, this.deltaClick);
              if (this.isSafari) {
                this.conditionsForArrows(elementRef);
              }
              break;
            }
          }
        }),
      )
      .subscribe();
  }

  private initTouchMethods(
    elementRef: ElementRef,
    arrowElementRef: ElementRef,
    typeArrowAction: EArrowAction,
  ) {
    const touchstart$ = fromEvent<TouchEvent>(arrowElementRef.nativeElement, 'touchstart');
    const touchend$ = fromEvent<TouchEvent>(arrowElementRef.nativeElement, 'touchend');

    const longTouch$ = touchstart$.pipe(
      switchMap((v) => {
        return of(v).pipe(delay(DELAY_LONG_CLICK), takeUntil(touchend$));
      }),
    );

    this.subs = longTouch$
      .pipe(
        switchMap((evt) => {
          evt.stopPropagation();
          return interval(1000).pipe(takeUntil(touchend$));
        }),
        tap(() => {
          switch (typeArrowAction) {
            case EArrowAction.STEPPREVSLIDER: {
              this.deltaDecrease(elementRef, this.deltaClick);
              if (this.isSafari) {
                this.conditionsForArrows(elementRef);
              }
              break;
            }
            case EArrowAction.STEPNEXTSLIDER: {
              this.deltaIncrease(elementRef, this.deltaClick);
              if (this.isSafari) {
                this.conditionsForArrows(elementRef);
              }
              break;
            }
          }
        }),
      )
      .subscribe();
  }

  private initResizeActions(elementRef: ElementRef) {
    this.subs = combineLatest([this.windowSize$, this.updateScroll$.pipe(startWith(null))])
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        tap(([windowsWidth]) => {
          this.conditionsForArrows(elementRef, windowsWidth.width);
        }),
      )
      .subscribe();
  }

  private initTouchActions(elementRef: ElementRef) {
    this.subs = fromEvent<TouchEvent>(elementRef.nativeElement, 'touchmove')
      .pipe(
        tap((event: TouchEvent) => {
          event.stopPropagation();
        }),
      )
      .subscribe();
  }

  private initScrollEnd(elementRef: ElementRef) {
    this.subs = fromEvent<TouchEvent>(elementRef.nativeElement, 'scrollend')
      .pipe(withLatestFrom(this.windowSize$))
      .subscribe(([, windowsSize]) => {
        this.conditionsForArrows(elementRef, windowsSize.width);

        this.cdr.detectChanges();
      });
    if (this.isSafari) {
      this.subs = fromEvent<TouchEvent>(elementRef.nativeElement, 'scroll')
        .pipe(withLatestFrom(this.windowSize$), debounceTime(300))
        .subscribe(([, windowsSize]) => {
          this.conditionsForArrows(elementRef, windowsSize.width);

          this.cdr.detectChanges();
        });
    }
  }

  private scrollElement(
    elementRef: ElementRef,
    startValue: number,
    endValue: number,
    _delta: number,
  ) {
    const diff = startValue - endValue;

    if (diff > 0) {
      this.deltaDecrease(elementRef, diff);
    }

    if (diff < 0) {
      this.deltaIncrease(elementRef, Math.abs(diff));
    }
  }

  private deltaDecrease(elementRef: ElementRef, delta: number) {
    elementRef.nativeElement.scrollLeft =
      elementRef.nativeElement.scrollLeft - delta < 0
        ? 0
        : elementRef.nativeElement.scrollLeft - delta;
  }

  private deltaIncrease(elementRef: ElementRef, delta: number) {
    elementRef.nativeElement.scrollLeft = elementRef.nativeElement.scrollLeft + delta;
  }

  private conditionsForArrows(elementRef: ElementRef, windowsWidth?: number) {
    if (!this.isShowArrowsMobile && (windowsWidth || 0) <= 740 && this.isTouchDevice) {
      this.isShowLeftArrow = false;
      this.isShowRightArrow = false;
    } else {
      this.isShowLeftArrow = !(elementRef.nativeElement.scrollLeft <= 0);
      this.isShowRightArrow = !(
        elementRef.nativeElement.scrollLeft + 1 + elementRef.nativeElement.clientWidth >=
        elementRef.nativeElement.scrollWidth
      );
    }

    this.cdr.detectChanges();
  }
}
