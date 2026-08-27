// Barrel de servicios. La UI importa siempre desde aquí.
// Migrar a BD real = reimplementar estos módulos (p.ej. fetch a una API).
export * as authApi from "./auth";
export * as usuariosApi from "./usuarios";
export * as clientesApi from "./clientes";
export * as oportunidadesApi from "./oportunidades";
export * as seguimientoApi from "./seguimiento";
export * as facturasApi from "./facturas";
export * as catalogoApi from "./catalogo";
export * as presupuestosApi from "./presupuestos";
export * as comprasApi from "./compras";
export * as obrasApi from "./obras";
export * as fichajesApi from "./fichajes";
export * as partesApi from "./partes";
export * as fotosApi from "./fotos";
export * as adjuntosApi from "./adjuntos";
export * as incidenciasApi from "./incidencias";
export * as notificacionesApi from "./notificaciones";
export * as alertasApi from "./alertas";
export * as recursosApi from "./recursos";
export * as dashboardApi from "./dashboard";
export * as tenantApi from "./tenant";
export * as leadsApi from "./leads";
export * as webLeadsApi from "./webLeads";
export * as contactLeadsApi from "./contactLeads";
export * as plataformaApi from "./plataforma";
// Suite RRHH
export * as ausenciasApi from "./ausencias";
export * as turnosApi from "./turnos";
export * as gastosApi from "./gastos";
export * as documentosApi from "./documentos";
export * as talentoApi from "./talento";
export * as comunicadosApi from "./comunicados";
