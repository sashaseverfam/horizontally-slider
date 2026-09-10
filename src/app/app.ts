import { Component, output, signal } from '@angular/core';
import { HorizontallySliderComponent, SliderPhoto } from 'horizontally-slider';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [HorizontallySliderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly scrollRefresh$ = new Subject<void>();

  protected readonly selectedIndex = signal<number | null>(null);

  protected readonly selectedChange = output<number>();

  protected readonly photos: SliderPhoto[] = Array.from({ length: 20 }, (_, i) => ({
    url: `https://picsum.photos/id/${i + 1}/200/300`,
    name: `Photo ${i + 1}`,
    alt: `Photo ${i + 1}`,
  }));

  selectItem(index: number) {
    this.selectedIndex.set(index);
    this.selectedChange.emit(index);
  }
}
