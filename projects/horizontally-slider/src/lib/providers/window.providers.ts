import { FactoryProvider, inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { fromEvent, Observable, startWith, shareReplay, map } from 'rxjs';
import { WindowSize } from '../interfaces/window.interface';

export const WINDOW = new InjectionToken<Window>('window');

const windowProvider: FactoryProvider = {
  provide: WINDOW,
  useFactory: (platformId: object) => {
    if (isPlatformBrowser(platformId)) {
      return window;
    }
    return {};
  },
  deps: [PLATFORM_ID],
};

export const WINDOW_SIZE = new InjectionToken<Observable<WindowSize>>('window size');

const windowSizeProvider: FactoryProvider = {
  provide: WINDOW_SIZE,
  useFactory: () => {
    const win = inject(WINDOW);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return new Observable<WindowSize>((subscriber) => {
        subscriber.next({
          width: 1024,
          height: 768,
          innerWidth: 1024,
          innerHeight: 768,
        });
        subscriber.complete();
      });
    }

    return fromEvent(win, 'resize').pipe(
      startWith(null),
      map(() => {
        const width = Math.max(
          win.document.documentElement.clientWidth || 0,
          win.innerWidth || 0,
        );

        const height = Math.max(
          win.document.documentElement.clientHeight || 0,
          win.innerHeight || 0,
        );

        return {
          width,
          height,
          innerHeight: win.innerHeight || 0,
          innerWidth: win.innerWidth || 0,
        };
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  },
  deps: [WINDOW],
};

export const WINDOW_PROVIDERS = [windowProvider, windowSizeProvider];
