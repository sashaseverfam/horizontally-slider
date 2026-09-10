import { SafeResourceUrl } from '@angular/platform-browser';

export interface SliderPhoto {
  url: string | SafeResourceUrl;
  name: string;
  alt: string;
  disabled?: boolean;
}
