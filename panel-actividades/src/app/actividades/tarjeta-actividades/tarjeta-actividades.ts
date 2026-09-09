import { Component, computed, input, output } from '@angular/core';
import { Actividad, ETIQUETAS, } from '../../models/actividad';

@Component({
  selector: 'app-tarjeta-actividades',
  imports: [],
  templateUrl: './tarjeta-actividades.html',
  styleUrl: './tarjeta-actividades.css',
})
export class TarjetaActividades {
  readonly actividad = input.required<Actividad>();
  readonly seleccionada = input(false);

  readonly seleccionCambiada = output<number>();
  readonly destacadoCambiado = output<number>();
  readonly avanceSolicitado = output<number>();
  readonly eliminacionSolicitada = output<number>();

  protected readonly etiquetaEstado = computed(() => ETIQUETAS[this.actividad().estado]);

  protected readonly etiquetaEliminar = computed(() => `Eliminar ${this.actividad().titulo}`);

  protected get porcentaje(): number {
    if (this.actividad().estado === 'completada') return 100;
    if (this.actividad().estado === 'en_progreso') return 60;
    if (this.actividad().estado === 'pendiente') return 10;
    return 0;
  }
}
