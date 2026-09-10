import { Component, output, signal } from '@angular/core';
import { HorizontallySliderComponent, ISliderPhoto } from 'horizontally-slider';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [HorizontallySliderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('angular-horizontally-slider');

  protected readonly updateScroll$ = new Subject<void>();

  protected readonly selectedIndex = signal<number | null>(null);

  protected readonly itemClicked = output<number>();

  protected readonly photos: ISliderPhoto[] = Array.from({ length: 20 }, (_, i) => ({
    url: `https://picsum.photos/id/${i + 1}/200/300`,
    name: `Photo ${i + 1}`,
    alt: `Photo ${i + 1}`,
  }));

  onSelect(index: number) {
    this.selectedIndex.set(index);
    this.itemClicked.emit(index);
  }
}
