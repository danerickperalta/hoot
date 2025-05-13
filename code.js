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
figma.showUI(__html__, { width: 360, height: 300 });
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
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
        const results = [];
        // === Fill comparison
        if ("fills" in control && "fills" in reference) {
            const fillA = Array.isArray(control.fills) ? control.fills[0] : null;
            const fillB = Array.isArray(reference.fills) ? reference.fills[0] : null;
            if ((fillA === null || fillA === void 0 ? void 0 : fillA.type) === "SOLID" && (fillB === null || fillB === void 0 ? void 0 : fillB.type) === "SOLID") {
                const hexA = rgbToHex(fillA.color);
                const hexB = rgbToHex(fillB.color);
                const match = hexA === hexB;
                results.push({
                    prop: "fill",
                    match,
                    detail: `${hexA} vs ${hexB}`,
                    controlLayer: control.name,
                    referenceLayer: reference.name,
                    nodeId: reference.id
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
                detail: `Control: ${radiusA}, Ref: ${radiusB}`,
                controlLayer: control.name,
                referenceLayer: reference.name,
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
                referenceLayer: reference.name,
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
        try {
            // Using getNodeByIdAsync for dynamic-page document access
            const node = yield figma.getNodeByIdAsync(msg.nodeId);
            if (node && "visible" in node) {
                figma.currentPage.selection = [node];
                figma.viewport.scrollAndZoomIntoView([node]);
                figma.notify(`📍 Focused: ${node.name}`);
            }
            else {
                figma.notify("❌ Node not found or not focusable.");
            }
        }
        catch (error) {
            console.error("Error focusing node:", error);
            figma.notify("❌ Error focusing on node.");
        }
    }
});
