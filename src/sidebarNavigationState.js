let rootNode = null;
const navigationStack = [];

export function reset(node = null) {
	rootNode = node;
	navigationStack.length = 0;
}

export function getRootNode() {
	return rootNode;
}

export function getStack() {
	return navigationStack;
}

export function getStackLength() {
	return navigationStack.length;
}

export function addNode(node) {
	if (!node) return;

	if (!navigationStack.includes(node)) {
		navigationStack.push(node);
	}
}

export function getNodeAt(index) {
	return navigationStack[index] || null;
}

export function trimTo(index) {
	navigationStack.length = index;
}

export function clear() {
	navigationStack.length = 0;
}
