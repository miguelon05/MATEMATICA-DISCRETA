const treeArea = document.getElementById("treeArea");
const edgesLayer = document.getElementById("edgesLayer");
const notationSelect = document.getElementById("notationSelect");
const expressionText = document.getElementById("expressionText");
const resultText = document.getElementById("resultText");
const selectedHint = document.getElementById("selectedHint");
const nodeEditor = document.getElementById("nodeEditor");
const nodeType = document.getElementById("nodeType");
const nodeValue = document.getElementById("nodeValue");
const nodeOperator = document.getElementById("nodeOperator");
const derivativeVariable = document.getElementById("derivativeVariable");
const valueField = document.getElementById("valueField");
const operatorField = document.getElementById("operatorField");
const variableField = document.getElementById("variableField");
const addLeft = document.getElementById("addLeft");
const addRight = document.getElementById("addRight");
const removeNode = document.getElementById("removeNode");
const resetTree = document.getElementById("resetTree");
const centerTree = document.getElementById("centerTree");
const loadExample = document.getElementById("loadExample");

const appTitle = document.getElementById("appTitle");
const appSubtitle = document.getElementById("appSubtitle");
const tabButtons = document.querySelectorAll(".tab");
const treeView = document.getElementById("treeView");
const pathsView = document.getElementById("pathsView");

const graphArea = document.getElementById("graphArea");
const graphEdges = document.getElementById("graphEdges");
const graphHint = document.getElementById("graphHint");
const graphNodeEditor = document.getElementById("graphNodeEditor");
const graphNodeLabel = document.getElementById("graphNodeLabel");
const deleteGraphNode = document.getElementById("deleteGraphNode");
const graphEdgeEditor = document.getElementById("graphEdgeEditor");
const graphEdgeLabel = document.getElementById("graphEdgeLabel");
const graphEdgeWeight = document.getElementById("graphEdgeWeight");
const deleteGraphEdge = document.getElementById("deleteGraphEdge");
const edgeWeight = document.getElementById("edgeWeight");
const modeButtons = document.querySelectorAll(".mode-button");
const loadGraphExample = document.getElementById("loadGraphExample");
const centerGraph = document.getElementById("centerGraph");
const clearGraph = document.getElementById("clearGraph");
const algorithmSelect = document.getElementById("algorithmSelect");
const startNodeSelect = document.getElementById("startNodeSelect");
const endNodeSelect = document.getElementById("endNodeSelect");
const pathModeSelect = document.getElementById("pathModeSelect");
const runAlgorithm = document.getElementById("runAlgorithm");
const pathSummary = document.getElementById("pathSummary");
const pathsTable = document.getElementById("pathsTable");
const edgeList = document.getElementById("edgeList");
const stepsBox = document.getElementById("stepsBox");

const NODE_W = 58;
const NODE_H = 58;
const LEVEL_GAP = 105;
const LEAF_GAP = 70;
const GRAPH_NODE_SIZE = 58;
const INF = Number.POSITIVE_INFINITY;

let nextId = 1;
let root = null;
let selectedId = null;

let graphNextId = 1;
let graphNodes = [];
let graphEdgesData = [];
let graphMode = "create";
let selectedGraphNodeId = null;
let selectedGraphEdgeId = null;
let pendingEdgeFromId = null;
let highlightedEdgeIds = new Set();
let highlightedNodeIds = new Set();
let activeView = "tree";

function createNode(parentId = null) {
  return {
    id: nextId++,
    parentId,
    type: "value",
    value: String.fromCharCode(64 + Math.min(nextId - 1, 26)),
    operator: "+",
    variable: "x",
    left: null,
    right: null,
    x: 0,
    y: 0,
    width: LEAF_GAP,
  };
}

function valueNode(value) {
  const node = createNode(null);
  node.type = "value";
  node.value = value;
  return node;
}

function operationNode(operator, left, right = null) {
  const node = createNode(null);
  node.type = "operator";
  node.operator = operator;
  node.left = left;
  node.right = right;
  if (left) left.parentId = node.id;
  if (right) right.parentId = node.id;
  return node;
}

function loadDemoTree() {
  nextId = 1;
  root = operationNode(
    "*",
    operationNode(
      "+",
      operationNode("-", valueNode("A"), valueNode("B")),
      operationNode("+", valueNode("C"), valueNode("D")),
    ),
    operationNode(
      "/",
      valueNode("E"),
      operationNode("*", valueNode("F"), operationNode("+", valueNode("G"), valueNode("H"))),
    ),
  );
  selectedId = root.id;
  notationSelect.value = "infix";
  updateTree();
}

function operatorLabel(node) {
  if (node.type === "value") return node.value || "?";
  if (node.operator === "root") return "raiz";
  if (node.operator === "d") return `d/d${node.variable || "x"}`;
  return node.operator;
}

function operatorArity(node) {
  if (node.type !== "operator") return 0;
  if (node.operator === "!" || node.operator === "d") return 1;
  return 2;
}

function findNode(id, node = root) {
  if (!node) return null;
  if (node.id === id) return node;
  return findNode(id, node.left) || findNode(id, node.right);
}

function parentOf(id, node = root) {
  if (!node) return null;
  if ((node.left && node.left.id === id) || (node.right && node.right.id === id)) return node;
  return parentOf(id, node.left) || parentOf(id, node.right);
}

function measure(node) {
  if (!node) return 0;
  const leftWidth = measure(node.left);
  const rightWidth = measure(node.right);
  const childrenWidth = leftWidth + rightWidth + (leftWidth && rightWidth ? LEAF_GAP : 0);
  node.width = Math.max(LEAF_GAP, childrenWidth);
  return node.width;
}

function layout(node, left, depth) {
  if (!node) return;
  node.x = left + node.width / 2;
  node.y = 48 + depth * LEVEL_GAP;

  const leftWidth = node.left ? node.left.width : 0;
  const rightWidth = node.right ? node.right.width : 0;
  if (node.left && node.right) {
    layout(node.left, left, depth + 1);
    layout(node.right, left + leftWidth + LEAF_GAP, depth + 1);
  } else if (node.left) {
    layout(node.left, left + node.width / 2 - leftWidth / 2, depth + 1);
  } else if (node.right) {
    layout(node.right, left + node.width / 2 - rightWidth / 2, depth + 1);
  }
}

function maxDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}

function renderTree() {
  treeArea.innerHTML = "";
  edgesLayer.innerHTML = "";

  if (!root) {
    const button = document.createElement("button");
    button.className = "add-node root";
    button.type = "button";
    button.textContent = "+";
    button.title = "Crear raiz";
    button.addEventListener("click", () => {
      root = createNode(null);
      selectedId = root.id;
      updateTree();
    });
    treeArea.appendChild(button);
    updateEditor();
    updateOutput();
    return;
  }

  measure(root);
  const canvasWidth = Math.max(treeArea.clientWidth, root.width + 120);
  const canvasHeight = Math.max(treeArea.clientHeight, 110 + maxDepth(root) * LEVEL_GAP);
  treeArea.style.width = `${canvasWidth}px`;
  treeArea.style.height = `${canvasHeight}px`;
  edgesLayer.setAttribute("width", canvasWidth);
  edgesLayer.setAttribute("height", canvasHeight);
  edgesLayer.style.width = `${canvasWidth}px`;
  edgesLayer.style.height = `${canvasHeight}px`;
  layout(root, (canvasWidth - root.width) / 2, 0);

  drawEdges(root);
  drawNodes(root);
  updateEditor();
  updateOutput();
}

function drawEdges(node) {
  if (!node) return;
  [node.left, node.right].forEach((child) => {
    if (!child) return;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", node.x);
    line.setAttribute("y1", node.y + NODE_H / 2);
    line.setAttribute("x2", child.x);
    line.setAttribute("y2", child.y - NODE_H / 2);
    line.setAttribute("stroke", "#e03a22");
    line.setAttribute("stroke-width", "4");
    line.setAttribute("stroke-linecap", "round");
    edgesLayer.appendChild(line);
  });
  drawEdges(node.left);
  drawEdges(node.right);
}

function drawNodes(node) {
  if (!node) return;
  const element = document.createElement("button");
  element.className = `node ${node.id === selectedId ? "selected" : ""}`;
  element.type = "button";
  element.style.left = `${node.x - NODE_W / 2}px`;
  element.style.top = `${node.y - NODE_H / 2}px`;
  element.title = "Seleccionar nodo";
  element.innerHTML = `<span class="node-label">${escapeHtml(operatorLabel(node))}</span>`;
  element.addEventListener("click", () => {
    selectedId = node.id;
    updateTree();
  });
  treeArea.appendChild(element);

  drawAddButton(node, "left");
  if (operatorArity(node) !== 1) drawAddButton(node, "right");

  drawNodes(node.left);
  drawNodes(node.right);
}

function drawAddButton(node, side) {
  if (node[side]) return;
  const arity = operatorArity(node);
  if (node.type === "operator" && arity === 1 && side === "right") return;

  const button = document.createElement("button");
  button.className = "add-node";
  button.type = "button";
  button.textContent = "+";
  button.title = side === "left" ? "Agregar hijo izquierdo" : "Agregar hijo derecho";

  const offset = side === "left" ? -42 : 42;
  button.style.left = `${node.x + offset - 24}px`;
  button.style.top = `${node.y + 64}px`;
  button.addEventListener("click", () => {
    const child = createNode(node.id);
    node[side] = child;
    if (node.type === "value") node.type = "operator";
    selectedId = child.id;
    updateTree();
  });
  treeArea.appendChild(button);
}

function updateEditor() {
  const node = findNode(selectedId);
  if (!node) {
    selectedHint.textContent = root
      ? "Selecciona una bolita para editarla."
      : "Presiona el boton + para crear la primera bolita.";
    nodeEditor.classList.add("hidden");
    return;
  }

  selectedHint.textContent = `Editando nodo ${operatorLabel(node)}.`;
  nodeEditor.classList.remove("hidden");
  nodeType.value = node.type;
  nodeValue.value = node.value;
  nodeOperator.value = node.operator;
  derivativeVariable.value = node.variable;
  syncEditorVisibility();
  syncChildButtons();
}

function syncEditorVisibility() {
  const isOperator = nodeType.value === "operator";
  valueField.classList.toggle("hidden", isOperator);
  operatorField.classList.toggle("hidden", !isOperator);
  variableField.classList.toggle("hidden", !(isOperator && nodeOperator.value === "d"));
}

function syncChildButtons() {
  const node = findNode(selectedId);
  if (!node) return;
  const arity = operatorArity(node);
  addLeft.disabled = !!node.left;
  addRight.disabled = !!node.right || arity === 1;
}

function removeSelectedNode() {
  if (!selectedId || !root) return;
  if (root.id === selectedId) {
    root = null;
    selectedId = null;
    updateTree();
    return;
  }

  const parent = parentOf(selectedId);
  if (!parent) return;
  if (parent.left && parent.left.id === selectedId) parent.left = null;
  if (parent.right && parent.right.id === selectedId) parent.right = null;
  selectedId = parent.id;
  updateTree();
}

function expression(node, mode) {
  if (!node) return "?";
  if (node.type === "value") return node.value || "?";

  const left = expression(node.left, mode);
  const right = expression(node.right, mode);
  const op = node.operator;

  if (op === "!") {
    if (mode === "prefix") return `! ${left}`;
    if (mode === "postfix") return `${left} !`;
    return `(${left})!`;
  }

  if (op === "d") {
    const variable = node.variable || "x";
    if (mode === "prefix") return `d/d${variable} ${left}`;
    if (mode === "postfix") return `${left} d/d${variable}`;
    return `d/d${variable}(${left})`;
  }

  if (op === "root") {
    if (mode === "prefix") return `raiz ${left} ${right}`;
    if (mode === "postfix") return `${left} ${right} raiz`;
    return `${left} raiz ${right}`;
  }

  if (mode === "prefix") return `${op} ${left} ${right}`;
  if (mode === "postfix") return `${left} ${right} ${op}`;
  return `(${left} ${displayOp(op)} ${right})`;
}

function displayOp(op) {
  if (op === "*") return "*";
  if (op === "^") return "^";
  return op;
}

function evaluate(node) {
  if (!node) return { ok: false, text: "Falta completar un nodo." };
  if (node.type === "value") {
    const raw = (node.value || "").trim();
    const number = Number(raw);
    if (raw !== "" && Number.isFinite(number)) return { ok: true, value: number, text: String(number) };
    return { ok: false, text: `El valor "${raw || "?"}" no es numerico.` };
  }

  const left = evaluate(node.left);
  const right = evaluate(node.right);
  const op = node.operator;

  if (op === "d") {
    return { ok: false, text: derivative(node.left, node.variable || "x") };
  }

  if (!left.ok) return left;

  if (op === "!") {
    if (!Number.isInteger(left.value) || left.value < 0) {
      return { ok: false, text: "El factorial necesita un entero mayor o igual a 0." };
    }
    let total = 1;
    for (let i = 2; i <= left.value; i++) total *= i;
    return { ok: true, value: total, text: String(total) };
  }

  if (op === "root") {
    if (!right.ok) return right;
    const index = left.value;
    const radicand = right.value;
    if (!Number.isFinite(index) || index === 0) return { ok: false, text: "El indice de la raiz no es valido." };
    if (radicand < 0 && index % 2 === 0) return { ok: false, text: "Raiz par de numero negativo no es real." };
    const value = Math.sign(radicand) * Math.pow(Math.abs(radicand), 1 / index);
    return { ok: true, value, text: cleanNumber(value) };
  }

  if (!right.ok) return right;

  const a = left.value;
  const b = right.value;
  if (op === "+") return numeric(a + b);
  if (op === "-") return numeric(a - b);
  if (op === "*") return numeric(a * b);
  if (op === "/") return b === 0 ? { ok: false, text: "No se puede dividir entre 0." } : numeric(a / b);
  if (op === "^") return numeric(Math.pow(a, b));
  return { ok: false, text: "Operacion no reconocida." };
}

function numeric(value) {
  return Number.isFinite(value)
    ? { ok: true, value, text: cleanNumber(value) }
    : { ok: false, text: "El resultado no es un numero real valido." };
}

function cleanNumber(value) {
  return Number(value.toFixed(8)).toString();
}

function derivative(node, variable) {
  if (!node) return "Falta completar la expresion a derivar.";
  if (node.type === "value") {
    const raw = (node.value || "").trim();
    if (raw === variable) return "1";
    if (Number.isFinite(Number(raw))) return "0";
    return `d/d${variable}(${raw || "?"})`;
  }

  const left = expression(node.left, "infix");
  const right = expression(node.right, "infix");
  const dl = derivative(node.left, variable);
  const dr = derivative(node.right, variable);

  if (node.operator === "+") return `(${dl} + ${dr})`;
  if (node.operator === "-") return `(${dl} - ${dr})`;
  if (node.operator === "*") return `((${dl} * ${right}) + (${left} * ${dr}))`;
  if (node.operator === "/") return `(((${dl} * ${right}) - (${left} * ${dr})) / (${right} ^ 2))`;
  if (node.operator === "^" && node.right && node.right.type === "value" && Number.isFinite(Number(node.right.value))) {
    const n = Number(node.right.value);
    return `(${n} * (${left} ^ ${n - 1}) * ${dl})`;
  }
  return `d/d${variable}(${expression(node, "infix")})`;
}

function updateOutput() {
  if (!root) {
    expressionText.textContent = "Todavia no hay arbol.";
    resultText.textContent = "Crea nodos numericos para calcular.";
    return;
  }
  expressionText.textContent = expression(root, notationSelect.value);
  const result = evaluate(root);
  resultText.textContent = result.text;
}

function updateTree() {
  renderTree();
}

function setView(viewName) {
  activeView = viewName;
  const isTree = viewName === "tree";
  treeView.classList.toggle("active", isTree);
  pathsView.classList.toggle("active", !isTree);
  resetTree.classList.toggle("hidden", !isTree);
  appTitle.textContent = isTree ? "Arbol de expresiones" : "Recorridos";
  appSubtitle.textContent = isTree
    ? "Notacion polaca, usual y polaca inversa"
    : "Simulador de camino mas corto en digrafos ponderados";
  tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  if (!isTree) renderGraph();
}

function setGraphMode(mode) {
  graphMode = mode;
  pendingEdgeFromId = null;
  modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.graphMode === mode));
  if (mode === "create") graphHint.textContent = "Haz clic en cualquier lugar del lienzo para crear un nodo.";
  if (mode === "connect") graphHint.textContent = "Elige un nodo origen y luego un nodo destino. Se creara una flecha con el peso indicado.";
  if (mode === "move") graphHint.textContent = "Arrastra los nodos para acomodar el digrafo.";
  renderGraph();
}

function createGraphNode(x, y, label = null) {
  const id = graphNextId++;
  const node = {
    id,
    label: label || String(id),
    x: clamp(x, GRAPH_NODE_SIZE / 2, graphArea.clientWidth - GRAPH_NODE_SIZE / 2),
    y: clamp(y, GRAPH_NODE_SIZE / 2, graphArea.clientHeight - GRAPH_NODE_SIZE / 2),
  };
  graphNodes.push(node);
  selectedGraphNodeId = id;
  selectedGraphEdgeId = null;
  clearHighlights();
  renderGraph();
}

function addGraphEdge(fromId, toId, weight) {
  const parsedWeight = Number(weight);
  if (!Number.isFinite(parsedWeight) || parsedWeight < 0) {
    pathSummary.textContent = "El peso debe ser un numero mayor o igual a 0.";
    return false;
  }

  const existing = graphEdgesData.find((edge) => edge.fromId === fromId && edge.toId === toId);
  if (existing) {
    existing.weight = parsedWeight;
    selectedGraphEdgeId = existing.id;
  } else {
    const edge = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      fromId,
      toId,
      weight: parsedWeight,
    };
    graphEdgesData.push(edge);
    selectedGraphEdgeId = edge.id;
  }

  selectedGraphNodeId = null;
  clearHighlights();
  renderGraph();
  return true;
}

function graphPointFromEvent(event) {
  const rect = graphArea.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function renderGraph() {
  graphArea.innerHTML = "";
  graphEdges.innerHTML = "";
  ensureGraphSvgSize();
  drawGraphMarkers();
  drawGraphEdges();
  drawGraphNodes();
  updateGraphEditor();
  updateEdgeList();
  updateNodeSelectOptions();
}

function ensureGraphSvgSize() {
  const width = graphArea.offsetWidth || 1200;
  const height = graphArea.offsetHeight || 720;
  graphEdges.setAttribute("width", width);
  graphEdges.setAttribute("height", height);
  graphEdges.style.width = `${width}px`;
  graphEdges.style.height = `${height}px`;
}

function drawGraphMarkers() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", "arrowHead");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "3");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "strokeWidth");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M0,0 L0,6 L9,3 z");
  path.setAttribute("fill", "#334155");
  marker.appendChild(path);
  defs.appendChild(marker);
  graphEdges.appendChild(defs);
}

function drawGraphEdges() {
  graphEdgesData.forEach((edge) => {
    const from = getGraphNode(edge.fromId);
    const to = getGraphNode(edge.toId);
    if (!from || !to) return;

    const points = edgePoints(edge, from, to);
    const isSelected = edge.id === selectedGraphEdgeId;
    const isHighlighted = highlightedEdgeIds.has(edge.id);
    const strokeColor = isSelected ? "#e03a22" : isHighlighted ? "#16844a" : "#334155";
    const labelColor = isSelected ? "#a31313" : isHighlighted ? "#126c3d" : "#111";

    const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hitPath.setAttribute("d", edgePath(points));
    hitPath.setAttribute("class", "graph-edge-hit");
    hitPath.addEventListener("click", (event) => {
      event.stopPropagation();
      selectGraphEdge(edge.id);
    });
    graphEdges.appendChild(hitPath);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", edgePath(points));
    path.setAttribute("class", `graph-edge-line ${isSelected ? "selected" : ""}`);
    path.setAttribute("stroke", strokeColor);
    path.setAttribute("stroke-width", isSelected || isHighlighted ? "5" : "3");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("marker-end", "url(#arrowHead)");
    path.addEventListener("click", (event) => {
      event.stopPropagation();
      selectGraphEdge(edge.id);
    });
    graphEdges.appendChild(path);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const labelPoint = edgeLabelPoint(points);
    const labelX = labelPoint.x;
    const labelY = labelPoint.y - 8;
    label.setAttribute("x", labelX);
    label.setAttribute("y", labelY);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("paint-order", "stroke");
    label.setAttribute("stroke", "#fff");
    label.setAttribute("stroke-width", "5");
    label.setAttribute("fill", labelColor);
    label.setAttribute("font-weight", "800");
    label.setAttribute("class", "graph-edge-label");
    label.textContent = formatDistance(edge.weight);
    label.addEventListener("click", (event) => {
      event.stopPropagation();
      selectGraphEdge(edge.id);
    });
    graphEdges.appendChild(label);
  });
}

function drawGraphNodes() {
  graphNodes.forEach((node) => {
    const button = document.createElement("button");
    const selected = node.id === selectedGraphNodeId ? "selected" : "";
    const pathNode = highlightedNodeIds.has(node.id) ? "path-node" : "";
    const connecting = node.id === pendingEdgeFromId ? "connecting" : "";
    button.className = `graph-node ${selected} ${pathNode} ${connecting}`;
    button.type = "button";
    button.style.left = `${node.x - GRAPH_NODE_SIZE / 2}px`;
    button.style.top = `${node.y - GRAPH_NODE_SIZE / 2}px`;
    button.title = "Nodo del grafo";
    button.innerHTML = `<span class="node-label">${escapeHtml(graphNodeDisplayLabel(node))}</span>`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      handleGraphNodeClick(node.id);
    });
    button.addEventListener("pointerdown", (event) => startNodeDrag(event, node.id));
    graphArea.appendChild(button);
  });
}

function edgePoints(edge, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const radius = GRAPH_NODE_SIZE / 2 + 3;
  const hasReverse = graphEdgesData.some((item) => item.fromId === edge.toId && item.toId === edge.fromId);
  const curveOffset = hasReverse ? 34 : 0;
  const normalX = -dy / distance;
  const normalY = dx / distance;
  return {
    x1: from.x + (dx / distance) * radius,
    y1: from.y + (dy / distance) * radius,
    x2: to.x - (dx / distance) * radius,
    y2: to.y - (dy / distance) * radius,
    cx: (from.x + to.x) / 2 + normalX * curveOffset,
    cy: (from.y + to.y) / 2 + normalY * curveOffset,
    curved: curveOffset > 0,
  };
}

function edgePath(points) {
  if (!points.curved) return `M ${points.x1} ${points.y1} L ${points.x2} ${points.y2}`;
  return `M ${points.x1} ${points.y1} Q ${points.cx} ${points.cy} ${points.x2} ${points.y2}`;
}

function edgeLabelPoint(points) {
  if (!points.curved) {
    return {
      x: (points.x1 + points.x2) / 2,
      y: (points.y1 + points.y2) / 2,
    };
  }

  return {
    x: (points.x1 + 2 * points.cx + points.x2) / 4,
    y: (points.y1 + 2 * points.cy + points.y2) / 4,
  };
}

function handleGraphNodeClick(nodeId) {
  selectedGraphNodeId = nodeId;
  selectedGraphEdgeId = null;
  if (graphMode === "connect") {
    if (!pendingEdgeFromId) {
      pendingEdgeFromId = nodeId;
      const node = getGraphNode(nodeId);
      graphHint.textContent = `Origen ${graphNodeDisplayLabel(node)}. Ahora elige el nodo destino.`;
    } else {
      const added = addGraphEdge(pendingEdgeFromId, nodeId, edgeWeight.value);
      pendingEdgeFromId = null;
      graphHint.textContent = added
        ? "Arco creado. Puedes elegir otro origen para seguir uniendo nodos."
        : "Corrige el peso y vuelve a intentar.";
    }
  }
  renderGraph();
}

function startNodeDrag(event, nodeId) {
  if (graphMode === "connect") return;
  event.preventDefault();
  selectedGraphNodeId = nodeId;
  selectedGraphEdgeId = null;
  const node = getGraphNode(nodeId);
  const startX = event.clientX;
  const startY = event.clientY;
  const originalX = node.x;
  const originalY = node.y;

  const move = (moveEvent) => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    node.x = clamp(originalX + dx, GRAPH_NODE_SIZE / 2, graphArea.clientWidth - GRAPH_NODE_SIZE / 2);
    node.y = clamp(originalY + dy, GRAPH_NODE_SIZE / 2, graphArea.clientHeight - GRAPH_NODE_SIZE / 2);
    clearHighlights();
    renderGraph();
  };

  const up = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", up);
  };

  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", up);
}

function updateGraphEditor() {
  const node = getGraphNode(selectedGraphNodeId);
  if (!node) {
    graphNodeEditor.classList.add("hidden");
  } else {
    graphNodeEditor.classList.remove("hidden");
    if (document.activeElement !== graphNodeLabel) {
      graphNodeLabel.value = node.label;
    }
  }

  const edge = getGraphEdge(selectedGraphEdgeId);
  if (!edge) {
    graphEdgeEditor.classList.add("hidden");
  } else {
    graphEdgeEditor.classList.remove("hidden");
    graphEdgeLabel.value = graphEdgeDisplayLabel(edge);
    if (document.activeElement !== graphEdgeWeight) {
      graphEdgeWeight.value = cleanNumber(edge.weight);
    }
  }
}

function updateEdgeList() {
  if (!graphEdgesData.length) {
    edgeList.textContent = "No hay arcos.";
    return;
  }

  edgeList.innerHTML = "";
  graphEdgesData.forEach((edge) => {
    const from = getGraphNode(edge.fromId);
    const to = getGraphNode(edge.toId);
    if (!from || !to) return;
    const item = document.createElement("div");
    item.className = "edge-item";
    const label = document.createElement("span");
    label.textContent = graphEdgeDisplayLabel(edge);
    label.title = "Seleccionar arista";
    label.addEventListener("click", () => selectGraphEdge(edge.id));
    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.min = "0";
    weightInput.step = "any";
    weightInput.value = cleanNumber(edge.weight);
    weightInput.className = "edge-weight-input";
    weightInput.title = "Peso del arco";
    weightInput.addEventListener("change", () => {
      if (!setGraphEdgeWeight(edge.id, weightInput.value)) {
        weightInput.value = cleanNumber(edge.weight);
      }
    });
    const button = document.createElement("button");
    button.type = "button";
    button.className = "danger";
    button.textContent = "Quitar";
    button.addEventListener("click", () => {
      removeGraphEdge(edge.id);
    });
    item.append(label, weightInput, button);
    edgeList.appendChild(item);
  });
}

function updateNodeSelectOptions() {
  const previousStart = startNodeSelect.value;
  const previousEnd = endNodeSelect.value;
  startNodeSelect.innerHTML = "";
  endNodeSelect.innerHTML = "";

  graphNodes.forEach((node) => {
    const startOption = document.createElement("option");
    startOption.value = String(node.id);
    startOption.textContent = graphNodeDisplayLabel(node);
    startNodeSelect.appendChild(startOption);

    const endOption = document.createElement("option");
    endOption.value = String(node.id);
    endOption.textContent = graphNodeDisplayLabel(node);
    endNodeSelect.appendChild(endOption);
  });

  if (graphNodes.some((node) => String(node.id) === previousStart)) {
    startNodeSelect.value = previousStart;
  } else if (graphNodes.length) {
    startNodeSelect.value = String(graphNodes[0].id);
  }

  if (graphNodes.some((node) => String(node.id) === previousEnd)) {
    endNodeSelect.value = previousEnd;
  } else if (graphNodes.length > 1) {
    endNodeSelect.value = String(graphNodes[1].id);
  } else if (graphNodes.length) {
    endNodeSelect.value = String(graphNodes[0].id);
  }
}

function adjacencyMatrix() {
  const nodes = [...graphNodes].sort((a, b) => a.id - b.id);
  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const matrix = nodes.map((_, row) => nodes.map((__, col) => (row === col ? 0 : INF)));

  graphEdgesData.forEach((edge) => {
    const row = indexById.get(edge.fromId);
    const col = indexById.get(edge.toId);
    if (row === undefined || col === undefined) return;
    matrix[row][col] = Math.min(matrix[row][col], edge.weight);
  });

  return { nodes, matrix, indexById };
}

function runSelectedAlgorithm() {
  if (!graphNodes.length) {
    pathSummary.textContent = "Crea al menos un nodo.";
    return;
  }
  const startId = Number(startNodeSelect.value);
  if (!getGraphNode(startId)) {
    pathSummary.textContent = "Selecciona un nodo inicial valido.";
    return;
  }
  const endId = Number(endNodeSelect.value);
  if (!getGraphNode(endId)) {
    pathSummary.textContent = "Selecciona un nodo final valido.";
    return;
  }

  if (algorithmSelect.value === "floyd") {
    renderFloydResult(startId, endId);
  } else {
    renderDijkstraResult(startId, endId);
  }
}

function dijkstra(startId) {
  const { nodes, matrix, indexById } = adjacencyMatrix();
  const startIndex = indexById.get(startId);
  const distances = nodes.map(() => INF);
  const previous = nodes.map(() => null);
  const visited = nodes.map(() => false);
  const steps = [];
  distances[startIndex] = 0;

  for (let count = 0; count < nodes.length; count++) {
    let current = -1;
    let best = INF;
    for (let i = 0; i < nodes.length; i++) {
      if (!visited[i] && distances[i] < best) {
        best = distances[i];
        current = i;
      }
    }

    if (current === -1) break;
    visited[current] = true;
    const updates = [];

    for (let neighbor = 0; neighbor < nodes.length; neighbor++) {
      const weight = matrix[current][neighbor];
      if (visited[neighbor] || weight === INF || current === neighbor) continue;
      const candidate = distances[current] + weight;
      if (candidate < distances[neighbor]) {
        distances[neighbor] = candidate;
        previous[neighbor] = current;
        updates.push(`${graphNodeDisplayLabel(nodes[neighbor])}=${formatDistance(candidate)} via ${graphNodeDisplayLabel(nodes[current])}`);
      }
    }

    steps.push({
      node: graphNodeDisplayLabel(nodes[current]),
      updates: updates.length ? updates : ["sin mejoras"],
      distances: [...distances],
    });
  }

  return { nodes, distances, previous, steps, startIndex };
}

function renderDijkstraResult(startId, endId) {
  const result = dijkstra(startId);
  const startNode = getGraphNode(startId);
  const endNode = getGraphNode(endId);
  const endIndex = result.nodes.findIndex((node) => node.id === endId);
  const shortestPath = endIndex >= 0 ? buildPath(result.nodes, result.previous, endIndex, result.startIndex) : [];
  highlightedEdgeIds = new Set();
  highlightedNodeIds = new Set([startId]);

  markPath(shortestPath);
  renderDifferentPaths(startId, endId, result.distances[endIndex], shortestPath);
  pathSummary.textContent = `Camino  calculado con Dijkstra de ${graphNodeDisplayLabel(startNode)} a ${graphNodeDisplayLabel(endNode)}. camino minimo: ${formatDistance(result.distances[endIndex])}.`;
  renderSteps(result.steps);
  renderGraph();
}

function floydWarshall() {
  const { nodes, matrix } = adjacencyMatrix();
  const dist = matrix.map((row) => [...row]);
  const next = nodes.map((_, i) => nodes.map((__, j) => (dist[i][j] !== INF && i !== j ? j : null)));
  const steps = [];

  for (let k = 0; k < nodes.length; k++) {
    const updates = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (dist[i][k] === INF || dist[k][j] === INF) continue;
        const candidate = dist[i][k] + dist[k][j];
        if (candidate < dist[i][j]) {
          dist[i][j] = candidate;
          next[i][j] = next[i][k];
          updates.push(`${graphNodeDisplayLabel(nodes[i])}->${graphNodeDisplayLabel(nodes[j])}=${formatDistance(candidate)} pasando por ${graphNodeDisplayLabel(nodes[k])}`);
        }
      }
    }
    steps.push({ node: graphNodeDisplayLabel(nodes[k]), updates: updates.length ? updates : ["sin mejoras"] });
  }

  return { nodes, dist, next, steps };
}

function renderFloydResult(startId, endId) {
  const result = floydWarshall();
  const startIndex = result.nodes.findIndex((node) => node.id === startId);
  const endIndex = result.nodes.findIndex((node) => node.id === endId);
  const startNode = getGraphNode(startId);
  const endNode = getGraphNode(endId);
  const shortestPath = startIndex >= 0 && endIndex >= 0 ? buildFloydPath(result.nodes, result.next, startIndex, endIndex) : [];
  highlightedEdgeIds = new Set();
  highlightedNodeIds = new Set([startId]);

  markPath(shortestPath);
  renderDifferentPaths(startId, endId, result.dist[startIndex][endIndex], shortestPath);
  pathSummary.textContent = `Floyd-Warshall calculado de ${graphNodeDisplayLabel(startNode)} a ${graphNodeDisplayLabel(endNode)}. Costo minimo: ${formatDistance(result.dist[startIndex][endIndex])}.`;
  renderSteps(result.steps);
  renderGraph();
}

function renderSteps(steps) {
  stepsBox.innerHTML = "";
  steps.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "step-item";
    item.textContent = `Paso ${index + 1}: se toma ${step.node}. ${step.updates.join("; ")}.`;
    stepsBox.appendChild(item);
  });
}

function buildPath(nodes, previous, targetIndex, startIndex) {
  const path = [];
  let current = targetIndex;
  const seen = new Set();

  while (current !== null && current !== undefined && !seen.has(current)) {
    seen.add(current);
    path.unshift(nodes[current]);
    current = previous[current];
  }

  if (path.length === 1 && previous[targetIndex] === null && targetIndex !== startIndex) {
    return [];
  }
  return path;
}

function buildFloydPath(nodes, next, fromIndex, toIndex) {
  if (fromIndex === toIndex) return [nodes[fromIndex]];
  if (next[fromIndex][toIndex] === null) return [];
  const path = [nodes[fromIndex]];
  let current = fromIndex;
  const seen = new Set([current]);

  while (current !== toIndex) {
    current = next[current][toIndex];
    if (current === null || seen.has(current)) return [];
    seen.add(current);
    path.push(nodes[current]);
  }
  return path;
}

function markPath(path) {
  if (!path.length) return;
  path.forEach((node) => highlightedNodeIds.add(node.id));
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graphEdgesData.find((item) => item.fromId === path[i].id && item.toId === path[i + 1].id);
    if (edge) highlightedEdgeIds.add(edge.id);
  }
}

function renderDifferentPaths(startId, endId, shortestCost, shortestPath) {
  const allowWalks = pathModeSelect.value === "walks";
  const paths = collectGraphPaths(startId, endId, allowWalks);

  if (!paths.length) {
    pathsTable.textContent = "No hay caminos entre el nodo inicial y el nodo final.";
    return;
  }

  const visiblePaths = paths.slice(0, 80);
  const normalizedShortest = Number.isFinite(shortestCost) ? shortestCost : paths[0].cost;
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Camino</th>
        <th>Peso total</th>
        <th>Aristas</th>
      </tr>
    </thead>
  `;

  const body = document.createElement("tbody");
  visiblePaths.forEach((pathInfo, index) => {
    const row = document.createElement("tr");
    const isShortest = Math.abs(pathInfo.cost - normalizedShortest) < 1e-9;
    if (index === 0 || isShortest) row.className = "shortest-row";

    const orderCell = document.createElement("td");
    orderCell.textContent = String(index + 1);

    const pathCell = document.createElement("td");
    pathCell.textContent = pathInfo.nodes.map((node) => graphNodeDisplayLabel(node)).join(" -> ");
    if (isShortest) {
      const badge = document.createElement("span");
      badge.className = "path-badge";
      badge.textContent = "mas corto";
      pathCell.appendChild(badge);
    }

    const costCell = document.createElement("td");
    costCell.textContent = formatDistance(pathInfo.cost);

    const edgesCell = document.createElement("td");
    edgesCell.textContent = pathInfo.edges.map((edge) => formatDistance(edge.weight)).join(" + ") || "0";

    row.append(orderCell, pathCell, costCell, edgesCell);
    body.appendChild(row);
  });

  table.appendChild(body);
  pathsTable.innerHTML = "";
  pathsTable.appendChild(table);
  if (paths.length > visiblePaths.length) {
    const note = document.createElement("p");
    note.className = "paths-note";
    note.textContent = `Se muestran los ${visiblePaths.length} caminos de menor peso.`;
    pathsTable.appendChild(note);
  }
}

function collectGraphPaths(startId, endId, allowWalks) {
  const start = getGraphNode(startId);
  const end = getGraphNode(endId);
  if (!start || !end) return [];

  const maxEdges = allowWalks ? Math.max(graphNodes.length * 2, graphEdgesData.length + 1) : graphNodes.length - 1;
  const maxResults = allowWalks ? 1000 : 5000;
  const paths = [];

  function visit(currentId, nodes, edges, cost, visited) {
    if (paths.length >= maxResults) return;
    if (currentId === endId) {
      paths.push({ nodes: [...nodes], edges: [...edges], cost });
      return;
    }
    if (edges.length >= maxEdges) return;

    const outgoing = graphEdgesData
      .filter((edge) => edge.fromId === currentId)
      .sort((a, b) => a.weight - b.weight);

    outgoing.forEach((edge) => {
      if (!allowWalks && visited.has(edge.toId)) return;
      const nextNode = getGraphNode(edge.toId);
      if (!nextNode) return;
      const nextVisited = new Set(visited);
      nextVisited.add(edge.toId);
      visit(edge.toId, [...nodes, nextNode], [...edges, edge], cost + edge.weight, nextVisited);
    });
  }

  visit(startId, [start], [], 0, new Set([startId]));
  return paths.sort((a, b) => a.cost - b.cost || a.edges.length - b.edges.length || pathLabel(a).localeCompare(pathLabel(b)));
}

function pathLabel(pathInfo) {
  return pathInfo.nodes.map((node) => graphNodeDisplayLabel(node)).join("->");
}

function samePath(left, right) {
  if (!left.length || !right.length || left.length !== right.length) return false;
  return left.every((node, index) => node.id === right[index].id);
}

function loadDemoGraph() {
  graphNextId = 8;
  graphNodes = [
    { id: 1, label: "1", x: 120, y: 130 },
    { id: 2, label: "2", x: 330, y: 90 },
    { id: 3, label: "3", x: 520, y: 150 },
    { id: 4, label: "4", x: 300, y: 300 },
    { id: 5, label: "5", x: 530, y: 340 },
    { id: 6, label: "6", x: 760, y: 190 },
    { id: 7, label: "7", x: 760, y: 390 },
  ];
  graphEdgesData = [
    { id: "e1", fromId: 1, toId: 3, weight: 10 },
    { id: "e2", fromId: 1, toId: 4, weight: 18 },
    { id: "e3", fromId: 2, toId: 3, weight: 6 },
    { id: "e4", fromId: 2, toId: 5, weight: 3 },
    { id: "e5", fromId: 3, toId: 4, weight: 3 },
    { id: "e6", fromId: 3, toId: 6, weight: 20 },
    { id: "e7", fromId: 4, toId: 3, weight: 2 },
    { id: "e8", fromId: 4, toId: 7, weight: 2 },
    { id: "e9", fromId: 5, toId: 4, weight: 8 },
    { id: "e10", fromId: 5, toId: 7, weight: 10 },
    { id: "e11", fromId: 7, toId: 6, weight: 5 },
  ];
  selectedGraphNodeId = 1;
  selectedGraphEdgeId = null;
  pendingEdgeFromId = null;
  clearHighlights();
  renderGraph();
}

function clearGraphData() {
  graphNextId = 1;
  graphNodes = [];
  graphEdgesData = [];
  selectedGraphNodeId = null;
  selectedGraphEdgeId = null;
  pendingEdgeFromId = null;
  clearHighlights();
  pathSummary.textContent = "Crea un digrafo ponderado para calcular.";
  pathsTable.textContent = "Sin calculo todavia.";
  stepsBox.textContent = "Ejecuta un algoritmo para ver el recorrido.";
  renderGraph();
}

function getGraphNode(id) {
  return graphNodes.find((node) => node.id === Number(id)) || null;
}

function getGraphEdge(id) {
  return graphEdgesData.find((edge) => edge.id === id) || null;
}

function graphNodeDisplayLabel(node) {
  if (!node) return "?";
  return String(node.label || "").trim() || String(node.id);
}

function graphEdgeDisplayLabel(edge) {
  const from = getGraphNode(edge.fromId);
  const to = getGraphNode(edge.toId);
  return `${graphNodeDisplayLabel(from)} -> ${graphNodeDisplayLabel(to)}`;
}

function selectGraphEdge(edgeId) {
  if (!getGraphEdge(edgeId)) return;
  selectedGraphEdgeId = edgeId;
  selectedGraphNodeId = null;
  pendingEdgeFromId = null;
  graphHint.textContent = "Arista seleccionada. Cambia su peso en el panel.";
  renderGraph();
}

function setGraphEdgeWeight(edgeId, rawWeight) {
  const edge = getGraphEdge(edgeId);
  const text = String(rawWeight).trim();
  const value = Number(text);
  if (!edge || text === "" || !Number.isFinite(value) || value < 0) {
    pathSummary.textContent = "El peso debe ser un numero mayor o igual a 0.";
    return false;
  }

  edge.weight = value;
  selectedGraphEdgeId = edge.id;
  selectedGraphNodeId = null;
  clearHighlights();
  pathsTable.textContent = "Vuelve a calcular para actualizar los caminos.";
  renderGraph();
  return true;
}

function removeGraphEdge(edgeId) {
  graphEdgesData = graphEdgesData.filter((edge) => edge.id !== edgeId);
  if (selectedGraphEdgeId === edgeId) selectedGraphEdgeId = null;
  clearHighlights();
  pathsTable.textContent = "Vuelve a calcular para actualizar los caminos.";
  renderGraph();
}

function clearHighlights() {
  highlightedEdgeIds = new Set();
  highlightedNodeIds = new Set();
}

function formatDistance(value) {
  return value === INF ? "INF" : cleanNumber(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

nodeType.addEventListener("change", () => {
  const node = findNode(selectedId);
  if (!node) return;
  node.type = nodeType.value;
  if (node.type === "value") {
    node.left = null;
    node.right = null;
  }
  syncEditorVisibility();
  updateTree();
});

nodeValue.addEventListener("input", () => {
  const node = findNode(selectedId);
  if (!node) return;
  node.value = nodeValue.value;
  updateTree();
});

nodeOperator.addEventListener("change", () => {
  const node = findNode(selectedId);
  if (!node) return;
  node.operator = nodeOperator.value;
  if (operatorArity(node) === 1) node.right = null;
  syncEditorVisibility();
  updateTree();
});

derivativeVariable.addEventListener("input", () => {
  const node = findNode(selectedId);
  if (!node) return;
  node.variable = derivativeVariable.value || "x";
  updateTree();
});

addLeft.addEventListener("click", () => {
  const node = findNode(selectedId);
  if (!node || node.left) return;
  node.left = createNode(node.id);
  if (node.type === "value") node.type = "operator";
  selectedId = node.left.id;
  updateTree();
});

addRight.addEventListener("click", () => {
  const node = findNode(selectedId);
  if (!node || node.right || operatorArity(node) === 1) return;
  node.right = createNode(node.id);
  if (node.type === "value") node.type = "operator";
  selectedId = node.right.id;
  updateTree();
});

removeNode.addEventListener("click", removeSelectedNode);
notationSelect.addEventListener("change", updateOutput);
resetTree.addEventListener("click", () => {
  root = null;
  selectedId = null;
  nextId = 1;
  updateTree();
});
loadExample.addEventListener("click", loadDemoTree);
centerTree.addEventListener("click", () => {
  const scroll = document.querySelector(".tree-scroll");
  scroll.scrollLeft = Math.max(0, (treeArea.scrollWidth - scroll.clientWidth) / 2);
  scroll.scrollTop = 0;
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setGraphMode(button.dataset.graphMode));
});

graphArea.addEventListener("click", (event) => {
  if (event.target !== graphArea || graphMode !== "create") return;
  const point = graphPointFromEvent(event);
  createGraphNode(point.x, point.y);
});

graphNodeLabel.addEventListener("input", () => {
  const node = getGraphNode(selectedGraphNodeId);
  if (!node) return;
  node.label = graphNodeLabel.value;
  clearHighlights();
  pathsTable.textContent = "Vuelve a calcular para actualizar los caminos.";
  renderGraph();
});

graphNodeLabel.addEventListener("blur", () => {
  const node = getGraphNode(selectedGraphNodeId);
  if (!node) return;
  node.label = graphNodeLabel.value.trim() || String(node.id);
  graphNodeLabel.value = node.label;
  renderGraph();
});

deleteGraphNode.addEventListener("click", () => {
  const node = getGraphNode(selectedGraphNodeId);
  if (!node) return;
  graphNodes = graphNodes.filter((item) => item.id !== node.id);
  graphEdgesData = graphEdgesData.filter((edge) => edge.fromId !== node.id && edge.toId !== node.id);
  selectedGraphNodeId = null;
  selectedGraphEdgeId = null;
  pendingEdgeFromId = null;
  clearHighlights();
  renderGraph();
});

graphEdgeWeight.addEventListener("change", () => {
  if (!setGraphEdgeWeight(selectedGraphEdgeId, graphEdgeWeight.value)) {
    const edge = getGraphEdge(selectedGraphEdgeId);
    if (edge) graphEdgeWeight.value = cleanNumber(edge.weight);
  }
});

graphEdgeWeight.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  graphEdgeWeight.blur();
});

deleteGraphEdge.addEventListener("click", () => {
  if (!selectedGraphEdgeId) return;
  removeGraphEdge(selectedGraphEdgeId);
});

edgeWeight.addEventListener("input", () => {
  if (Number(edgeWeight.value) < 0) edgeWeight.value = "0";
});

loadGraphExample.addEventListener("click", loadDemoGraph);
clearGraph.addEventListener("click", clearGraphData);
runAlgorithm.addEventListener("click", runSelectedAlgorithm);
algorithmSelect.addEventListener("change", () => {
  clearHighlights();
  stepsBox.textContent = "Ejecuta un algoritmo para ver el recorrido.";
  renderGraph();
});
centerGraph.addEventListener("click", () => {
  const scroll = document.querySelector(".graph-scroll");
  scroll.scrollLeft = Math.max(0, (graphArea.scrollWidth - scroll.clientWidth) / 2);
  scroll.scrollTop = Math.max(0, (graphArea.scrollHeight - scroll.clientHeight) / 2);
});

if (new URLSearchParams(window.location.search).has("demo")) {
  loadDemoTree();
} else {
  updateTree();
}

renderGraph();
