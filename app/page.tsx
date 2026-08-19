"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, MutableRefObject } from "react";
import de from "../locales/de.json";
import en from "../locales/en.json";
import bg from "../locales/bg.json";

type Language = "de" | "en" | "bg";
type FormStatus = "idle" | "processing" | "success";

const translations = { de, en, bg };
const FRAME_COUNT = 100;

function drawWrappedCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else line = candidate;
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
}

function Brand() {
  return (
    <span className="brand-lockup">
      <span className="brand-mark" aria-hidden="true"><i>S</i></span>
      <span>SiGa<span>2021</span></span>
    </span>
  );
}

function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [blackFrame, setBlackFrame] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let animation = 0;
    const tick = (time: number) => {
      const value = Math.min(100, Math.round(((time - start) / 1650) * 100));
      setProgress(value);
      if (value < 100) animation = requestAnimationFrame(tick);
      else {
        window.setTimeout(() => setBlackFrame(true), 230);
        window.setTimeout(onComplete, 620);
      }
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [onComplete]);

  return (
    <div className={`boot-screen ${blackFrame ? "is-black" : ""}`}>
      <div className="boot-center">
        <Brand />
        <span className="boot-label">Initializing system</span>
      </div>
      <div className="boot-wave boot-wave-violet" />
      <div className="boot-wave boot-wave-green" />
      <div className="boot-progress"><span>{progress}%</span><i style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

function drawEnergyWave(
  context: CanvasRenderingContext2D,
  width: number,
  time: number,
  y: number,
  color: string,
  offset: number,
  strength: number,
  alphaScale = 1,
) {
  context.save();
  context.globalCompositeOperation = "screen";
  context.lineCap = "round";
  for (let strand = 0; strand < 9; strand += 1) {
    context.beginPath();
    context.strokeStyle = color.replace("ALPHA", String((0.08 + strand * 0.022) * alphaScale));
    context.lineWidth = strand === 4 ? 1.45 : 0.55;
    context.shadowBlur = strand === 4 ? 17 : 7;
    context.shadowColor = color.replace("ALPHA", ".8");
    for (let x = -40; x <= width + 40; x += 8) {
      const phase = x * 0.011 + time * 0.0003 + offset + strand * 0.09;
      const secondary = x * 0.019 - time * 0.00017 + offset;
      const waveY = y + Math.sin(phase) * strength + Math.sin(secondary) * 13 + (strand - 4) * 2.1;
      if (x === -40) context.moveTo(x, waveY);
      else context.lineTo(x, waveY);
    }
    context.stroke();
  }
  context.restore();
}

function HeroCanvas({ request, reply }: { request: string; reply: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = new Image();
    image.src = "/assets/siga2021-master-clean.png";
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * ratio);
      canvas.height = Math.floor(canvas.clientHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const onPointer = (event: PointerEvent) => {
      pointerX += ((event.clientX / window.innerWidth - 0.5) * 14 - pointerX) * 0.2;
      pointerY += ((event.clientY / window.innerHeight - 0.5) * 9 - pointerY) * 0.2;
    };
    const draw = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);
      if (image.complete && image.naturalWidth) {
        const targetWidth = Math.min(width * 0.58, 790);
        const targetHeight = targetWidth * (392 / 545);
        const targetX = width * 0.42 + pointerX;
        const targetY = Math.max(18, height * 0.035) + pointerY;
        const sourceScale = targetWidth / 545;
        context.save();
        context.globalAlpha = 0.98;
        context.drawImage(image, 425, 0, 545, 392, targetX, targetY, targetWidth, targetHeight);
        context.restore();

        context.save();
        context.translate(targetX + 169 * sourceScale, targetY + 120 * sourceScale);
        context.rotate(0.075);
        context.fillStyle = "rgba(238,238,241,.92)";
        context.font = `${Math.max(8, 9.1 * sourceScale)}px Arial`;
        drawWrappedCanvasText(context, request, 0, 0, 132 * sourceScale, 11.3 * sourceScale, 4);
        context.fillStyle = "rgba(145,145,153,.78)";
        context.font = `${Math.max(6, 6 * sourceScale)}px monospace`;
        context.fillText("10:30", 115 * sourceScale, 49 * sourceScale);
        context.restore();

        context.save();
        context.translate(targetX + 186 * sourceScale, targetY + 213 * sourceScale);
        context.rotate(0.078);
        context.fillStyle = "rgba(247,242,255,.95)";
        context.font = `${Math.max(8, 8.8 * sourceScale)}px Arial`;
        drawWrappedCanvasText(context, reply, 0, 0, 127 * sourceScale, 10.7 * sourceScale, 4);
        context.restore();
      }
      drawEnergyWave(context, width, time, height * 0.64, "rgba(53,242,139,ALPHA)", 0, 41);
      drawEnergyWave(context, width, time, height * 0.7, "rgba(139,77,255,ALPHA)", 2.2, 35);
      context.save();
      context.globalCompositeOperation = "screen";
      for (let i = 0; i < 38; i += 1) {
        const x = (i * 97 + time * (0.007 + (i % 4) * 0.002)) % (width + 80) - 40;
        const y = height * 0.58 + Math.sin(i * 1.7 + time * 0.0003) * 108;
        context.fillStyle = i % 3 === 0 ? "rgba(82,255,148,.68)" : "rgba(166,107,255,.48)";
        context.beginPath();
        context.arc(x, y, i % 5 === 0 ? 1.5 : 0.7, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
      frame = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [request, reply]);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}

function FilmWaves({ canvasRef, progressRef }: { canvasRef: MutableRefObject<HTMLCanvasElement | null>; progressRef: MutableRefObject<number> }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let animation = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * ratio);
      canvas.height = Math.floor(canvas.clientHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const progress = progressRef.current;
      context.clearRect(0, 0, width, height);
      const violetAlpha = Math.max(0.12, Math.min(1, 1.25 - progress * 1.7));
      const greenAlpha = Math.max(0.08, Math.min(1, (progress - 0.32) * 1.9));
      drawEnergyWave(context, width, time + progress * 1600, height * 0.55, "rgba(139,77,255,ALPHA)", 1.1, 46, violetAlpha);
      drawEnergyWave(context, width, time - progress * 1200, height * 0.61, "rgba(53,242,139,ALPHA)", 3.5, 38, greenAlpha);
      if (progress > 0.42 && progress < 0.59) {
        drawEnergyWave(context, width, time, height * 0.58, "rgba(245,245,243,ALPHA)", 2.2, 24, 0.3);
      }
      animation = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    animation = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef, progressRef]);
  return null;
}

function CoreObject({ rotation }: { rotation: number }) {
  const transform = `rotateX(${-10 + Math.sin(rotation * 0.01) * 2}deg) rotateY(${rotation}deg)`;
  return (
    <div className="core-stage" aria-label="Rotating AI Decision Engine">
      <div className="core-orbit core-orbit-a" />
      <div className="core-orbit core-orbit-b" />
      <div className="core-cube" style={{ transform }}>
        {(["front", "back", "right", "left", "top", "bottom"] as const).map((face, index) => (
          <div className={`core-face core-${face}`} key={face}>
            <span>{index % 2 === 0 ? "AI" : "01"}</span>
            <i /><b />
          </div>
        ))}
      </div>
      <div className="core-floor" />
    </div>
  );
}

function SceneGraphic({ scene, copy, rotation }: { scene: number; copy: typeof de.film; rotation: number }) {
  const current = copy.scenes[scene];
  if (scene === 0 || scene === 6) {
    return (
      <div className={`scene-chat ${scene === 6 ? "confirmed" : ""}`}>
        <div className="scene-phone-top"><span className="phone-agent-dot" /> SiGa / AI Agent <i>•••</i></div>
        <div className="chat-bubble chat-request">{current.body}<small>10:30</small></div>
        <div className="chat-bubble chat-reply">{current.reply}<small>{scene === 6 ? "10:32" : "10:30"}</small></div>
      </div>
    );
  }
  if (scene === 1 || scene === 5) {
    const nodes = scene === 1 ? ["WhatsApp", "AI Agent", "Business data", "Calendar"] : ["Calendar", "CRM", "Confirmation", "WhatsApp"];
    return (
      <div className="workflow-track">
        {nodes.map((node, index) => <div className="workflow-node" key={node}><span>{index === nodes.length - 1 ? "✓" : String(index + 1).padStart(2, "0")}</span><b>{node}</b></div>)}
      </div>
    );
  }
  if (scene === 2) {
    return (
      <div className="core-scene">
        <CoreObject rotation={rotation} />
        <div className="core-decisions"><span>Understand<small>Anfrage verstehen</small></span><span>Decide<small>Beste Option wählen</small></span><span className="act">Act<small>Aktion ausführen</small></span></div>
      </div>
    );
  }
  if (scene === 3) {
    return (
      <div className="calendar-ui">
        <div className="calendar-top"><button aria-label="Vorheriger Monat">‹</button><span>Mai 2025</span><button aria-label="Nächster Monat">›</button></div>
        <div className="calendar-days"><b>MO</b><b>DI</b><b>MI</b><b>DO</b><b>FR</b><b>SA</b><b>SO</b>{Array.from({ length: 31 }, (_, index) => <span className={index + 1 === 14 ? "selected" : ""} key={index}>{index + 1}</span>)}</div>
        <div className="calendar-slot">14:30 <small>{current.body}</small></div>
      </div>
    );
  }
  return (
    <div className="booking-ui"><span className="booking-check">✓</span><strong>{current.title}</strong><small>{current.body}</small></div>
  );
}

function sceneFromFrame(frame: number) {
  if (frame <= 14) return 0;
  if (frame <= 28) return 1;
  if (frame <= 48) return 2;
  if (frame <= 63) return 3;
  if (frame <= 75) return 4;
  if (frame <= 86) return 5;
  return 6;
}

function FilmSequence({ copy }: { copy: typeof de.film }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const [activeScene, setActiveScene] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const frames = Array.from({ length: FRAME_COUNT }, (_, index) => {
      const image = new Image();
      image.decoding = "async";
      image.src = `/frames/main/frame-${String(index).padStart(3, "0")}.jpg`;
      image.onload = () => setLoaded((value) => Math.min(FRAME_COUNT, value + 1));
      return image;
    });
    framesRef.current = frames;
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let ticking = false;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * ratio);
      canvas.height = Math.floor(canvas.clientHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      update();
    };
    const renderFrame = (index: number, scene: number) => {
      const image = framesRef.current[index];
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#030304";
      context.fillRect(0, 0, width, height);
      if (!image?.complete || !image.naturalWidth) return;
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.globalAlpha = 0.68;
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      context.globalAlpha = 1;
      const frameX = (width - drawWidth) / 2;
      const frameY = (height - drawHeight) / 2;
      if (scene === 0) {
        context.save();
        context.translate(frameX + drawWidth * 0.343, frameY + drawHeight * 0.283);
        context.rotate(0.072);
        context.fillStyle = "rgba(239,239,242,.72)";
        context.font = `${Math.max(8, drawWidth * 0.0095)}px Arial`;
        drawWrappedCanvasText(context, copy.scenes[0].body, 0, 0, drawWidth * 0.108, drawWidth * 0.0115, 4);
        context.restore();
        context.save();
        context.translate(frameX + drawWidth * 0.359, frameY + drawHeight * 0.455);
        context.rotate(0.076);
        context.fillStyle = "rgba(247,242,255,.78)";
        context.font = `${Math.max(8, drawWidth * 0.0092)}px Arial`;
        drawWrappedCanvasText(context, copy.scenes[0].reply, 0, 0, drawWidth * 0.104, drawWidth * 0.0112, 4);
        context.restore();
      }
      if (scene === 6) {
        context.save();
        context.translate(frameX + drawWidth * 0.278, frameY + drawHeight * 0.255);
        context.rotate(0.07);
        context.fillStyle = "rgba(239,239,242,.76)";
        context.font = `${Math.max(8, drawWidth * 0.009)}px Arial`;
        drawWrappedCanvasText(context, copy.scenes[6].body, 0, 0, drawWidth * 0.105, drawWidth * 0.011, 5);
        context.restore();
      }
      const gradient = context.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(3,3,4,.92)");
      gradient.addColorStop(0.35, "rgba(3,3,4,.22)");
      gradient.addColorStop(0.72, "rgba(3,3,4,.18)");
      gradient.addColorStop(1, "rgba(3,3,4,.78)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    };
    const update = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      progressRef.current = progress;
      const frameIndex = Math.min(FRAME_COUNT - 1, Math.round(progress * (FRAME_COUNT - 1)));
      const scene = sceneFromFrame(frameIndex);
      renderFrame(frameIndex, scene);
      setActiveScene((value) => value === scene ? value : scene);
      setRotation(progress * 1080);
      setProgress(progress);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = window.setInterval(update, loaded < FRAME_COUNT ? 180 : 1000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [copy, loaded]);

  const current = copy.scenes[activeScene];
  return (
    <section className="film-section" id="experience" ref={sectionRef}>
      <div className="film-sticky">
        <canvas ref={canvasRef} className="film-canvas" aria-label="Scroll-gesteuerte SiGa2021 Filmsequenz" />
        <canvas ref={waveCanvasRef} className="film-wave-canvas" aria-hidden="true" />
        <FilmWaves canvasRef={waveCanvasRef} progressRef={progressRef} />
        <div className="film-vignette" />
        <div className="film-header shell">
          <span>{copy.eyebrow}</span>
          <strong>{copy.title}</strong>
        </div>
        <div className="film-status">
          <span>{current.number}</span>
          <div><b>{current.label}</b><small>{current.status}</small></div>
        </div>
        <div className="scene-graphic" key={`graphic-${activeScene}`}>
          <SceneGraphic scene={activeScene} copy={copy} rotation={rotation} />
        </div>
        <div className="film-copy shell" key={`copy-${activeScene}`}>
          <span>{current.number} / {current.label}</span>
          <h2>{current.title}</h2>
          <p>{activeScene === 0 || activeScene === 6 ? current.reply : current.body}</p>
        </div>
        <div className="film-progress">
          <span style={{ transform: `scaleX(${Math.max(progress, 0.012)})` }} />
          <small>{loaded < FRAME_COUNT ? `${Math.round((loaded / FRAME_COUNT) * 100)}%` : copy.hint}</small>
        </div>
      </div>
    </section>
  );
}

function FooterCore() {
  return <div className="final-core"><div className="final-core-inner">AI</div><i /><b /></div>;
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("de");
  const [booted, setBooted] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [legalOpen, setLegalOpen] = useState(false);
  const t = translations[language];

  useEffect(() => {
    const stored = window.localStorage.getItem("siga2021-language");
    if (stored === "de" || stored === "en" || stored === "bg") {
      window.queueMicrotask(() => setLanguage(stored));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("siga2021-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (next: Language) => {
    setLanguage(next);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus("processing");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, language }),
      });

      if (!response.ok) {
        throw new Error("Contact request failed");
      }

      setFormStatus("success");
      form.reset();
      window.setTimeout(() => setFormStatus("idle"), 3600);
    } catch {
      setFormStatus("idle");
    }
  };

  return (
    <main>
      {!booted && <BootSequence onComplete={() => setBooted(true)} />}
      <section className="hero" id="top">
        <HeroCanvas request={t.film.scenes[0].body} reply={t.film.scenes[0].reply} />
        <div className="page-noise" aria-hidden="true" />
        <nav className="nav shell" aria-label="Hauptnavigation">
          <a className="brand" href="#top" aria-label="SiGa2021 Startseite"><Brand /></a>
          <div className="nav-links">
            <a href="#leistungen">{t.nav.services}</a>
            <a href="#use-cases">{t.nav.useCases}</a>
            <a href="#experience">{t.nav.process}</a>
            <a href="#kontakt">{t.nav.contact}</a>
          </div>
          <div className="nav-actions">
            <div className="languages" aria-label="Sprache wählen">
              {(["de", "en", "bg"] as Language[]).map((item, index) => <span key={item}><button className={language === item ? "active" : ""} onClick={() => changeLanguage(item)} aria-pressed={language === item}>{item.toUpperCase()}</button>{index < 2 && <i />}</span>)}
            </div>
            <a className="nav-cta" href="#kontakt">{t.nav.cta} <span>↗</span></a>
          </div>
        </nav>
        <div className="hero-content shell">
          <div className="eyebrow">{t.hero.eyebrow}</div>
          <h1>{t.hero.line1}<br /><em>{t.hero.line2}</em></h1>
          <p>{t.hero.subtitle}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#kontakt">{t.hero.primary}<span>→</span></a>
            <a className="text-link" href="#experience">{t.hero.secondary}<span>↓</span></a>
          </div>
        </div>
        <div className="status-panel" aria-label="Systemstatus">
          <div className="status-number">01</div><div className="status-label">{t.hero.status}</div>
          <div className="status-line"><span /></div><small>{t.hero.listening}</small>
        </div>
        <div className="hero-footer shell"><span>Violet = Intelligence</span><span className="scroll-prompt">Scroll to enter the system <b>↓</b></span><span>Green = Action</span></div>
      </section>

      <FilmSequence copy={t.film} />

      <section className="services section-shell" id="leistungen">
        <div className="section-kicker"><span>{t.services.eyebrow}</span><i /></div>
        <div className="services-heading"><h2>{t.services.title}</h2><p>THINK <b>→</b> DECIDE <b>→</b> ACT</p></div>
        <div className="service-list">
          {t.services.items.map((service) => (
            <article className="service-row" key={service.number}>
              <span className="service-number">{service.number}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <div className="service-tags">{service.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <span className="service-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="audience" id="zielgruppen">
        <div className="audience-glow" />
        <div className="section-shell audience-grid">
          <div><div className="section-kicker"><span>{t.audience.eyebrow}</span><i /></div><h2>{t.audience.title}</h2><p>{t.audience.examples}</p></div>
          <ol>{t.audience.items.map((item, index) => <li key={item}><span>0{index + 1}</span><strong>{item}</strong><i>→</i></li>)}</ol>
        </div>
      </section>

      <section className="cases section-shell" id="use-cases">
        <div className="section-kicker"><span>{t.cases.eyebrow}</span><i /></div>
        <h2>{t.cases.title}</h2>
        <div className="case-list">
          {t.cases.items.map((item, index) => <article key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.flow}</p><i>↗</i></article>)}
        </div>
      </section>

      <section className="contact" id="kontakt">
        <div className="contact-wave contact-wave-violet" /><div className="contact-wave contact-wave-green" />
        <div className="section-shell contact-grid">
          <div className="contact-copy">
            <div className="section-kicker"><span>{t.contact.eyebrow}</span><i /></div>
            <h2>{t.contact.title}</h2><p>{t.contact.intro}</p>
            <div className="automation-path"><span>Form</span><b>→</b><span>AI</span><b>→</b><span>CRM</span><b>→</b><span>Follow-up</span></div>
          </div>
          <form className={`contact-form ${formStatus}`} onSubmit={submitForm} data-automation="n8n-lead-intake">
            <label><span>{t.contact.name}</span><input name="name" required autoComplete="name" /></label>
            <label><span>{t.contact.company}</span><input name="company" autoComplete="organization" /></label>
            <label><span>{t.contact.email}</span><input name="email" type="email" required autoComplete="email" /></label>
            <label><span>{t.contact.topic}</span><select name="topic" required defaultValue=""><option value="" disabled>{t.contact.topic}</option>{t.contact.options.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label className="full"><span>{t.contact.message}</span><textarea name="message" rows={5} required /></label>
            <button className="form-submit full" type="submit" disabled={formStatus === "processing"}>
              {formStatus === "processing" ? t.contact.processing : formStatus === "success" ? t.contact.success : t.contact.submit}<span>{formStatus === "success" ? "✓" : "→"}</span>
            </button>
          </form>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-wave final-wave-left" /><div className="final-wave final-wave-right" />
        <FooterCore />
        <div className="final-content"><span>{t.final.eyebrow}</span><h2>{t.final.title1}<br /><em>{t.final.title2}</em></h2><div><a className="button button-primary" href="#kontakt">{t.final.primary}<b>→</b></a><a className="button button-ghost" href="#kontakt">{t.final.secondary}<b>↗</b></a></div></div>
      </section>

      <footer className="footer section-shell">
        <div><Brand /><p>{t.footer.claim}</p></div>
        <nav><a href="#leistungen">{t.nav.services}</a><a href="#use-cases">{t.nav.useCases}</a><a href="#experience">{t.nav.process}</a><a href="#kontakt">{t.nav.contact}</a></nav>
        <div className="footer-legal"><button onClick={() => setLegalOpen(!legalOpen)}>{t.footer.imprint}</button><button onClick={() => setLegalOpen(!legalOpen)}>{t.footer.privacy}</button></div>
        {legalOpen && <div className="legal-note"><p>{t.footer.legal}</p><button onClick={() => setLegalOpen(false)} aria-label="Schließen">×</button></div>}
        <small>© {new Date().getFullYear()} SiGa2021</small>
      </footer>
    </main>
  );
}
