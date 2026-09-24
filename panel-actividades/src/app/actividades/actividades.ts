import { Service, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, retry, timer } from 'rxjs';
import { ActividadesApi } from '../api/actividades-api';
import { Actividad, EstadoActividad, LIMITES, Prioridad } from '../models/actividad';
import { mensajeDe } from '../api/mensajes';

@Service()
export class ActividadesService {

  private readonly api = inject(ActividadesApi);
  private readonly lista = signal<Actividad[]>([]);

  readonly actividades = this.lista.asReadonly();
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly aviso = signal('');
  readonly sinGuardar = signal(false);

  readonly total = computed(() => this.lista().length);

  readonly pendientes = computed(() => this.lista().filter((a) => a.estado === 'pendiente').length);

  readonly enProgreso = computed(
    () => this.lista().filter((a) => a.estado === 'en_progreso').length,
  );

  readonly completadas = computed(
    () => this.lista().filter((a) => a.estado === 'completada').length,
  );

  readonly porcentaje = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.completadas() / this.total()) * 100),
  );

  constructor() {
    this.cargar();
  }

  buscarPorId(id: number): Actividad | undefined {
    return this.lista().find((a) => a.id === id);
  }

 crear(titulo: string, descripcion: string, prioridad: Prioridad): Actividad | null {
    const limpio = titulo.trim();

    if (!this.tituloAceptable(limpio, null)) {
      return null;
    }

    const provisional: Actividad = {
      id: this.siguienteId(),
      titulo: limpio,
      descripcion: descripcion.trim(),
      estado: 'pendiente',
      prioridad,
      creadaEn: new Date().toISOString().slice(0, 10),
      destacada: false,
    };


    this.lista.update((actual) => [...actual, provisional]);

    this.api
      .crear({ titulo: limpio, descripcion: descripcion.trim(), prioridad, completada: false })
      .pipe(catchError((e: unknown) => this.deshacer(provisional.id, e)))
      .subscribe((guardada) => {
        if (guardada) {

          this.reemplazar(provisional.id, guardada);
        } else {

          this.error.set('La respuesta del servidor no incluyó un ID válido.');
          this.lista.update((actual) => actual.filter((a) => a.id !== provisional.id));
        }
      });

    return provisional;
  }
  actualizar(id: number, titulo: string, descripcion: string, prioridad: Prioridad): boolean {
    const limpio = titulo.trim();
    const anterior = this.buscarPorId(id);

    if (!anterior || !this.tituloAceptable(limpio, id)) {
      return false;
    }

    this.aplicarLocal(id, { titulo: limpio, descripcion: descripcion.trim(), prioridad });
    this.enviar(id);
    return true;
  }

  private tituloAceptable(limpio: string, salvo: number | null): boolean {
    if (limpio.length < LIMITES.tituloMin || limpio.length > LIMITES.tituloMax) {
      return false;
    }

    const normal = limpio.toLocaleLowerCase('es');

    return !this.lista().some((a) => a.id !== salvo && a.titulo.toLocaleLowerCase('es') === normal);
  }

  private siguienteId(): number {
    return (
      this.lista().reduce((mayor, a) => {
        const idNumerico = Number(a.id);
        return !isNaN(idNumerico) ? Math.max(mayor, idNumerico) : mayor;
      }, 0) + 1
    );
  }
  alternarDestacada(id: number): void {
    this.aplicarLocal(id, { destacada: !this.buscarPorId(id)?.destacada });
  }

  avanzarEstado(id: number): void {
    const actividad = this.buscarPorId(id);
    if (!actividad) return;

    this.aplicarLocal(id, { estado: this.siguienteEstado(actividad.estado) });
    this.enviar(id);
  }

  eliminar(id: number): void {
    const anterior = this.buscarPorId(id);
    if (!anterior) return;

    this.lista.update((actual) => actual.filter((a) => a.id !== id));

    this.api
      .eliminar(id)
      .pipe(
        catchError((e: unknown) => {
          this.error.set(mensajeDe(e));
          this.lista.update((actual) => [...actual, anterior]);
          return of(undefined);
        }),
      )
      .subscribe();
  }

  private enviar(id: number): void {
    const actividad = this.buscarPorId(id);
    if (!actividad) return;

    this.api
      .actualizar(id, {
        titulo: actividad.titulo,
        descripcion: actividad.descripcion,
        prioridad: actividad.prioridad,
        completada: actividad.estado === 'completada',
      })
      .pipe(
        catchError((e: unknown) => {
          this.error.set(mensajeDe(e));
          return of(null);
        }),
      )
      .subscribe();
  }

  private deshacer(id: number, e: unknown) {
    this.error.set(mensajeDe(e));
    this.lista.update((actual) => actual.filter((a) => a.id !== id));
    return of(null);
  }

  private reemplazar(provisional: number, guardada: Actividad): void {
    this.lista.update((actual) => actual.map((a) => (a.id === provisional ? guardada : a)));
  }

  private aplicarLocal(id: number, cambios: Partial<Actividad>): void {
    this.lista.update((actual) => actual.map((a) => (a.id === id ? { ...a, ...cambios } : a)));
  }

  vaciar(): void {
    this.aplicar(() => []);
  }

  private aplicar(cambio: (actual: Actividad[]) => Actividad[]): void {
    this.lista.update(cambio);
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.api
      .listar()
      .pipe(
        retry({ count: 2, delay: (_, intento) => timer(intento * 300) }),
        catchError((e: unknown) => {
          this.error.set(mensajeDe(e));
          return of<Actividad[]>([]);
        }),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe((actividades) => this.lista.set(actividades));
  }

  private siguienteEstado(estado: EstadoActividad): EstadoActividad {
    if (estado === 'pendiente') return 'en_progreso';
    if (estado === 'en_progreso') return 'completada';
    return 'completada';
  }
}
