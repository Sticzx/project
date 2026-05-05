import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Emotes } from './emotes';

describe('Emotes', () => {
  let component: Emotes;
  let fixture: ComponentFixture<Emotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Emotes],
    }).compileComponents();

    fixture = TestBed.createComponent(Emotes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
