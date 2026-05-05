import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Thumbnails } from './thumbnails';

describe('Thumbnails', () => {
  let component: Thumbnails;
  let fixture: ComponentFixture<Thumbnails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Thumbnails],
    }).compileComponents();

    fixture = TestBed.createComponent(Thumbnails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
