import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Coindetail } from './coindetail';

describe('Coindetail', () => {
  let component: Coindetail;
  let fixture: ComponentFixture<Coindetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Coindetail],
    }).compileComponents();

    fixture = TestBed.createComponent(Coindetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
