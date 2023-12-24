export function clickOutside(node: HTMLElement, { ignore }: { ignore?: HTMLElement } = {}) {
  let ignoreElement = ignore;

	const handleClick = (event: MouseEvent) => {
		if (
			!node.contains(event.target as unknown as Node) &&
			(!ignoreElement || !ignoreElement.contains(event.target as unknown as Node))
		) {
			node.dispatchEvent(new CustomEvent('blur'));
		}
	};

	document.addEventListener('click', handleClick);

	return {
		update({ ignore }: { ignore?: HTMLElement } = {}) {
			ignoreElement = ignore;
		},
		destroy() {
			document.removeEventListener('click', handleClick);
		}
	};
}

export function keyboardFocus(node: HTMLElement, className: string) {
	let keyboardFocused = false;

	function handleMouseDown() {
		keyboardFocused = false;
		setState();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') {
			keyboardFocused = true;
			setState();
		}
	}

	function setState() {
		const hasClass = node.classList.contains(className);
		if (keyboardFocused && !hasClass) {
			node.classList.add(className);
		} else if (!keyboardFocused && hasClass) {
			node.classList.remove(className);
		}
	}

	window.addEventListener('mousedown', handleMouseDown, true);
	window.addEventListener('keydown', handleKeyDown, true);

	node.classList.remove(className);

	return {
		destroy() {
			window.removeEventListener('mousedown', handleMouseDown, true);
			window.removeEventListener('keydown', handleKeyDown, true);
		}
	};
}
