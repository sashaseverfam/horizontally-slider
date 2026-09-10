import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorizontallySliderComponent } from './horizontally-slider.component';

describe('HorizontallySlider', () => {
  let component: HorizontallySliderComponent;
  let fixture: ComponentFixture<HorizontallySliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorizontallySliderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HorizontallySliderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
