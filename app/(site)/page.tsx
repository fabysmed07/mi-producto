import CtaLink from '@/components/CtaLink';
import FeedbackForm from '@/components/FeedbackForm';
import RoutineWidget from '@/components/RoutineWidget';
import { RoutineProvider } from '@/components/RoutineContext';
import SignupForm from '@/components/SignupForm';

const BrandMark = () => (
  <span className="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--paper)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16.5" cy="4.6" r="1.9" fill="var(--paper)" stroke="none" />
      <path d="M15 8.5C9 9 8 12 12 13.2C16 14.4 15 18 8.5 19.5" />
    </svg>
  </span>
);

export default function Home() {
  return (
    <RoutineProvider>
      <header className="nav">
        <div className="nav-inner">
          <div className="brand"><BrandMark />Soltura</div>
          <nav className="links">
            <a href="#por-que">Por qué seis minutos</a>
            <a href="#no-hace">Lo que no hace</a>
          </nav>
          <CtaLink className="btn" hideWhileHeroVisible>Empezar mi rutina</CtaLink>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Movilidad de escritorio</span>
            <h1>Date seis minutos. Tu cuerpo lo va a notar.</h1>
            <p className="hero-sub">No tienes que hacer más ejercicio ni ser constante a la perfección. Solo regálate una pausa para volver a sentirte suelto, de pie o en tu silla. Con tu ropa de trabajo, sin equipo, sin cambiarte.</p>
            <div className="hero-cta">
              <CtaLink className="btn">Empezar mi rutina</CtaLink>
              <span className="cta-note">Sin cuenta ni descarga. Se hace aquí mismo.</span>
            </div>
          </div>

          <RoutineWidget />
        </div>
      </section>

      <section className="essay" id="por-que">
        <div className="essay-num">6</div>
        <div className="prose-wrap">
          <span className="eyebrow">Por qué seis minutos</span>
          <p className="lead">La mayoría de los programas de movilidad fallan por exceso.</p>
          <p className="body-text">Piden veinte minutos, un tapete, ropa deportiva y un momento del día que nadie tiene.</p>
          <p className="pull">El cuerpo no necesita esa ceremonia: necesita frecuencia.</p>
          <p className="body-text">Una articulación que se mueve a su rango completo con frecuencia mantiene mucho más que una que recibe una sesión heroica los domingos y nada el resto de la semana.</p>
          <p className="body-text">Seis minutos no es una cifra de marketing, es el punto donde la rutina deja de negociarse. Por debajo de diez minutos, la decisión de hacerla ya no compite con la comida, el transporte ni la junta siguiente.</p>
          <p className="body-text">Seis minutos es una sesión, no un límite. Puedes hacerla a media mañana, después de comer y otra vez antes de cerrar la laptop. Tú decides cuántas.</p>
          <p className="closing">Sabemos que no es lo óptimo. Es lo que se sostiene, y lo que se sostiene siempre le gana a lo óptimo abandonado en la semana tres.</p>
        </div>
      </section>

      <section className="essay" id="no-hace">
        <div className="prose-wrap">
          <span className="eyebrow">Lo que Soltura no hace</span>
          <p className="lead">No cuenta calorías, no mide tu progreso contra el de nadie, no te castiga por faltar.</p>
          <p className="body-text">No hay rachas que perder, porque una racha rota es la razón número uno por la que la gente desinstala una app de hábitos.</p>
          <div className="callout">
            <span className="mark">⚑</span>
            <span>Tampoco trata lesiones. Si tienes dolor agudo, irradiado o entumecimiento, lo que necesitas es un fisioterapeuta — no una app.</span>
          </div>
          <p className="closing">Soltura hace una sola cosa —devolverle rango a un cuerpo que pasa el día quieto— y prefiere hacerla bien a hacer diez a medias.</p>
        </div>
      </section>

      <section className="final-cta">
        <div className="wrap">
          <h2>Seis minutos cada vez que los necesites. Empieza cuando quieras.</h2>
          <p>Sin tapete, sin ropa deportiva, sin ceremonia.</p>
          <div className="hero-cta">
            <CtaLink className="btn">Empezar mi rutina</CtaLink>
          </div>

          <div className="waitlist">
            <p className="waitlist-note">¿Quieres que te avisemos cuando haya novedades?</p>
            <SignupForm />
          </div>
        </div>
      </section>

      <section className="essay" id="opiniones">
        <div className="prose-wrap">
          <span className="eyebrow">Cuéntanos qué piensas</span>
          <p className="lead">¿Probaste la rutina? Nos ayuda saber qué te pareció.</p>
          <FeedbackForm />
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="brand"><BrandMark />Soltura</div>
          <div>Rutinas de movilidad de seis minutos para quien pasa ocho horas sentado.</div>
          <div className="fine">Soltura no sustituye el ejercicio ni el consejo médico profesional.</div>
        </div>
      </footer>
    </RoutineProvider>
  );
}
