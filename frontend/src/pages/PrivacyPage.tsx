import { PublicDocumentLayout } from '../components/legal/PublicDocumentLayout';
import { legalConfig } from '../lib/legal-config';

export function PrivacyPage() {
  return (
    <PublicDocumentLayout
      title="Privacidad"
      intro={`Información sobre cómo ${legalConfig.operator} trata los datos usados por Comidas. Actualizada el ${legalConfig.lastUpdated}.`}
    >
      <section>
        <h2>Responsable y contacto</h2>
        <p>Responsable: {legalConfig.operator}.</p>
        <p>
          Para consultas de privacidad o para ejercer tus derechos, escribe a{' '}
          <a href={`mailto:${legalConfig.contact}`}>{legalConfig.contact}</a>.
        </p>
      </section>

      <section>
        <h2>Datos y finalidades</h2>
        <ul>
          <li>Cuenta: nombre, correo y contraseña protegida mediante hash, para registrarte y autenticarte.</li>
          <li>Contenido del hogar: miembros, recetas, menús, favoritos, despensa y listas, para prestar las funciones que solicitas y compartirlas con tu hogar.</li>
          <li>Datos técnicos y registros limitados, como dirección IP y errores, para seguridad, prevención de abuso y diagnóstico.</li>
          <li>Datos de Salud (edad, sexo, altura, peso y objetivos): se guardan solo en el almacenamiento local de tu navegador y se separan por cuenta. No se envían al servidor de Comidas.</li>
        </ul>
        <p>La base del tratamiento es prestar el servicio solicitado. La protección del sistema y la prevención del fraude se realizan por el interés legítimo del responsable en mantener el servicio seguro.</p>
      </section>

      <section>
        <h2>IA e importación de recetas</h2>
        <p>
          Si el responsable ha configurado Gemini y usas una función de IA, Comidas envía a Google el texto culinario necesario: contenido extraído de la página para completar una importación, o título, ingredientes y raciones para estimar calorías. No se incluye tu correo ni tu perfil de Salud. No uses estas funciones con datos personales o confidenciales.
        </p>
      </section>

      <section>
        <h2>Conservación y destinatarios</h2>
        <p>
          Los datos de cuenta y del hogar se conservan mientras exista la cuenta o el hogar correspondiente. Al borrar la cuenta se eliminan sus datos personales activos; una copia puede permanecer hasta 30 días en copias de seguridad. Los registros técnicos rotan por tamaño. Los proveedores de alojamiento, base de datos y copias de seguridad pueden tratar datos siguiendo instrucciones del responsable. Google solo recibe los datos indicados cuando se utiliza una función de IA configurada.
        </p>
      </section>

      <section>
        <h2>Compartir, cookies y almacenamiento local</h2>
        <p>
          Una lista compartida es accesible para cualquiera que posea su enlace secreto; revoca el enlace cuando deje de ser necesario. Comidas utiliza una cookie técnica de sesión, HttpOnly y de hasta siete días, necesaria para mantener la autenticación. No utiliza cookies publicitarias ni analíticas. El navegador también guarda preferencias y los datos locales de Salud.
        </p>
      </section>

      <section>
        <h2>Tus opciones y derechos</h2>
        <p>
          Puedes corregir datos disponibles en la aplicación, cambiar tu contraseña, borrar datos de Salud desde el navegador y eliminar tu cuenta desde Ajustes. También puedes solicitar acceso, rectificación, supresión, limitación, oposición o portabilidad escribiendo al contacto anterior. Si consideras que el tratamiento no es correcto, puedes reclamar ante la autoridad de protección de datos competente.
        </p>
      </section>
    </PublicDocumentLayout>
  );
}
