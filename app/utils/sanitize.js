export const DEFAULT_OPTIONS = {
	allowAttributes: {
			a: [''],
			p: ['data-'],
	},
	blockElements: ['script']
}

export function Sanitizer({
	allowAttributes = DEFAULT_OPTIONS.allowAttributes,
	blockElements = DEFAULT_OPTIONS.blockElements,
	allowElements
} = {}) {
	const parser = new DOMParser();

	function sanitiseChildren(node) {
			for (let child of node.children) {
					sanitiseNode(child);
			}
	}
	function sanitiseNode(node) {
		switch(node.nodeType) {
				case 1:
					const tagName = node.tagName.toLowerCase();
					if(blockElements.includes(tagName) || (allowElements && !allowElements?.includes(tagName))) {
						node.parentElement.removeChild(node);
					} else {
							const attrs = allowAttributes[tagName] || [];
							const hasDataAttrsWild = attrs.includes('data-');
							node.getAttributeNames().forEach(attr => {
									if (node.getAttribute(attr).toLowerCase().indexOf('cript:') > 0) {
										node.removeAttribute(attr);
									} else if(hasDataAttrsWild && attr.startsWith('data-')) {
										return;
									}
									if(!attrs.includes(attr)) {
										node.removeAttribute(attr)
									}
								});
								sanitiseChildren(node);
							}
				default:
						
					return;
			}
	}
	
	
	return {
		parseFromString(html) {
			const fragment = parser.parseFromString(html, 'text/html').body;
			sanitiseNode(fragment);

			return fragment.textContent;
		}
	}
}