import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ytstock } from './ytstock';

describe('Ytstock', () => {
  let component: Ytstock;
  let fixture: ComponentFixture<Ytstock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ytstock],
    }).compileComponents();

    fixture = TestBed.createComponent(Ytstock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
