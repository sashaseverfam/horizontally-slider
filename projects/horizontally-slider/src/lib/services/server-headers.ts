import { inject, Injectable, REQUEST } from '@angular/core';
import { getApproximateScreenWidth } from '../utils/ua-parser.utils';

@Injectable({ providedIn: 'root' })
export class ServerHeadersService {
  private readonly request = inject(REQUEST, { optional: true });

  getApproximateScreenWidth() {
    return getApproximateScreenWidth(this.request?.headers?.get('user-agent'));
  }
}
