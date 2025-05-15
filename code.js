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
// Evaluate typography harmony
function evaluateTypographyHarmony(node, pattern) {
    // Only apply to text nodes
    if (node.type !== 'TEXT')
        return 50;
    const textNode = node;
    let score = 0;
    let checks = 0;
    // Check font family
    if (textNode.fontName) {
        const fontFamily = textNode.fontName.family;
        const fontStyle = textNode.fontName.style;
        // Calculate total fonts used
        const fontValues = Object.values(pattern.fontFamilies);
        const totalFonts = fontValues.length > 0
            ? fontValues.reduce((a, b) => a + b, 0)
            : 0;
        if (totalFonts > 0 && pattern.fontFamilies[fontFamily]) {
            // Score based on how common this font is
            const frequency = pattern.fontFamilies[fontFamily] / totalFonts;
            score += Math.round(frequency * 100);
        }
        else {
            score += 0; // Using an unfamiliar font scores poorly
        }
        checks++;
        // Check font style
        const styleValues = Object.values(pattern.fontStyles);
        const totalStyles = styleValues.length > 0
            ? styleValues.reduce((a, b) => a + b, 0)
            : 0;
        if (totalStyles > 0 && pattern.fontStyles[fontStyle]) {
            const frequency = pattern.fontStyles[fontStyle] / totalStyles;
            score += Math.round(frequency * 100);
        }
        else {
            score += 30; // Using an unfamiliar style scores poorly but not as bad as font family
        }
        checks++;
    }
    // Check font size
    if (textNode.fontSize) {
        const fontSize = textNode.fontSize;
        // Check if the exact font size is used elsewhere
        if (pattern.fontSizeRange.sizes.includes(fontSize)) {
            score += 100;
        }
        else if (fontSize >= pattern.fontSizeRange.min && fontSize <= pattern.fontSizeRange.max) {
            // Within range but not exact match
            score += 80;
        }
        else {
            // Outside the range
            const distanceOutside = fontSize < pattern.fontSizeRange.min
                ? pattern.fontSizeRange.min - fontSize
                : fontSize - pattern.fontSizeRange.max;
            const rangeSize = pattern.fontSizeRange.max - pattern.fontSizeRange.min;
            const adjustedRangeSize = rangeSize === 0 ? 1 : rangeSize;
            score += Math.max(0, 100 - (distanceOutside / (adjustedRangeSize * 0.5)) * 100);
        }
        checks++;
    }
    // Check line height
    if (textNode.lineHeight && typeof textNode.lineHeight === 'object' && 'value' in textNode.lineHeight) {
        const lineHeight = textNode.lineHeight.value;
        if (lineHeight >= pattern.lineHeightRange.min && lineHeight <= pattern.lineHeightRange.max) {
            score += 100;
        }
        else {
            // Calculate distance outside range
            const distanceOutside = lineHeight < pattern.lineHeightRange.min
                ? pattern.lineHeightRange.min - lineHeight
                : lineHeight - pattern.lineHeightRange.max;
            const rangeSize = pattern.lineHeightRange.max - pattern.lineHeightRange.min;
            const adjustedRangeSize = rangeSize === 0 ? 1 : rangeSize;
            score += Math.max(0, 100 - (distanceOutside / (adjustedRangeSize * 0.5)) * 100);
        }
        checks++;
    }
    // Return average score - FIXED with if/else and intermediate variable
    if (checks > 0) {
        const result = Math.round(score / checks);
        return result;
    }
    else {
        return 50;
    }
}
// Evaluate shape harmony
function evaluateShapeHarmony(node, pattern) {
    const nodeAny = node;
    let score = 0;
    let checks = 0;
    // Check corner radius
    if ('cornerRadius' in nodeAny && typeof nodeAny.cornerRadius === 'number') {
        const radius = nodeAny.cornerRadius;
        // Check if this exact radius is used elsewhere
        if (pattern.cornerRadiusRange.values.includes(radius)) {
            score += 100;
        }
        else if (radius >= pattern.cornerRadiusRange.min && radius <= pattern.cornerRadiusRange.max) {
            // Within range but not exact match
            score += 80;
        }
        else {
            // Outside range
            const distanceOutside = radius < pattern.cornerRadiusRange.min
                ? pattern.cornerRadiusRange.min - radius
                : radius - pattern.cornerRadiusRange.max;
            const rangeSize = Math.max(1, pattern.cornerRadiusRange.max - pattern.cornerRadiusRange.min);
            score += Math.max(0, 100 - (distanceOutside / rangeSize) * 100);
        }
        checks++;
    }
    // Check aspect ratio
    if ('width' in nodeAny && 'height' in nodeAny && nodeAny.height !== 0) {
        const aspectRatio = nodeAny.width / nodeAny.height;
        if (aspectRatio >= pattern.aspectRatioRange.min && aspectRatio <= pattern.aspectRatioRange.max) {
            score += 100;
        }
        else {
            // Calculate how far outside the range
            const distanceOutside = aspectRatio < pattern.aspectRatioRange.min
                ? pattern.aspectRatioRange.min - aspectRatio
                : aspectRatio - pattern.aspectRatioRange.max;
            const rangeSize = pattern.aspectRatioRange.max - pattern.aspectRatioRange.min;
            const adjustedRangeSize = rangeSize === 0 ? 1 : rangeSize;
            score += Math.max(0, 100 - (distanceOutside / (adjustedRangeSize * 0.5)) * 100);
        }
        checks++;
    }
    // Check stroke weight
    if ('strokeWeight' in nodeAny && typeof nodeAny.strokeWeight === 'number') {
        const weight = nodeAny.strokeWeight;
        if (weight >= pattern.strokeWeightRange.min && weight <= pattern.strokeWeightRange.max) {
            score += 100;
        }
        else {
            const distanceOutside = weight < pattern.strokeWeightRange.min
                ? pattern.strokeWeightRange.min - weight
                : weight - pattern.strokeWeightRange.max;
            const rangeSize = Math.max(1, pattern.strokeWeightRange.max - pattern.strokeWeightRange.min);
            score += Math.max(0, 100 - (distanceOutside / rangeSize) * 100);
        }
        checks++;
    }
    // Return average score - FIXED with if/else and intermediate variable
    if (checks > 0) {
        const result = Math.round(score / checks);
        return result;
    }
    else {
        return 50;
    }
}
// Generate insights based on score
function generateInsights(node, pattern, scores) {
    const insights = [];
    const componentType = pattern.name;
    // Color insights
    if (scores.colorScore < 50) {
        insights.push(`This ${componentType}'s colors differ significantly from your design system's color palette.`);
    }
    else if (scores.colorScore < 80) {
        insights.push(`Consider adjusting this ${componentType}'s colors to better match your design system.`);
    }
    // Spacing insights
    if (scores.spacingScore < 60) {
        insights.push(`The spacing used in this ${componentType} is inconsistent with your design system patterns.`);
    }
    // Typography insights
    if (node.type === 'TEXT' && scores.typographyScore < 70) {
        insights.push(`The typography in this ${componentType} doesn't follow your established font patterns.`);
    }
    // Shape insights
    if ('cornerRadius' in node && scores.shapeScore < 70) {
        insights.push(`This ${componentType}'s shape properties (like corner radius) differ from your design system.`);
    }
    // Overall fit
    if (scores.colorScore + scores.spacingScore + scores.typographyScore + scores.shapeScore >= 320) {
        insights.push(`Overall, this ${componentType} has excellent design harmony with your system.`);
    }
    else if (scores.colorScore + scores.spacingScore + scores.typographyScore + scores.shapeScore >= 240) {
        insights.push(`This ${componentType} fits well within your design system with minor adjustments.`);
    }
    else {
        insights.push(`This ${componentType} needs significant adjustments to match your design system patterns.`);
    }
    return insights;
}
// Function to generate placeholder harmony scores when no matching pattern exists
function generatePlaceholderHarmonyScore(node) {
    const componentType = detectComponentType(node);
    return {
        componentType,
        controlLayer: 'Design System',
        referenceLayer: node.name,
        nodeId: node.id,
        harmony: {
            colorScore: 50,
            spacingScore: 50,
            typographyScore: 50,
            shapeScore: 50,
            overallScore: 50
        },
        insights: [
            `No existing ${componentType} patterns found in your design system.`,
            `This ${componentType} will establish a new pattern in your system.`
        ]
    };
}
figma.showUI(__html__, { width: 450, height: 600 });
// Store the selected component type filter
let selectedComponentTypeFilter = null;
// Store the current mode (Compliance or Harmony)
let currentMode = "compliance";
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === "set-control") {
        // In Harmony mode, extract patterns from the control selection
        if (currentMode === "harmony") {
            const selection = figma.currentPage.selection;
            if (selection.length === 0) {
                figma.notify("❌ Please select at least one node to use as control.");
                return;
            }
            // Flatten all selected nodes to get a comprehensive library
            let allNodes = [];
            selection.forEach(node => {
                allNodes = allNodes.concat(flattenNodeTree(node));
            });
            // Extract style patterns from all visible nodes
            extractStylePatterns(allNodes);
            figma.notify(`✅ Style patterns extracted from ${allNodes.length} control nodes.`);
        }
        else {
            figma.notify("✅ Control node selected");
        }
    }
    if (msg.type === "set-references") {
        figma.notify("✅ Reference nodes selected");
    }
    if (msg.type === "set-mode") {
        currentMode = msg.mode;
        figma.notify(`Mode set to: ${currentMode === "compliance" ? "Compliance Check" : "Design Harmony"}`);
        // Clear style patterns when switching to harmony mode
        if (currentMode === "harmony") {
            stylePatterns.clear();
        }
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
        // Different handling based on mode
        if (currentMode === "compliance") {
            // Compliance mode - traditional node-to-node comparison
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
                        // Compare all properties dynamically
                        const comparisonResults = compareNodesProperties(controlNode, referenceNode, selectedComponentTypeFilter);
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
            figma.notify(`✅ Scan complete! Found ${allResults.length} property comparisons across ${nodeCount} visible ${componentTypeText}.`);
        }
        else if (currentMode === "harmony") {
            // Harmony mode - pattern-based style evaluation
            // First check if we have extracted patterns
            if (stylePatterns.size === 0) {
                figma.notify("❌ Please set a control first to extract style patterns.");
                return;
            }
            const selection = figma.currentPage.selection;
            if (selection.length === 0) {
                figma.notify("❌ Please select at least one node to evaluate.");
                return;
            }
            const allResults = [];
            // Flatten all selected reference nodes
            let referenceNodes = [];
            selection.forEach(node => {
                referenceNodes = referenceNodes.concat(flattenNodeTree(node));
            });
            // Filter by component type if needed
            if (selectedComponentTypeFilter) {
                referenceNodes = referenceNodes.filter(node => detectComponentType(node) === selectedComponentTypeFilter);
            }
            // Evaluate each reference node against the extracted patterns
            referenceNodes.forEach(node => {
                if (!isNodeTrulyVisible(node))
                    return;
                const harmonyResult = evaluateComponentHarmony(node);
                if (harmonyResult) {
                    allResults.push(harmonyResult);
                }
            });
            // Send results to UI
            figma.ui.postMessage({
                type: "scan-complete",
                mode: currentMode,
                componentTypeFilter: selectedComponentTypeFilter,
                payload: [
                    {
                        name: "Style Harmony Analysis",
                        results: allResults
                    }
                ]
            });
            console.log("🚀 Sending harmony payload:", JSON.stringify(allResults, null, 2));
            const componentTypeText = selectedComponentTypeFilter
                ? `${selectedComponentTypeFilter} components`
                : "components";
            figma.notify(`✅ Style harmony analysis complete! Evaluated ${allResults.length} ${componentTypeText}.`);
        }
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
