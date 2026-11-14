// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";

afterEach(cleanup);

const options = [
  { value: "bueno", label: "Bueno" },
  { value: "regular", label: "Regular" },
  { value: "dificil", label: "Difícil" },
];

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="¿Borrar?">
        <p>Contenido</p>
      </Dialog>
    </>
  );
}

describe("Button", () => {
  it("mide al menos 48 px y es type=button por defecto", () => {
    render(<Button>Guardar</Button>);
    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button.classList.contains("min-h-12")).toBe(true);
    expect(button.classList.contains("min-w-12")).toBe(true);
    expect(button.getAttribute("type")).toBe("button");
    expect(button.hasAttribute("aria-busy")).toBe(false);
  });

  it("con pending queda ocupado y deshabilitado", () => {
    render(<Button pending>Guardar</Button>);
    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("cada variante conserva el tamaño mínimo", () => {
    for (const variant of [
      "primary",
      "secondary",
      "danger",
      "ghost",
    ] as const) {
      const { unmount } = render(<Button variant={variant}>Acción</Button>);
      const button = screen.getByRole("button", { name: "Acción" });
      expect(button.classList.contains("min-h-12")).toBe(true);
      expect(button.classList.contains("min-w-12")).toBe(true);
      unmount();
    }
  });
});

describe("Field", () => {
  it("asocia la etiqueta con el control", () => {
    render(<Field id="nombre" label="Nombre o apodo" />);
    const input = screen.getByLabelText("Nombre o apodo");
    expect(input.id).toBe("nombre");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("con error marca el control y lo enlaza a un role=alert", () => {
    render(
      <Field
        id="nombre"
        label="Nombre o apodo"
        hint="Como le dices tú."
        error="Escribe un nombre."
      />,
    );
    const input = screen.getByLabelText("Nombre o apodo");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("Escribe un nombre.");
    const describedBy = input.getAttribute("aria-describedby")?.split(" ");
    expect(describedBy).toContain(alert.id);
    expect(document.querySelector('label[for="nombre"]')).not.toBeNull();
  });

  it("también sirve para textarea y select", () => {
    render(
      <>
        <Field as="textarea" id="nota" label="Nota" />
        <Field as="select" id="tipo" label="Tipo">
          <option value="a">A</option>
        </Field>
      </>,
    );
    expect(screen.getByLabelText("Nota").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Tipo").tagName).toBe("SELECT");
  });
});

describe("ChoiceGroup", () => {
  it("una respuesta: fieldset con legend y tres radios con nombre", () => {
    render(
      <ChoiceGroup
        name="dia"
        legend="¿Cómo fue el día?"
        options={options}
        value={[]}
        onChange={() => {}}
      />,
    );
    const group = screen.getByRole("group", { name: "¿Cómo fue el día?" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group.querySelector("legend")?.textContent).toBe(
      "¿Cómo fue el día?",
    );
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    for (const option of options) {
      expect(screen.getByRole("radio", { name: option.label })).toBeTruthy();
    }
  });

  it("multiple: tres casillas con nombre", () => {
    render(
      <ChoiceGroup
        name="animo"
        legend="¿Cómo estuvo?"
        options={options}
        multiple
        value={[]}
        onChange={() => {}}
      />,
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    for (const option of options) {
      expect(screen.getByRole("checkbox", { name: option.label })).toBeTruthy();
    }
  });

  it("avisa el cambio: reemplaza con radio y acumula con casillas", () => {
    const single = vi.fn();
    const { unmount } = render(
      <ChoiceGroup
        name="dia"
        legend="Día"
        options={options}
        value={["bueno"]}
        onChange={single}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Regular" }));
    expect(single).toHaveBeenCalledWith(["regular"]);
    unmount();

    const multi = vi.fn();
    render(
      <ChoiceGroup
        name="animo"
        legend="Ánimo"
        options={options}
        multiple
        value={["bueno"]}
        onChange={multi}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Regular" }));
    expect(multi).toHaveBeenCalledWith(["bueno", "regular"]);
  });
});

describe("Dialog", () => {
  it("al abrir expone su título y un botón Cerrar; al cerrar devuelve el foco", () => {
    render(<DialogHarness />);
    const trigger = screen.getByRole("button", { name: "Abrir" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = document.querySelector("dialog");
    expect(dialog?.open).toBe(true);
    const labelledBy = dialog?.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy ?? "")?.textContent).toBe(
      "¿Borrar?",
    );

    const close = screen.getByRole("button", { name: "Cerrar" });
    fireEvent.click(close);
    expect(dialog?.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
});
