import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ResumenActividades } from './actividades/resumen-actividades/resumen-actividades';
import {ListaActividades} from './actividades/lista-actividades/lista-actividades';
import { TarjetaActividades } from './actividades/tarjeta-actividades/tarjeta-actividades';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ResumenActividades, ListaActividades,TarjetaActividades],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('panel-actividades');
}
