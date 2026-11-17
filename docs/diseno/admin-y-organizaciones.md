# Diseño funcional · Panel del fundador y panel de organizaciones (F15 y F17)

Fuente: `PROTOTIPO-Brief-Fable.md` §1.1, §3 (F15 y F17) y §4. Mismo formato que `nucleo.md`.

## F15 · Panel de administración del fundador

Prioridad P1. Donde el fundador lee la evidencia del piloto y mantiene el contenido, sin ver datos de cuidado de nadie.

### Flujo

**Entrar**

1. El fundador entra a `/admin` con su cuenta. La primera vez inscribe un segundo factor (un código de 6 dígitos de una app autenticadora); después se le pide en cada sesión.
2. Quien no es administrador ve la página de "no encontrado", como si el panel no existiera.

**Métricas** (filtrables por organización y por cohorte de registro)

| Hipótesis | Qué muestra |
|---|---|
| H1 · Uso diario | Días activos por semana; retención en las semanas 1, 4 y 8 |
| H2 · Tareas rápidas | Tiempo en registrar la bitácora y en crear un recordatorio; abandono por flujo |
| H3 · Valor percibido | Respuestas a "¿Cómo te sentirías si Sole dejara de existir?" |
| H4 · Disposición a pagar | Uso del informe para el médico; interés por puerta falsa; precio elegido |
| H5 · Sumar a otras personas | Invitaciones a familiares o interés en su puerta falsa; vínculos de la persona cuidada |
| H6 · Canales | Altas y retención por código de organización |

Además: porcentaje de usuarias activas con avisos activados. Cada gráfico tiene su cifra en texto. Los umbrales del brief se muestran como referencia, no como semáforo.

**Organizaciones**

1. Crear una organización con nombre, tipo y código. El panel muestra su enlace: `app.solecuida.com/?org=CODIGO`.
2. Desactivar una organización: su código deja de asociar usuarias nuevas.
3. Si F17 existe, generar o renovar el enlace privado de su panel.

**Contenido**

1. Banco de consejos y actividades (F2): crear, editar, activar o desactivar.
2. Directorio de recursos (F8): cada recurso necesita fuente oficial y fecha de verificación para mostrarse.
3. Plantillas por tipo de cuidado (F1): editar sus ítems.

**Comentarios y errores**

1. Lista de comentarios y problemas enviados con "Contarle algo a Sole", del más nuevo al más antiguo, marcables como leídos.
2. Un enlace al panel de Sentry para los errores técnicos.

**Exportar**

Descarga en CSV de los eventos de investigación, con identificador seudónimo. Sin nombres, correos ni texto libre.

**Límites gratuitos**

Uso de la base de datos, usuarias activas del mes y eventos, frente a los límites de `docs/limites.md`. Aviso visible al llegar al 80 %.

### Datos

- `events`: eventos seudónimos de uso; nunca nombre, correo ni texto libre.
- `profiles`: fecha de registro (cohorte) y código de organización.
- `survey_responses` y `fake_door_interest`: respuestas agregadas.
- `organizations`, `tips`, `resources` y `care_templates`: lo que el fundador edita.
- `feedback`: comentarios, con su marca de leído.
- `admin_audit_log`: cada acción del fundador en el panel (qué hizo, sobre qué y cuándo).

### Permisos

- El rol de administrador se asigna solo con una instrucción manual del fundador en la base de datos. Ninguna pantalla ni función de la app lo concede.
- Cada página y cada descarga del panel exige el rol y el segundo factor, comprobados en el servidor.
- El administrador **no** puede leer bitácoras, medicamentos, contactos ni el bienestar de ninguna usuaria.
- Los comentarios los lee solo el administrador.

### Criterios de aceptación

- Sin el rol de administrador, `/admin` responde como página no encontrada.
- Con el rol pero sin segundo factor, el panel lleva a inscribirlo o verificarlo.
- Las seis hipótesis tienen su métrica, filtrable por organización y por cohorte.
- El fundador crea una organización y obtiene su enlace con código.
- Un recurso sin fuente y fecha de verificación no se muestra a las usuarias.
- La exportación no contiene nombres, correos ni texto libre.
- El panel avisa cuando el uso llega al 80 % de un límite gratuito.
- Cada acción administrativa queda en el registro de auditoría.

## F17 · Panel para organizaciones

Prioridad P3. Se construye en la fase 8, si sobra tiempo. Le devuelve a cada organización aliada una mirada de lo que pasa con las personas que llegaron por su enlace.

### Flujo

1. El fundador genera en F15 un enlace privado para la organización y se lo entrega.
2. La organización lo abre, sin crear cuenta. Es de solo lectura.
3. Ve **solo datos agregados** de las usuarias que llegaron con su código:
   - cuántas personas se registraron;
   - cuántas siguen activas por semana;
   - qué funciones se usan más.
4. **Nunca se muestra un grupo de menos de 5 personas.** Si un dato reúne menos de 5, en su lugar aparece: "Todavía no hay suficientes personas para mostrar este dato."
5. El enlace se puede renovar desde F15; el anterior deja de funcionar.

### Datos

- `organizations.dashboard_token_hash`: la huella del enlace privado; el enlace no se guarda.
- `profiles.org_code` y `events`: de ahí salen los agregados.
- El panel no guarda nada nuevo.

### Permisos

- Quien tiene el enlace ve solo los agregados de su organización.
- No hay filas individuales, identificadores, nombres ni correos, en ninguna vista ni descarga.
- La regla de 5 personas como mínimo se aplica en el servidor, no en la pantalla.
- Una organización nunca ve datos de otra.

### Criterios de aceptación

- El panel se abre con el enlace privado y sin cuenta.
- Muestra solo datos de las usuarias que llegaron con el código de esa organización.
- Con menos de 5 personas en un grupo, el dato no se muestra.
- Un enlace renovado invalida el anterior.
- Ninguna respuesta del servidor incluye datos de una persona individual.
