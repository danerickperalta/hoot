figma.showUI(__html__, { width: 360, height: 300 });
let controlNode = null;
let referenceNodes = [];

function flattenNodeTree(node) {
    let nodes = [];
  
    // Skip any node that's hidden
    if ("visible" in node && !node.visible) {
      return nodes;
    }
  
    // If it's a text node, return directly
    if (node.type === "TEXT") {
      nodes.push(node);
      return nodes;
    }
  
    // Recurse into children if available
    if ("children" in node) {
      for (let child of node.children) {
        nodes = nodes.concat(flattenNodeTree(child));
      }
    } else {
      nodes.push(node);
    }
  
    return nodes;
  }   
  
figma.ui.onmessage = (msg) => {
    if (msg.type === "set-control") {
        const selection = figma.currentPage.selection;
        if (selection.length !== 1) {
          figma.notify("❌ Please select exactly ONE Control node.");
        } else {
          controlNode = selection[0];
          console.log("✅ Control set:", controlNode.name);
          figma.notify("✅ Control node set: " + controlNode.name);
        }
      }
      
      if (msg.type === "set-references") {
        const selection = figma.currentPage.selection;
        if (selection.length < 1) {
          figma.notify("❌ Please select one or more Reference nodes.");
        } else {
          referenceNodes = selection;
          console.log("✅ Reference selections set:", referenceNodes.map(n => n.name));
          figma.notify(`✅ ${referenceNodes.length} Reference node(s) set.`);
        }
      }
      

      if (msg.type === "run-scan") {
        if (!controlNode || referenceNodes.length === 0) {
          figma.notify("⚠️ Set both Control and Reference nodes first.");
          return;
        }
      
        const controlChildren = flattenNodeTree(controlNode);
        const scanResults = []; // ✅ Declare the array to store results
      
        figma.notify(`📦 Scanning ${referenceNodes.length} references...`);
      
        for (let ref of referenceNodes) {
          const refChildren = flattenNodeTree(ref);
          const pairCount = Math.min(controlChildren.length, refChildren.length);
          const results = [];
      
          console.log(`🔍 Comparing: ${ref.name}`);
      
          for (let i = 0; i < pairCount; i++) {
            const c = controlChildren[i];
            const r = refChildren[i];
      
            console.log(`  ➤ Pair ${i}: ${c.type} vs ${r.type}`);
      
            if ("fills" in c && "fills" in r) {
              const fillA = Array.isArray(c.fills) ? c.fills[0] : null;
              const fillB = Array.isArray(r.fills) ? r.fills[0] : null;
      
              if (fillA && fillB && fillA.type === "SOLID" && fillB.type === "SOLID") {
                const same = JSON.stringify(fillA.color) === JSON.stringify(fillB.color);
                results.push({
                  prop: "fill",
                  match: same,
                  detail: same ? "Matched fill color" : "Different fill color",
                  controlLayer: c.name,
  referenceLayer: r.name
                });
              }
            }
      
            if ("cornerRadius" in c && "cornerRadius" in r) {
              const same = c.cornerRadius === r.cornerRadius;
              results.push({
                prop: "cornerRadius",
                match: same,
                detail: same ? "Matched corner radius" : `Control: ${c.cornerRadius}, Ref: ${r.cornerRadius}`,
                controlLayer: c.name,
  referenceLayer: r.name
              });
            }
      
            if (c.type === "TEXT" && r.type === "TEXT") {
              const sameText = c.characters === r.characters;
              results.push({
                prop: "text",
                match: sameText,
                detail: sameText ? "Matched text" : `Control: "${c.characters}", Ref: "${r.characters}"`,
                controlLayer: c.name,
  referenceLayer: r.name
              });
            }
          }
      
          scanResults.push({
            name: ref.name,
            results: results
          });
        }
      
        // ✅ Now it's safe to post
        figma.ui.postMessage({
          type: "scan-complete",
          payload: scanResults
        });
      
        figma.notify("🦉 Scan complete — results sent to UI.");
      }      
  

  if (msg.type === "close-plugin") {
    figma.closePlugin();
  }
};
