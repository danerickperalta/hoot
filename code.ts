function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)  
    .toUpperCase()}`;
}

figma.showUI(__html__, { width: 360, height: 300 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "set-control") {
    figma.notify("✅ Control node selected");
  }

  if (msg.type === "set-references") {
    figma.notify("✅ Reference nodes selected");
  }

  if (msg.type === "run-scan") {
    const selection = figma.currentPage.selection;
    if (selection.length !== 2) {
      figma.notify("❌ Select exactly TWO nodes: a Control and a Reference.");
      return;
    }
  
    const [control, reference] = selection;
    const results: any[] = [];
  
    // === Fill comparison
    if ("fills" in control && "fills" in reference) {
      const fillA = Array.isArray(control.fills) ? control.fills[0] : null;
      const fillB = Array.isArray(reference.fills) ? reference.fills[0] : null;
  
      if (fillA?.type === "SOLID" && fillB?.type === "SOLID") {
        const hexA = `rgb(${Math.round(fillA.color.r * 255)}, ${Math.round(fillA.color.g * 255)}, ${Math.round(fillA.color.b * 255)})`;
        const hexB = `rgb(${Math.round(fillB.color.r * 255)}, ${Math.round(fillB.color.g * 255)}, ${Math.round(fillB.color.b * 255)})`;
        const match = hexA === hexB;

        results.push({
          prop: "fill",
          match,
          detail: `${hexA} vs ${hexB}`,
          controlLayer: control.name,
          nodeId: reference.id,
        });
      }
    }
  
    // === Corner radius comparison
    if ("cornerRadius" in control && "cornerRadius" in reference) {
      const radiusA = control.cornerRadius;
      const radiusB = reference.cornerRadius;
      const match = radiusA === radiusB;
  
      results.push({
        prop: "cornerRadius",
        match,
        detail: `${radiusA} vs ${radiusB}`,
        controlLayer: control.name,
        nodeId: reference.id
      });
    }
  
    // === Text content comparison
    if (control.type === "TEXT" && reference.type === "TEXT") {
      const textA = control.characters;
      const textB = reference.characters;
      const match = textA === textB;
  
      results.push({
        prop: "text",
        match,
        detail: `"${textA}" vs "${textB}"`,
        controlLayer: control.name,
        nodeId: reference.id
      });
    }
  
    // Send results to UI
    figma.ui.postMessage({
      type: "scan-complete",
      payload: [
        {
          name: reference.name,
          results
        }
      ]
    });
    console.log("🚀 Sending payload:", JSON.stringify(results, null, 2));
  
    figma.notify("✅ Scan complete!");
  }  

  if (msg.type === "close-plugin") {
    figma.closePlugin();
  }

  if (msg.type === "focus-node" && msg.nodeId) {
    const node = figma.getNodeById(msg.nodeId);
    if (node && "visible" in node) {
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
      figma.notify(`📍 Focused: ${node.name}`);
    } else {
      figma.notify("❌ Node not found or not focusable.");
    }
  }
  
};
