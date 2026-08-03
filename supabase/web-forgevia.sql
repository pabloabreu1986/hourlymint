-- ─────────────────────────────────────────────────────────────
-- fichaloop · Web pública de FORGEVIA (plantilla premium del PDF)
-- Ejecuta en: Supabase → SQL Editor → New query → Run. Idempotente.
--
-- 1. Crea la columna tenants.web si no existe (= web-clientes.sql).
-- 2. Aplica a FORGEVIA la plantilla de la estrategia premium
--    (Experiencias Essential/Signature/Bespoke, reserva, Libro del
--    Proyecto, FAQ y contacto) — SOLO si su web está vacía, para no
--    pisar cambios hechos desde el panel.
--
-- Después edítala desde: fichaloop.com → Clientes → FORGEVIA →
-- "Web pública del cliente" (teléfono/email del contacto están vacíos).
-- ─────────────────────────────────────────────────────────────

alter table tenants add column if not exists web jsonb not null default '[]';

update tenants set web = '[
  {
    "id": "ws_hero", "tipo": "hero",
    "titulo": "Construimos el valor de tu propiedad.",
    "subtitulo": "FORGEVIA no vende reformas: entrega proyectos llave en mano con diseño, ejecución, control de calidad y una experiencia de cliente diferenciadora.",
    "items": []
  },
  {
    "id": "ws_exp", "tipo": "cards",
    "titulo": "Nuestras experiencias",
    "subtitulo": "Tres formas de trabajar contigo, según lo que necesite tu proyecto.",
    "items": [
      {
        "id": "wi_ess", "titulo": "Essential",
        "etiqueta": "Baños, cocinas y reformas parciales",
        "texto": "Lo fundamental, bien hecho.",
        "puntos": ["Visita técnica y presupuesto", "Coordinación integral de la obra", "Materiales acordados", "Limpieza final", "Garantía FORGEVIA", "Entrega técnica"]
      },
      {
        "id": "wi_sig", "titulo": "Signature",
        "etiqueta": "Servicio estrella",
        "texto": "Todo Essential, más diseño y dirección de proyecto.",
        "destacada": true,
        "puntos": ["Diseño e interiorismo", "Arquitecto cuando sea necesario", "Renders 3D y moodboard", "Director de proyecto", "Hasta 2 revisiones de diseño", "Libro del Proyecto FORGEVIA", "Reportaje fotográfico profesional", "Pasaporte de la Vivienda"]
      },
      {
        "id": "wi_bes", "titulo": "Bespoke",
        "etiqueta": "A medida",
        "texto": "Todo Signature, con un equipo dedicado de principio a fin.",
        "puntos": ["Arquitecto e interiorista dedicados", "Decoración personalizada", "Recorrido virtual 3D", "Diseño de iluminación y mobiliario", "Acompañamiento a showrooms", "Vídeo cinematográfico y entrega VIP", "Revisión postventa a los 6 y 12 meses"]
      }
    ]
  },
  {
    "id": "ws_reserva", "tipo": "chips",
    "titulo": "Reserva de proyecto",
    "subtitulo": "Se descuenta íntegra al contratar la obra.",
    "items": [
      { "id": "wi_r1", "texto": "Baño · 300 €" },
      { "id": "wi_r2", "texto": "Cocina · 500 €" },
      { "id": "wi_r3", "texto": "Reforma integral · 1.000 €" },
      { "id": "wi_r4", "texto": "Local · 1.500 €" }
    ]
  },
  {
    "id": "ws_libro", "tipo": "lista",
    "titulo": "El Libro del Proyecto",
    "subtitulo": "Cada proyecto se entrega documentado de principio a fin.",
    "items": [
      { "id": "wi_l1", "texto": "Portada personalizada y estado actual" },
      { "id": "wi_l2", "texto": "Renders y selección de materiales" },
      { "id": "wi_l3", "texto": "Cronograma y presupuesto" },
      { "id": "wi_l4", "texto": "Garantías y documentación técnica" },
      { "id": "wi_l5", "texto": "Fotografías finales del proyecto" }
    ]
  },
  {
    "id": "ws_faq", "tipo": "faq",
    "titulo": "Preguntas frecuentes",
    "subtitulo": "",
    "items": [
      { "id": "wi_f1", "titulo": "¿Cómo es la forma de pago?", "texto": "60 % al inicio, 20 % durante la obra y 20 % a la entrega." },
      { "id": "wi_f2", "titulo": "¿Qué incluye la entrega premium?", "texto": "Una caja FORGEVIA con la documentación del proyecto, garantía, memoria USB y detalles personalizados según el tipo de proyecto." },
      { "id": "wi_f3", "titulo": "¿La reserva de proyecto se pierde?", "texto": "No: se descuenta íntegramente del presupuesto al contratar la obra." }
    ]
  },
  {
    "id": "ws_cta", "tipo": "cta",
    "titulo": "¿Hablamos de tu proyecto?",
    "subtitulo": "Cuéntanos qué tienes en mente y te preparamos una visita técnica.",
    "items": [],
    "telefono": "", "email": "", "whatsapp": ""
  }
]'::jsonb
where id = 'forgevia' and (web is null or web = '[]'::jsonb);

-- Verificación: cuántas secciones tiene ahora la web de FORGEVIA.
select id, jsonb_array_length(web) as secciones from tenants where id = 'forgevia';
