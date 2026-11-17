"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export interface RespiroResource {
  id: string;
  name: string;
  phone: string | null;
  url: string | null;
}

export interface RespiroContact {
  id: string;
  name: string;
  phone: string;
}

const SECONDS = 60;
const LINK =
  "inline-flex min-h-12 items-center font-bold text-primary underline";

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Pausa breve con respiración, recursos verificados y contactos de emergencia. Sin animaciones. */
export function RespiroDialog({
  resources,
  contacts,
}: {
  resources: RespiroResource[];
  contacts: RespiroContact[];
}) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(SECONDS);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = window.setInterval(() => {
      setLeft((current) => current - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (running && left <= 0) {
      setRunning(false);
      setFinished(true);
    }
  }, [running, left]);

  function close() {
    setOpen(false);
    setRunning(false);
    setFinished(false);
    setLeft(SECONDS);
  }

  function start() {
    setFinished(false);
    setLeft(SECONDS);
    setRunning(true);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Necesito un respiro
      </Button>
      <Dialog open={open} onClose={close} title="Un respiro">
        <section
          aria-labelledby="respira-titulo"
          className="flex flex-col gap-2"
        >
          <h3 id="respira-titulo" className="text-xl font-bold">
            Respira un minuto
          </h3>
          <ol className="list-decimal pl-6">
            <li>Suelta los hombros y apoya los pies en el suelo.</li>
            <li>Inhala despacio por la nariz, contando hasta cuatro.</li>
            <li>Exhala lento por la boca, contando hasta seis.</li>
            <li>Repite a tu ritmo. No hay una forma correcta.</li>
          </ol>
          <p className="text-base text-fg-muted">
            El temporizador es opcional. Puedes respirar sin él.
          </p>
          {running ? (
            <p aria-live="off" className="text-lg font-bold">
              Quedan {Math.max(left, 0)} segundos
            </p>
          ) : (
            <Button variant="primary" onClick={start}>
              Empezar un minuto
            </Button>
          )}
          <div aria-live="polite">
            {finished ? (
              <p className="font-bold">Listo. Ya pasó un minuto.</p>
            ) : null}
          </div>
        </section>

        <section
          aria-labelledby="apoyos-titulo"
          className="flex flex-col gap-2"
        >
          <h3 id="apoyos-titulo" className="text-xl font-bold">
            Apoyos verificados
          </h3>
          {resources.length === 0 ? (
            <p>Estamos verificando los recursos. Vuelve pronto.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {resources.map((resource) => (
                <li key={resource.id} className="flex flex-col">
                  <span className="font-bold">{resource.name}</span>
                  {resource.phone ? (
                    <a href={telHref(resource.phone)} className={LINK}>
                      Llamar al {resource.phone}
                    </a>
                  ) : null}
                  {resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={LINK}
                    >
                      Ir al sitio de {resource.name}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {contacts.length > 0 ? (
          <section
            aria-labelledby="emergencia-titulo"
            className="flex flex-col gap-2"
          >
            <h3 id="emergencia-titulo" className="text-xl font-bold">
              Contactos de emergencia de tu círculo
            </h3>
            <ul className="flex flex-col gap-2">
              {contacts.map((contact) => (
                <li key={contact.id}>
                  <a href={telHref(contact.phone)} className={LINK}>
                    Llamar a {contact.name} ({contact.phone})
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Dialog>
    </>
  );
}
