import { Component, computed, inject, signal,input } from '@angular/core';
import { ActivatedRoute, Router,RouterLink } from '@angular/router';
import { ActividadesService } from '../actividades';
import { TarjetaActividades } from '../tarjeta-actividades/tarjeta-actividades';
import {FiltrosActividades} from '../filtros-actividades/filtros-actividades';
import {PanelSeccion} from '../../compartido/panel-seccion/panel-seccion';
import { ListaActividades } from '../lista-actividades/lista-actividades';
import { ResumenActividades } from '../resumen-actividades/resumen-actividades';
import { Prioridad,FiltroEstado,FiltroPrioridad,Actividad, EstadoActividad } from '../../models/actividad';
import { toObservable,takeUntilDestroyed  } from '@angular/core/rxjs-interop';
import { debounceTime,of,switchMap } from 'rxjs';
import { ActividadesApi } from '../../api/actividades-api';

@Component({
  selector: 'app-pagina-actividades',
  imports: [ FiltrosActividades, PanelSeccion, ListaActividades, ResumenActividades, TarjetaActividades, RouterLink ],
  templateUrl: './pagina-actividades.html',
  styleUrl: './pagina-actividades.css',
})
export class PaginaActividades {

  private readonly servicio = inject(ActividadesService);
  private readonly api = inject(ActividadesApi);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly actividades = this.servicio.actividades;
  protected readonly cargando = this.servicio.cargando;
  protected readonly errorCarga = this.servicio.error;
  protected readonly total = this.servicio.total;
  protected readonly pendientes = this.servicio.pendientes;
  protected readonly enProgreso = this.servicio.enProgreso;
  protected readonly completadas = this.servicio.completadas;
  protected readonly porcentaje = this.servicio.porcentaje;


  readonly buscar = input<string | undefined>('');
  readonly estado = input<FiltroEstado | undefined>('todas');
  readonly prioridad = input<FiltroPrioridad | undefined>('todas');

  protected readonly resultados = signal<Actividad[] | null>(null);

  private readonly orden: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

  protected readonly termino = computed(() => this.buscar() ?? '');
  protected readonly filtroEstado = computed(() => this.estado() ?? 'todas');
  protected readonly filtroPrioridad = computed(() => this.prioridad() ?? 'todas');

  protected readonly seleccionadaId = signal<number | null>(null);



  protected readonly actividadesDestacadas = computed(() => this.actividades().filter((a) => a.destacada));



  protected readonly aviso = this.servicio.aviso;
  protected readonly sinGuardar = this.servicio.sinGuardar;

  protected readonly visibles = computed(() => {
    const termino = this.termino().trim().toLocaleLowerCase('es');
    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();

    return this.actividades()
      .filter((a) => termino === '' || a.titulo.toLocaleLowerCase('es').includes(termino))
      .filter((a) => estado === 'todas' || a.estado === estado)
      .filter((a) => prioridad === 'todas' || a.prioridad === prioridad)
      .filter((a) => a.creadaEn >= '2026-08-12')
      .sort((p, s) => (this.orden[p.prioridad] - this.orden[s.prioridad]) || (s.creadaEn > p.creadaEn ? 1 : s.creadaEn < p.creadaEn ? -1 : 0));
  });

  protected readonly mostradas = computed(() => this.visibles().length);

  protected readonly hayFiltros = computed(
    () =>
      this.termino().trim() !== '' ||
      this.filtroEstado() !== 'todas' ||
      this.filtroPrioridad() !== 'todas',
  );

  protected readonly mensajeVacio = computed(() =>
    this.total() === 0
      ? 'Todavía no hay actividades. Crea la primera para empezar.'
      : 'Ninguna actividad coincide con los filtros aplicados.',
  );

  protected readonly seleccionada = computed(
    () => this.actividades().find((a) => a.id === this.seleccionadaId()) ?? null,
  );

  protected seleccionar(id: number): void {
    this.seleccionadaId.update((actual) => (actual === id ? null : id));
  }

  protected alternarDestacada(id: number): void {
    this.servicio.alternarDestacada(id);
  }

  protected avanzarEstado(id: number): void {
    this.servicio.avanzarEstado(id);
  }

  protected eliminar(id: number): void {
    this.servicio.eliminar(id);
    this.seleccionadaId.update((actual) => (actual === id ? null : actual));
  }

  private siguienteEstado(estado: EstadoActividad): EstadoActividad {
    if (estado === 'pendiente') return 'en_progreso';
    if (estado === 'en_progreso') return 'completada';
    return 'completada';
  }

  protected cambiarBuscar(valor: string): void {
    this.actualizar({ buscar: valor.trim() === '' ? null : valor });
  }

  protected cambiarEstado(valor: FiltroEstado): void {
    this.actualizar({ estado: valor === 'todas' ? null : valor });
  }

  protected cambiarPrioridad(valor: FiltroPrioridad): void {
    this.actualizar({ prioridad: valor === 'todas' ? null : valor });
  }

  protected limpiarFiltros(): void {
    this.actualizar({ buscar: null, estado: null, prioridad: null });
  }

  private actualizar(cambios: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: cambios,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected recargar(): void {
    this.servicio.cargar();
  }



  constructor() {
    toObservable(this.termino)
      .pipe(
        debounceTime(300),
        switchMap((t) => (t.trim() === '' ? of(null) : this.api.buscar(t))),
        takeUntilDestroyed(),
      )
      .subscribe((r) => this.resultados.set(r));

  }

  protected restablecer(): void {
    this.servicio.vaciar();
    this.limpiarFiltros();
    this.seleccionadaId.set(null);
  }




}
