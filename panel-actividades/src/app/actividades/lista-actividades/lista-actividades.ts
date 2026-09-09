import { Component, input, output } from '@angular/core';
import { Actividad } from '../../models/actividad';
import { TarjetaActividades } from '../tarjeta-actividades/tarjeta-actividades';

@Component({
  selector: 'app-lista-actividades',
  imports: [TarjetaActividades],
  templateUrl: './lista-actividades.html',
  styleUrl: './lista-actividades.css',
})
export class ListaActividades {
readonly actividades = input.required<Actividad[]>();
  readonly seleccionadaId = input<number | null>(null);
  readonly mensajeVacio = input('No hay nada que mostrar.');
  readonly hayFiltros = input(false);

  readonly seleccionCambiada = output<number>();
  readonly destacadoCambiado = output<number>();
  readonly avanceSolicitado = output<number>();
  readonly eliminacionSolicitada = output<number>();
  readonly limpiezaSolicitada = output<void>();
}
