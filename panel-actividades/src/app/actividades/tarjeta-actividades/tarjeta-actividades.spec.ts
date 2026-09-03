import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaActividades } from './tarjeta-actividades';

describe('TarjetaActividades', () => {
  let component: TarjetaActividades;
  let fixture: ComponentFixture<TarjetaActividades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaActividades],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaActividades);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
