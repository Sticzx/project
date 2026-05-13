import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Ytidle } from './ytidle';
import { provideRouter } from '@angular/router';

describe('Ytidle', () => {
  let component: Ytidle;
  let fixture: ComponentFixture<Ytidle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ytidle],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Ytidle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
