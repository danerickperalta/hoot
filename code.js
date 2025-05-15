"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function rgbToHex(color) {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .toUpperCase()}`;
}
// Component type definitions
const COMPONENT_TYPES = [
    {
        name: "Input Field",
        nodeTypes: ["FRAME", "RECTANGLE", "TEXT"],
        namePatterns: ["input", "field", "text field", "textarea"],
        propertiesToCompare: [
            "fills", "strokes", "cornerRadius", "characters",
            "fontSize", "padding", "layoutMode"
        ]
    },
    {
        name: "Button",
        nodeTypes: ["INSTANCE", "FRAME", "RECTANGLE", "TEXT"],
        namePatterns: ["button", "btn", "cta"],
        propertiesToCompare: [
            "fills", "strokes", "cornerRadius", "characters",
            "fontSize", "effects", "padding"
        ]
    },
    {
        name: "Icon",
        nodeTypes: ["VECTOR", "FRAME", "INSTANCE"],
        namePatterns: ["icon", "glyph", "symbol"],
        propertiesToCompare: [
            "fills", "strokes", "strokeWeight", "opacity", "effects"
        ]
    },
    {
        name: "Card",
        nodeTypes: ["FRAME", "COMPONENT", "INSTANCE"],
        namePatterns: ["card", "tile", "container"],
        propertiesToCompare: [
            "fills", "strokes", "cornerRadius", "effects",
            "layoutMode", "itemSpacing", "padding"
        ]
    },
    {
        name: "Typography",
        nodeTypes: ["TEXT"],
        namePatterns: ["text", "heading", "title", "label", "paragraph"],
        propertiesToCompare: [
            "characters", "fontSize", "fontName", "lineHeight",
            "letterSpacing", "textCase", "textDecoration"
        ]
    }
];
// Function to detect component type
function detectComponentType(node) {
    // Default to "Unknown"
    let detectedType = "Unknown";
    // Check each component type definition
    for (const componentType of COMPONENT_TYPES) {
        // Check if node type matches
        if (componentType.nodeTypes.includes(node.type)) {
            // Check if name contains any of the patterns
            const nodeName = node.name.toLowerCase();
            for (const pattern of componentType.namePatterns) {
                if (nodeName.includes(pattern.toLowerCase())) {
                    detectedType = componentType.name;
                    break;
                }
            }
            // If we found a match, stop checking
            if (detectedType !== "Unknown")
                break;
        }
    }
    return detectedType;
}
// Function to get properties to compare based on component type
function getPropertiesToCompare(componentType) {
    // Find the component type definition
    const typeDefinition = COMPONENT_TYPES.find(type => type.name === componentType);
    // If found, return its properties, otherwise return a default set
    return (typeDefinition === null || typeDefinition === void 0 ? void 0 : typeDefinition.propertiesToCompare) || [
        "fills", "strokes", "cornerRadius", "opacity",
        "characters", "fontSize", "effects"
    ];
}
// Check if a node is visible (including checking all parents)
function isNodeTrulyVisible(node) {
    let currentNode = node;
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
function flattenNodeTree(node) {
    // Start with an empty array
    let nodes = [];
    // Only include the current node if it's truly visible (including all parents)
    if (isNodeTrulyVisible(node)) {
        nodes.push(node);
        // If the node has children, add its visible descendants
        if ('children' in node) {
            const parentNode = node;
            parentNode.children.forEach(child => {
                nodes = nodes.concat(flattenNodeTree(child));
            });
        }
    }
    return nodes;
}
// Get property value as a human-readable string
function getPropertyValue(node, propName) {
    // Use type assertion to access dynamic properties
    const nodeAny = node;
    if (!(propName in nodeAny))
        return "N/A";
    const value = nodeAny[propName];
    // Handle specific property types
    if (propName === "fills" || propName === "strokes") {
        if (!Array.isArray(value) || value.length === 0)
            return "None";
        const solidItems = value.filter((item) => item.type === "SOLID");
        if (solidItems.length === 0)
            return value[0].type;
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
function compareNodesProperties(controlNode, referenceNode, selectedComponentType = null) {
    const nodeResults = [];
    // Determine which properties to compare based on component type
    let propertiesToCompare;
    if (selectedComponentType) {
        // If a component type is selected, use its properties
        propertiesToCompare = getPropertiesToCompare(selectedComponentType);
    }
    else {
        // Detect component type from the control node
        const detectedType = detectComponentType(controlNode);
        // If we detected a known type, use its properties, otherwise use default list
        propertiesToCompare = detectedType !== "Unknown"
            ? getPropertiesToCompare(detectedType)
            : [
                // Default properties to compare
                "fills", "strokes", "strokeWeight", "cornerRadius", "opacity",
                "characters", "fontSize", "fontName", "letterSpacing", "lineHeight", "textCase",
                "layoutMode", "primaryAxisAlignItems", "counterAxisAlignItems",
                "paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "itemSpacing",
                "effects", "constraints"
            ];
    }
    // Only compare properties that exist on both nodes
    for (const prop of propertiesToCompare) {
        if (prop in controlNode && prop in referenceNode) {
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
                    nodeId: referenceNode.id,
                    componentType: detectComponentType(controlNode)
                });
            }
        }
    }
    return nodeResults;
}
// Calculate a harmony score between two components
function calculateHarmonyScore(controlNode, referenceNode) {
    // In a real implementation, this would analyze design patterns and styles
    // For now, we'll provide a simplified placeholder implementation
    // Calculate color harmony
    let colorScore = 0;
    let colorCount = 0;
    // Calculate shape harmony
    let shapeScore = 0;
    let shapeCount = 0;
    // Calculate typography harmony
    let typographyScore = 0;
    let typographyCount = 0;
    // Calculate spacing harmony
    let spacingScore = 0;
    let spacingCount = 0;
    // Check various properties and compare for similarity
    const controlAny = controlNode;
    const referenceAny = referenceNode;
    // Color harmony - compare fills
    if ('fills' in controlAny && 'fills' in referenceAny) {
        const controlFills = Array.isArray(controlAny.fills) ? controlAny.fills : [];
        const referenceFills = Array.isArray(referenceAny.fills) ? referenceAny.fills : [];
        // Simple color comparison
        if (controlFills.length > 0 && referenceFills.length > 0) {
            const controlSolids = controlFills.filter((fill) => fill.type === 'SOLID');
            const referenceSolids = referenceFills.filter((fill) => fill.type === 'SOLID');
            if (controlSolids.length > 0 && referenceSolids.length > 0) {
                // For each control solid, find the closest reference solid
                controlSolids.forEach((controlSolid) => {
                    const controlHex = rgbToHex(controlSolid.color);
                    // Find best match
                    let bestMatchScore = 0;
                    referenceSolids.forEach((referenceSolid) => {
                        const referenceHex = rgbToHex(referenceSolid.color);
                        // Exact match gets perfect score
                        if (controlHex === referenceHex) {
                            bestMatchScore = 100;
                        }
                        else {
                            // Simple scoring - if not exact, but similar format, partial points
                            bestMatchScore = Math.max(bestMatchScore, 50);
                        }
                    });
                    colorScore += bestMatchScore;
                    colorCount++;
                });
            }
        }
    }
    // Shape harmony - compare corner radius and dimensions
    if ('cornerRadius' in controlAny && 'cornerRadius' in referenceAny) {
        const controlRadius = controlAny.cornerRadius;
        const referenceRadius = referenceAny.cornerRadius;
        // Calculate similarity - perfect match = 100, no match = 0
        const radiusDiff = Math.abs(controlRadius - referenceRadius);
        const maxRadius = Math.max(controlRadius, referenceRadius);
        if (maxRadius > 0) {
            shapeScore += 100 - Math.min(100, (radiusDiff / maxRadius) * 100);
        }
        else if (radiusDiff === 0) {
            shapeScore += 100;
        }
        shapeCount++;
    }
    // Typography harmony - compare text styles
    if (controlNode.type === 'TEXT' && referenceNode.type === 'TEXT') {
        const controlText = controlNode;
        const referenceText = referenceNode;
        // Compare font
        if (controlText.fontName && referenceText.fontName) {
            typographyScore += controlText.fontName.family === referenceText.fontName.family ? 100 : 0;
            typographyCount++;
            typographyScore += controlText.fontName.style === referenceText.fontName.style ? 100 : 0;
            typographyCount++;
        }
        // Compare size
        if (controlText.fontSize && referenceText.fontSize) {
            const sizeDiff = Math.abs(controlText.fontSize - referenceText.fontSize);
            const maxSize = Math.max(controlText.fontSize, referenceText.fontSize);
            typographyScore += 100 - Math.min(100, (sizeDiff / maxSize) * 100);
            typographyCount++;
        }
    }
    // Spacing harmony - compare layout properties
    const spacingProps = ['itemSpacing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'];
    spacingProps.forEach(prop => {
        if (prop in controlAny && prop in referenceAny) {
            const controlValue = controlAny[prop];
            const referenceValue = referenceAny[prop];
            if (typeof controlValue === 'number' && typeof referenceValue === 'number') {
                const diff = Math.abs(controlValue - referenceValue);
                const maxValue = Math.max(controlValue, referenceValue, 1); // Avoid division by zero
                spacingScore += 100 - Math.min(100, (diff / maxValue) * 100);
                spacingCount++;
            }
        }
    });
    // Calculate final scores
    const finalColorScore = colorCount > 0 ? Math.round(colorScore / colorCount) : 50;
    const finalShapeScore = shapeCount > 0 ? Math.round(shapeScore / shapeCount) : 50;
    const finalTypographyScore = typographyCount > 0 ? Math.round(typographyScore / typographyCount) : 50;
    const finalSpacingScore = spacingCount > 0 ? Math.round(spacingScore / spacingCount) : 50;
    // Overall score is weighted average of all categories
    const overallScore = Math.round((finalColorScore * 0.3) +
        (finalShapeScore * 0.3) +
        (finalTypographyScore * 0.2) +
        (finalSpacingScore * 0.2));
    return {
        colorScore: finalColorScore,
        shapeScore: finalShapeScore,
        typographyScore: finalTypographyScore,
        spacingScore: finalSpacingScore,
        overallScore: overallScore
    };
}
figma.showUI(__html__, { width: 450, height: 600 });
// Store the selected component type filter
let selectedComponentTypeFilter = null;
// Store the current mode (Compliance or Harmony)
let currentMode = "compliance";
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === "set-control") {
        figma.notify("✅ Control node selected");
    }
    if (msg.type === "set-references") {
        figma.notify("✅ Reference nodes selected");
    }
    if (msg.type === "set-mode") {
        currentMode = msg.mode;
        figma.notify(`Mode set to: ${currentMode === "compliance" ? "Compliance Check" : "Design Harmony"}`);
    }
    if (msg.type === "set-component-type-filter") {
        selectedComponentTypeFilter = msg.componentType;
        figma.notify(`Filter set to: ${selectedComponentTypeFilter || "All Components"}`);
    }
    if (msg.type === "get-component-types") {
        // Send the list of available component types to the UI
        figma.ui.postMessage({
            type: "component-types",
            componentTypes: COMPONENT_TYPES.map(type => type.name)
        });
    }
    if (msg.type === "run-scan") {
        const selection = figma.currentPage.selection;
        if (selection.length !== 2) {
            figma.notify("❌ Select exactly TWO nodes: a Control and a Reference.");
            return;
        }
        const [control, reference] = selection;
        const allResults = [];
        // Flatten both node trees (only including truly visible nodes)
        const controlNodes = flattenNodeTree(control);
        const referenceNodes = flattenNodeTree(reference);
        console.log(`Found ${controlNodes.length} truly visible control nodes and ${referenceNodes.length} truly visible reference nodes`);
        // Filter nodes by component type if a filter is selected
        let filteredControlNodes = controlNodes;
        if (selectedComponentTypeFilter) {
            filteredControlNodes = controlNodes.filter(node => detectComponentType(node) === selectedComponentTypeFilter);
            console.log(`Filtered to ${filteredControlNodes.length} ${selectedComponentTypeFilter} components`);
        }
        // Create a map of reference nodes by name for quick lookups
        const referenceNodesByName = {};
        referenceNodes.forEach(refNode => {
            // Also filter reference nodes by component type if needed
            if (selectedComponentTypeFilter && detectComponentType(refNode) !== selectedComponentTypeFilter) {
                return; // Skip this reference node if it doesn't match the filter
            }
            if (!referenceNodesByName[refNode.name]) {
                referenceNodesByName[refNode.name] = [];
            }
            referenceNodesByName[refNode.name].push(refNode);
        });
        // Compare each control node with its matching reference node(s) by name
        filteredControlNodes.forEach(controlNode => {
            // Skip nodes that are not truly visible (including checking parent visibility)
            if (!isNodeTrulyVisible(controlNode))
                return;
            const matchingRefNodes = referenceNodesByName[controlNode.name] || [];
            // If we found matching name(s), compare properties
            if (matchingRefNodes.length > 0) {
                // Only use truly visible reference nodes
                const visibleRefNodes = matchingRefNodes.filter(refNode => isNodeTrulyVisible(refNode));
                if (visibleRefNodes.length > 0) {
                    // Use the first visible match
                    const referenceNode = visibleRefNodes[0];
                    // If in compliance mode, do detailed property comparison
                    if (currentMode === "compliance") {
                        // Compare all properties dynamically
                        const comparisonResults = compareNodesProperties(controlNode, referenceNode, selectedComponentTypeFilter);
                        // Only add results that have actual properties to compare (not empty)
                        if (comparisonResults.length > 0) {
                            allResults.push(...comparisonResults);
                        }
                    }
                    // If in harmony mode, calculate design similarity scores
                    else if (currentMode === "harmony") {
                        const componentType = detectComponentType(controlNode);
                        const harmonyScore = calculateHarmonyScore(controlNode, referenceNode);
                        allResults.push({
                            componentType: componentType,
                            controlLayer: controlNode.name,
                            referenceLayer: referenceNode.name,
                            nodeId: referenceNode.id,
                            harmony: harmonyScore
                        });
                    }
                }
            }
        });
        // Send results to UI
        figma.ui.postMessage({
            type: "scan-complete",
            mode: currentMode,
            componentTypeFilter: selectedComponentTypeFilter,
            payload: [
                {
                    name: reference.name,
                    results: allResults
                }
            ]
        });
        console.log("🚀 Sending payload:", JSON.stringify(allResults, null, 2));
        const nodeCount = filteredControlNodes.length;
        const componentTypeText = selectedComponentTypeFilter
            ? `${selectedComponentTypeFilter} components`
            : "components";
        const modeText = currentMode === "compliance"
            ? `${allResults.length} property comparisons`
            : "harmony scores";
        figma.notify(`✅ Scan complete! Found ${modeText} across ${nodeCount} visible ${componentTypeText}.`);
    }
    if (msg.type === "close-plugin") {
        figma.closePlugin();
    }
    if (msg.type === "focus-node" && msg.nodeId) {
        try {
            // Using getNodeByIdAsync for dynamic-page document access
            const node = yield figma.getNodeByIdAsync(msg.nodeId);
            if (node && isNodeTrulyVisible(node)) {
                figma.currentPage.selection = [node];
                figma.viewport.scrollAndZoomIntoView([node]);
                figma.notify(`📍 Focused: ${node.name}`);
            }
            else {
                figma.notify("❌ Node not found or not visible.");
            }
        }
        catch (error) {
            console.error("Error focusing node:", error);
            figma.notify("❌ Error focusing on node.");
        }
    }
});
