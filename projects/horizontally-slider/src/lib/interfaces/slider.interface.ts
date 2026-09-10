import { SafeResourceUrl } from '@angular/platform-browser';

export interface ISliderPhoto {
  url: string | SafeResourceUrl;
  name: string;
  alt: string;
  disabled?: boolean;
}
