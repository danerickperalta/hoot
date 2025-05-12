figma.showUI(__html__, { width: 360, height: 300 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "set-control") {
    figma.notify("✅ Control node selected");
  }

  if (msg.type === "set-references") {
    figma.notify("✅ Reference nodes selected");
  }

  if (msg.type === "run-scan") {
    figma.notify("🦉 Running scan...");
  }

  if (msg.type === "close-plugin") {
    figma.closePlugin();
  }
};
