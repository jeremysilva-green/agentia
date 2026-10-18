-- Seeds the real Reglamento MLS de Agentia (v1.0, as drafted in the product
-- spec) as the first published version — not placeholder text. Agents can't
-- join the MLS at all until a version exists (join_mls requires one), and
-- showing real legal text (even a draft pending legal review, per the
-- source doc's own header) is safer than shipping with no version or a
-- lorem-ipsum stand-in.
insert into public.mls_rule_versions (version, body, published_at)
values (
  1,
  $reglamento$REGLAMENTO MLS DE AGENTIA
Versión 1.0 · Borrador para revisión legal antes de publicar.

CAPÍTULO I. DISPOSICIONES GENERALES

Artículo 1. Objeto. Este Reglamento regula el funcionamiento del MLS de Agentia (en adelante, "el MLS"), una red de propiedades compartidas en la que agentes inmobiliarios de distintas agencias cooperan en la venta de inmuebles y comparten honorarios según reglas previamente acordadas.

Artículo 2. Naturaleza. El MLS es un acuerdo de cooperación entre Miembros. Este Reglamento complementa, y no reemplaza, los Términos y Condiciones de Agentia. En caso de contradicción en asuntos de cooperación entre Miembros, prevalece este Reglamento.

Artículo 3. Rol de Agentia. Agentia administra la plataforma y aplica de forma automática las reglas objetivas de este Reglamento. Agentia no aprueba solicitudes, no supervisa a los Miembros, no media ni resuelve disputas, no es parte de ninguna operación inmobiliaria, no cobra ni paga honorarios entre Miembros y no garantiza el cierre de ninguna operación.

Artículo 4. Definiciones.
Miembro: agente con Plan MLS vigente, cuya solicitud de membresía fue aprobada y que aceptó la versión vigente de este Reglamento.
Agente captador: Miembro que cargó la propiedad en el MLS con autorización del propietario.
Agente cooperador: Miembro que presenta un comprador para una propiedad de otro Miembro.
Oferta de cooperación: porcentaje de honorarios que el Agente captador ofrece al Agente cooperador.
Registro de comprador: constancia con fecha y hora, cargada en la plataforma, que vincula a un comprador con un Agente cooperador para una propiedad determinada.

CAPÍTULO II. MEMBRESÍA

Artículo 5. Requisitos y alta automática. Para ser Miembro se requiere: (a) tener el Plan MLS vigente; (b) cargar el número de cédula de identidad; (c) aceptar este Reglamento. La membresía se activa automáticamente al cumplirse los tres requisitos.

Artículo 6. Veracidad y baja por fraude. El Miembro declara que sus datos son verídicos. Agentia puede dar de baja a un Miembro ante fraude o datos falsos, sin que ello implique obligación alguna de supervisar a los Miembros.

Artículo 7. Vigencia. La membresía queda suspendida automáticamente si el Plan MLS deja de estar vigente. Los Registros de comprador existentes conservan su validez hasta su vencimiento.

Artículo 8. Cambios al Reglamento. Agentia puede modificar este Reglamento avisando a los Miembros con al menos 15 días de anticipación. Para seguir operando en el MLS, el Miembro debe aceptar la nueva versión.

CAPÍTULO III. CARGA DE PROPIEDADES

Artículo 9. Autorización del propietario. Solo pueden cargarse en el MLS propiedades con autorización de venta firmada por el propietario, vigente y adjunta en la plataforma. Se recomienda la autorización exclusiva.

Artículo 10. Titularidad del listado. Si una propiedad ya está en el MLS, la plataforma bloquea automáticamente cualquier nueva carga de la misma propiedad. El listado corresponde al primer Miembro que la cargó con autorización firmada, según la fecha y hora de la plataforma. Ambos Miembros reciben un Aviso.

Artículo 11. Oferta de cooperación. Toda propiedad del MLS debe indicar una Oferta de cooperación. La Oferta de cooperación mínima es el 50% de los honorarios del Agente captador, conforme a la práctica habitual del mercado paraguayo. El Agente captador puede ofrecer un porcentaje mayor. Mientras permanezcan en el MLS, las propiedades no participan de la red de afiliados de Agentia.

Artículo 12. Exactitud. El Miembro garantiza que el precio, las características, las fotos y el estado de la documentación son reales y están actualizados. Se prohíbe publicar precios ficticios o propiedades no disponibles.

Artículo 13. Información privada. El precio mínimo del propietario, la dirección exacta, las instrucciones de visita y el estado de la documentación solo son visibles para Miembros. Ningún Miembro puede divulgar esta información a terceros ni contactar directamente al propietario de un listado ajeno.

CAPÍTULO IV. REGISTRO DE COMPRADORES

Artículo 14. Obligación de registrar. Antes de contactar al Agente captador por un comprador, el Agente cooperador debe registrarlo en la plataforma.

Artículo 15. Prioridad. Prevalece el primer Registro de comprador válido para una misma propiedad y un mismo comprador, según la fecha y hora de la plataforma.

Artículo 16. Vigencia del registro. El Registro de comprador vale 90 días corridos. Si la operación se cierra dentro de ese plazo con ese comprador, el Agente cooperador tiene derecho a la Oferta de cooperación vigente al momento del registro.

Artículo 17. Protección del Agente cooperador. El Agente captador no puede negociar directamente con un comprador registrado por otro Miembro para eludir la Oferta de cooperación. Si la operación se cierra de ese modo dentro del plazo de vigencia, el Agente captador igualmente debe pagar la Oferta de cooperación.

CAPÍTULO V. VISITAS, CIERRE Y HONORARIOS

Artículo 18. Visitas. Las visitas se coordinan a través de la plataforma. El Agente captador debe responder cada solicitud dentro de las 48 horas.

Artículo 19. Cierre. Al reservarse o venderse la propiedad, el Agente captador debe registrarlo e indicar al Agente cooperador, si lo hubo. El Agente cooperador tiene 7 días para confirmar u objetar el registro. Sin respuesta, el registro queda firme. Una objeción queda asentada junto al registro, pero no lo modifica ni obliga a Agentia a intervenir.

Artículo 20. Pago de honorarios. Los honorarios se pagan directamente entre los Miembros, dentro de los 10 días hábiles siguientes a que el Agente captador los perciba. Cada Miembro es responsable de facturar y tributar por sus propios honorarios. La distribución con la agencia de cada Miembro es ajena a Agentia.

CAPÍTULO VI. ACTUALIZACIÓN DE DATOS

Artículo 21. Cambios de estado. Toda reserva, venta o retiro debe registrarse dentro de las 48 horas de ocurrido.

Artículo 22. Reconfirmación. Cada propiedad del MLS debe reconfirmarse cada 30 días. Sin reconfirmación, la propiedad se oculta de la búsqueda de Miembros; si pasan 7 días más sin acción, se retira del MLS.

CAPÍTULO VII. AVISOS Y REGISTRO DE LA PLATAFORMA

Artículo 23. Avisos. La plataforma notifica automáticamente a cada Miembro afectado, en la pestaña Avisos de su panel y por correo electrónico, sobre la titularidad de los listados, los registros de compradores, las visitas, los cierres y los vencimientos. Cada Aviso indica la fecha y hora del hecho.

Artículo 24. Valor de los registros. Los Avisos y los registros de la plataforma dejan constancia de los hechos registrados, con su fecha y hora. No pueden modificarse ni eliminarse. Cada Miembro puede descargar un comprobante de cada Aviso para usarlo fuera de la plataforma.

Artículo 25. Consecuencias automáticas. El incumplimiento de los plazos de actualización implica el ocultamiento y posterior retiro automático de la propiedad, según el Artículo 22. No existen otras sanciones, salvo la baja por fraude prevista en el Artículo 6.

CAPÍTULO VIII. DESACUERDOS ENTRE MIEMBROS

Artículo 26. Reglas automáticas. La titularidad del listado, la prioridad del primer Registro de comprador, la Oferta de cooperación registrada y la firmeza del registro de cierre se aplican automáticamente y no son revisables por Agentia.

Artículo 27. Otros desacuerdos. Cualquier otro desacuerdo, como una operación cerrada por fuera de la plataforma o la falta de pago de honorarios, se resuelve directamente entre los Miembros, con la intervención de la asociación gremial que elijan o por vía judicial. Los Avisos y la Constancia de cooperación pueden presentarse como prueba.

Artículo 28. Límite de responsabilidad. Agentia no arbitra ni media entre Miembros, y no responde por montos adeudados entre ellos ni por sus decisiones o conductas.

CAPÍTULO IX. DATOS PERSONALES

Artículo 29. Datos de compradores y propietarios. Los datos de compradores y propietarios solo pueden usarse para la operación correspondiente. Se prohíbe copiarlos, venderlos o usarlos para otros fines.$reglamento$,
  now()
)
on conflict (version) do nothing;
