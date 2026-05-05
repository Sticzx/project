import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Subscribed } from './subscribed';

describe('Subscribed', () => {
  let component: Subscribed;
  let fixture: ComponentFixture<Subscribed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Subscribed],
    }).compileComponents();

    fixture = TestBed.createComponent(Subscribed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
