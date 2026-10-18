import { PublicDocumentLayout } from '../components/legal/PublicDocumentLayout';
import { legalConfig } from '../lib/legal-config';

export function TermsPage() {
  return (
    <PublicDocumentLayout
      title="Condiciones de uso"
      intro={`Condiciones del servicio Comidas ofrecido por ${legalConfig.operator}. Actualizadas el ${legalConfig.lastUpdated}.`}
    >
      <section>
        <h2>Uso del servicio</h2>
        <p>
          Comidas permite organizar recetas, menús, despensa, compras y objetivos nutricionales de un hogar. Debes facilitar datos correctos, proteger el acceso a tu cuenta y usar el servicio de forma lícita. No intentes acceder a hogares ajenos, eludir controles, automatizar solicitudes abusivas ni introducir contenido malicioso.
        </p>
      </section>

      <section>
        <h2>Hogares y enlaces compartidos</h2>
        <p>
          Las personas de un hogar pueden ver el contenido compartido según su rol. Quien administra el hogar es responsable de sus miembros. Los enlaces de listas funcionan como una llave: cualquier persona con el enlace puede acceder a esa lista, por lo que no debes publicarlo y debes revocarlo si se filtra.
        </p>
      </section>

      <section>
        <h2>Salud y calorías</h2>
        <p>
          El apartado de Salud es solo para personas adultas y ofrece estimaciones orientativas, no diagnóstico, tratamiento ni consejo médico. Las necesidades reales cambian por salud, medicación, embarazo, lactancia, composición corporal y otros factores. Los plazos de peso y las calorías de recetas son aproximaciones y no resultados garantizados.
        </p>
        <p>
          No uses un plan si provoca malestar ni para tratar una enfermedad o trastorno de la conducta alimentaria. Ante dudas, pérdidas de peso intensas o situaciones especiales, consulta a un profesional sanitario. La aplicación limita los objetivos que detecta como inseguros, pero ese control no sustituye una valoración individual.
        </p>
      </section>

      <section>
        <h2>Contenido e inteligencia artificial</h2>
        <p>
          Eres responsable del contenido que introduces y de comprobar que puedes usarlo. Las importaciones, sugerencias y estimaciones generadas o completadas mediante IA pueden contener errores. Revisa siempre ingredientes, alérgenos, cantidades, instrucciones y calorías antes de cocinar o tomar decisiones de salud.
        </p>
      </section>

      <section>
        <h2>Disponibilidad y cambios</h2>
        <p>
          El servicio puede interrumpirse por mantenimiento, fallos o causas externas. El responsable puede corregir, modificar o retirar funciones y actualizar estas condiciones, informando de los cambios relevantes mediante la aplicación cuando sea razonable.
        </p>
      </section>

      <section>
        <h2>Contacto</h2>
        <p>
          Para incidencias o consultas sobre estas condiciones, escribe a{' '}
          <a href={`mailto:${legalConfig.contact}`}>{legalConfig.contact}</a>.
        </p>
      </section>
    </PublicDocumentLayout>
  );
}
