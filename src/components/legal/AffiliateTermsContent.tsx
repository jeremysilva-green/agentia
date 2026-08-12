export function AffiliateTermsContent({ date }: { date: string }) {
  return (
    <div className="flex flex-col gap-4 text-sm text-slate-600">
      <div>
        <h2 className="text-base font-semibold text-prussian">Términos y Condiciones para Afiliados</h2>
        <p className="mt-1 text-xs text-slate-400">Última actualización: {date}</p>
      </div>

      <p>
        Al registrarse como <strong>Afiliado</strong> en <strong>AGENTIA</strong>, el usuario declara
        haber leído, comprendido y aceptado íntegramente los presentes Términos y Condiciones.
      </p>

      <section>
        <h3 className="font-semibold text-slate-800">1. Función del Afiliado</h3>
        <p className="mt-1">
          El Afiliado es un usuario independiente que participa voluntariamente en la promoción de
          propiedades publicadas en la plataforma por Agentes registrados.
        </p>
        <p className="mt-2">
          El Afiliado podrá seleccionar propiedades disponibles y generar enlaces únicos de
          promoción para compartirlos a través de sus canales de comunicación y redes de contacto.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">2. Derecho a comisión</h3>
        <p className="mt-1">
          Cuando una propiedad sea vendida como resultado de la promoción o referencia realizada
          mediante el enlace único asignado al Afiliado, el Afiliado tendrá derecho a recibir una
          comisión equivalente al <strong>1% (uno por ciento)</strong> del valor total de la
          operación de compraventa, conforme a los presentes términos.
        </p>
        <p className="mt-2">
          El Agente responsable de la propiedad será quien deba reconocer y pagar directamente dicha
          comisión al Afiliado.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">3. Registro y respaldo de la actividad</h3>
        <p className="mt-1">
          AGENTIA podrá registrar y conservar información relacionada con los enlaces generados,
          visitas, contactos, referencias y demás actividades realizadas dentro de la plataforma.
        </p>
        <p className="mt-2">
          Estos registros podrán utilizarse como elementos de respaldo para determinar la
          participación de un Afiliado en una operación, sin perjuicio de otros medios de prueba que
          puedan existir.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">4. Obligación del Agente</h3>
        <p className="mt-1">
          El Agente tiene la obligación de actuar de buena fe, proporcionar información veraz y
          reconocer la participación del Afiliado cuando una venta se concrete como consecuencia de
          su promoción o referencia.
        </p>
        <p className="mt-2">
          El Agente no podrá ocultar, negar o desviar deliberadamente una operación con el objetivo
          de evitar el pago de la comisión correspondiente al Afiliado.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">5. Incumplimiento del Agente</h3>
        <p className="mt-1">
          En caso de que el Agente no reconozca o no pague la comisión correspondiente, el Afiliado
          podrá presentar un reclamo ante AGENTIA, proporcionando la información y documentación
          disponible sobre la operación.
        </p>
        <p className="mt-2">
          La plataforma podrá revisar los registros disponibles y, cuando corresponda, comunicarse
          con el Agente para solicitar aclaraciones o facilitar la resolución del conflicto.
        </p>
        <p className="mt-2">
          Si el incumplimiento persiste, la plataforma podrá{" "}
          <strong>suspender o cancelar la cuenta del Agente</strong>, de acuerdo con sus políticas
          internas, sin perjuicio del derecho del Afiliado de ejercer por su propia cuenta las
          acciones legales que considere correspondientes para reclamar el pago de la comisión y,
          cuando corresponda, los daños y perjuicios derivados del incumplimiento.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">6. Limitación de responsabilidad de la plataforma</h3>
        <p className="mt-1">
          El Afiliado reconoce que <strong>AGENTIA actúa como plataforma tecnológica y no como
          garante del pago de las comisiones generadas por los Agentes</strong>.
        </p>
        <p className="mt-2">
          La obligación de pagar el 1% corresponde exclusivamente al Agente responsable de la
          propiedad y de la operación realizada.
        </p>
        <p className="mt-2">
          La plataforma no está obligada a adelantar, cubrir, sustituir ni garantizar con fondos
          propios ninguna comisión adeudada por un Agente.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">7. Conducta del Afiliado</h3>
        <p className="mt-1">
          El Afiliado deberá promocionar las propiedades de manera responsable, utilizando
          información proporcionada por la plataforma o por el Agente y evitando realizar
          afirmaciones falsas, engañosas o no autorizadas sobre las propiedades.
        </p>
        <p className="mt-2">
          El Afiliado no podrá modificar deliberadamente las condiciones comerciales de una propiedad
          ni atribuirse la representación legal o comercial del Agente o del propietario sin
          autorización expresa.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">8. Aceptación</h3>
        <p className="mt-1">
          Al seleccionar &quot;Acepto los Términos y Condiciones&quot; y completar el registro, el
          Afiliado declara que acepta estas condiciones y reconoce sus derechos y obligaciones dentro
          de la plataforma.
        </p>
      </section>
    </div>
  );
}
