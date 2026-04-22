import powerbi from "powerbi-visuals-api";

export class MapLoader {
  private host: powerbi.extensibility.visual.IVisualHost;

  constructor(host: powerbi.extensibility.visual.IVisualHost) {
    this.host = host;
  }

  render(container: HTMLElement): void {
    // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "add-map-wrapper";

    const btn = document.createElement("button");
    btn.className = "add-map-btn";
    btn.textContent = "+ Add Map";
    btn.addEventListener("click", () => this.openFilePicker());

    const hint = document.createElement("p");
    hint.className = "add-map-hint";
    hint.textContent = "Importe um SVG criado no Synoptic Designer";

    wrapper.appendChild(btn);
    wrapper.appendChild(hint);
    container.appendChild(wrapper);
  }

  private openFilePicker(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,image/svg+xml";

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const svgText = ev.target?.result as string;
        if (!svgText?.includes("<svg")) {
          alert("Arquivo inválido. Selecione um SVG gerado pelo Synoptic Designer.");
          return;
        }
        this.host.persistProperties({
          merge: [
            {
              objectName: "mapSettings",
              selector: null,
              properties: { svgContent: svgText },
            },
          ],
        });
      };
      reader.readAsText(file);
    });

    input.click();
  }
}
