export function AgentTermsContent({ date }: { date: string }) {
  return (
    <div className="flex flex-col gap-4 text-sm text-slate-600">
      <div>
        <h2 className="text-base font-semibold text-prussian">
          Términos y Condiciones para Agentes Inmobiliarios
        </h2>
        <p className="mt-1 text-xs text-slate-400">Última actualización: {date}</p>
      </div>

      <p>
        Al registrarse como <strong>Agente</strong> en <strong>AGENTIA</strong>, el usuario declara
        haber leído, comprendido y aceptado íntegramente los presentes Términos y Condiciones,
        comprometiéndose a cumplirlos de buena fe.
      </p>

      <section>
        <h3 className="font-semibold text-slate-800">1. Objeto de la plataforma</h3>
        <p className="mt-1">
          AGENTIA es una plataforma tecnológica que permite a los Agentes publicar y promocionar
          propiedades, gestionar oportunidades comerciales y utilizar herramientas digitales
          destinadas a facilitar y optimizar el proceso de venta inmobiliaria.
        </p>
        <p className="mt-2">
          La plataforma también permite que terceros registrados como Afiliados promocionen
          propiedades mediante enlaces únicos de seguimiento.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">2. Relación entre Agente y Afiliado</h3>
        <p className="mt-1">
          El Agente reconoce y acepta que, al publicar una propiedad en la plataforma y permitir su
          promoción mediante un enlace de Afiliado, asume la obligación de actuar con transparencia,
          buena fe y diligencia frente al Afiliado.
        </p>
        <p className="mt-2">
          El Agente deberá informar de manera veraz sobre el estado de la propiedad, disponibilidad,
          condiciones de venta y cualquier circunstancia relevante que pueda afectar la operación.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">3. Comisión del Afiliado</h3>
        <p className="mt-1">
          Cuando una propiedad publicada por el Agente sea vendida como resultado de la promoción,
          referencia o intervención de un Afiliado a través de su enlace único, el Agente se obliga a
          reconocer y pagar al Afiliado una comisión equivalente al{" "}
          <strong>1% (uno por ciento)</strong> del valor total de la operación de compraventa.
        </p>
        <p className="mt-2">
          El 1% se vuelve exigible una vez que la compraventa haya sido formalizada y el Agente haya
          recibido efectivamente su comisión.
        </p>
        <p className="mt-2">
          El Agente no podrá omitir, ocultar, alterar o negar una operación realizada como
          consecuencia de la intervención de un Afiliado con el propósito de evitar el pago de la
          comisión correspondiente.
        </p>
        <p className="mt-2">
          La comisión deberá ser pagada directamente por el Agente al Afiliado, dentro del plazo
          máximo de <strong>180 días hábiles</strong> contados desde la recepción del pago de la
          comisión inmobiliaria correspondiente a la operación, o desde la formalización de la venta,
          según corresponda.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">4. Responsabilidad del Agente</h3>
        <p className="mt-1">
          El Agente será el único responsable de cumplir con el pago de las comisiones que
          correspondan a los Afiliados.
        </p>
        <p className="mt-2">
          <strong>
            AGENTIA no es parte de la relación económica entre el Agente y el Afiliado, no recibe ni
            retiene la comisión del Afiliado y no asume responsabilidad por el incumplimiento de
            pago, retrasos, disputas o cualquier obligación económica derivada de dicha relación.
          </strong>
        </p>
        <p className="mt-2">
          No obstante, la plataforma podrá conservar registros de los enlaces, referencias, contactos
          y actividades realizadas dentro de la plataforma que puedan servir como evidencia de la
          actividad de un Afiliado.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">5. Incumplimiento</h3>
        <p className="mt-1">
          El incumplimiento de la obligación de pago de la comisión, la ocultación deliberada de una
          venta o cualquier conducta destinada a evadir el pago al Afiliado podrá resultar en la{" "}
          <strong>suspensión o cancelación de la cuenta del Agente</strong>, sin perjuicio del
          derecho del Afiliado a ejercer las acciones legales que considere correspondientes para
          reclamar las sumas adeudadas y, cuando corresponda, los daños y perjuicios derivados del
          incumplimiento.
        </p>
        <p className="mt-2">
          La plataforma podrá cooperar con las autoridades competentes o proporcionar información y
          registros disponibles cuando exista un requerimiento legal válido.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800">6. Aceptación</h3>
        <p className="mt-1">
          Al seleccionar &quot;Acepto los Términos y Condiciones&quot; y completar el registro, el
          Agente declara que acepta estas condiciones y se compromete a cumplirlas.
        </p>
      </section>
    </div>
  );
}
