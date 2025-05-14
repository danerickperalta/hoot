function rgbToHex(color: {r: number, g: number, b: number}): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}

// Check if a node is visible (including checking all parents)
function isNodeTrulyVisible(node: SceneNode): boolean {
  let currentNode: BaseNode | null = node;
  
  // Traverse up the tree to check if any parent is invisible
  while (currentNode) {
    // If this node has the 'visible' property and it's false, the node is invisible
    if ('visible' in currentNode && currentNode.visible === false) {
      return false;
    }
    
    // Move up to the parent
    currentNode = currentNode.parent;
  }
  
  // If we get here, all parents (and the node itself) are visible
  return true;
}

// Function to flatten node tree into a list of visible nodes including the node itself and all its descendants
function flattenNodeTree(node: SceneNode): SceneNode[] {
  // Start with an empty array
  let nodes: SceneNode[] = [];
  
  // Only include the current node if it's truly visible (including all parents)
  if (isNodeTrulyVisible(node)) {
    nodes.push(node);
    
    // If the node has children, add its visible descendants
    if ('children' in node) {
      const parentNode = node as ChildrenMixin & SceneNode;
      parentNode.children.forEach(child => {
        nodes = nodes.concat(flattenNodeTree(child));
      });
    }
  }
  
  return nodes;
}

// Get property value as a human-readable string
function getPropertyValue(node: SceneNode, propName: string): string {
  // Use type assertion to access dynamic properties
  const nodeAny = node as any;
  
  if (!(propName in nodeAny)) return "N/A";
  
  const value = nodeAny[propName];
  
  // Handle specific property types
  if (propName === "fills" || propName === "strokes") {
    if (!Array.isArray(value) || value.length === 0) return "None";
    
    const solidItems = value.filter((item: any) => item.type === "SOLID");
    if (solidItems.length === 0) return value[0].type;
    
    return rgbToHex(solidItems[0].color);
  }
  
  if (propName === "characters" && typeof value === "string") {
    if (value.length > 20) {
      return `"${value.substring(0, 20)}..."`;
    }
    return `"${value}"`;
  }
  
  return String(value);
}

// Compare nodes dynamically by their common properties
function compareNodesProperties(controlNode: SceneNode, referenceNode: SceneNode): any[] {
  const nodeResults: any[] = [];
  const propertiesToCompare = [
    // Appearance
    "fills", "strokes", "strokeWeight", "cornerRadius", "opacity",
    // Text
    "characters", "fontSize", "fontName", "letterSpacing", "lineHeight", "textCase",
    // Layout
    "layoutMode", "primaryAxisAlignItems", "counterAxisAlignItems", "paddingLeft", "paddingRight", 
    "paddingTop", "paddingBottom", "itemSpacing",
    // Effects
    "effects",
    // Constraints
    "constraints"
  ];
  
  // Only compare properties that exist on both nodes
  for (const prop of propertiesToCompare) {
    if (prop in (controlNode as any) && prop in (referenceNode as any)) {
      // For complex properties, use the custom conversion function
      const controlValue = getPropertyValue(controlNode, prop);
      const referenceValue = getPropertyValue(referenceNode, prop);
      
      // Only add to results if the values are not both "N/A"
      if (controlValue !== "N/A" || referenceValue !== "N/A") {
        const match = controlValue === referenceValue;
        
        nodeResults.push({
          prop: prop,
          match: match,
          detail: `${controlValue} vs ${referenceValue}`,
          controlLayer: controlNode.name,
          referenceLayer: referenceNode.name,
          nodeId: referenceNode.id
        });
      }
    }
  }
  
  return nodeResults;
}

figma.showUI(__html__, { width: 450, height: 600 });

figma.ui.onmessage = async (msg) => {
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
    const allResults: any[] = [];
    
    // Flatten both node trees (only including truly visible nodes)
    const controlNodes = flattenNodeTree(control);
    const referenceNodes = flattenNodeTree(reference);
    
    console.log(`Found ${controlNodes.length} truly visible control nodes and ${referenceNodes.length} truly visible reference nodes`);
    
    // Create a map of reference nodes by name for quick lookups
    const referenceNodesByName: Record<string, SceneNode[]> = {};
    
    referenceNodes.forEach(refNode => {
      if (!referenceNodesByName[refNode.name]) {
        referenceNodesByName[refNode.name] = [];
      }
      referenceNodesByName[refNode.name].push(refNode);
    });
    
    // Compare each control node with its matching reference node(s) by name
    controlNodes.forEach(controlNode => {
      // Skip nodes that are not truly visible (including checking parent visibility)
      if (!isNodeTrulyVisible(controlNode)) return;
      
      const matchingRefNodes = referenceNodesByName[controlNode.name] || [];
      
      // If we found matching name(s), compare properties
      if (matchingRefNodes.length > 0) {
        // Only use truly visible reference nodes
        const visibleRefNodes = matchingRefNodes.filter(refNode => isNodeTrulyVisible(refNode));
        
        if (visibleRefNodes.length > 0) {
          // Use the first visible match
          const referenceNode = visibleRefNodes[0];
          
          // Compare all properties dynamically
          const comparisonResults = compareNodesProperties(controlNode, referenceNode);
          
          // Only add results that have actual properties to compare (not empty)
          if (comparisonResults.length > 0) {
            allResults.push(...comparisonResults);
          }
        }
      }
    });

    // Send results to UI
    figma.ui.postMessage({
      type: "scan-complete",
      payload: [
        {
          name: reference.name,
          results: allResults
        }
      ]
    });

    console.log("🚀 Sending payload:", JSON.stringify(allResults, null, 2));
    figma.notify(`✅ Scan complete! Found ${allResults.length} comparison results across ${controlNodes.length} truly visible layers.`);
  }

  if (msg.type === "close-plugin") {
    figma.closePlugin();
  }

  if (msg.type === "focus-node" && msg.nodeId) {
    try {
      // Using getNodeByIdAsync for dynamic-page document access
      const node = await figma.getNodeByIdAsync(msg.nodeId);
      
      if (node && isNodeTrulyVisible(node as SceneNode)) {
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.notify(`📍 Focused: ${node.name}`);
      } else {
        figma.notify("❌ Node not found or not visible.");
      }
    } catch (error) {
      console.error("Error focusing node:", error);
      figma.notify("❌ Error focusing on node.");
    }
  }
};