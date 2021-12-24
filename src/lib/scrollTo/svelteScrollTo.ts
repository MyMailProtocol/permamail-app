import { cubicOut } from 'svelte/easing';
import { noop, loop, now } from 'svelte/internal';
import helper from './helper.ts';

interface XY {
  x: number,
  y: number,
}

interface ElementXYCallback {
  (element: HTMLElement, position: XY): void;
}

interface NumberCallback {
  (): number;
}

interface EasingCallback {
  (t: number): number;
}

interface ScrollToOptions {
  container?: string,
  duration?: number,
  delay?: number,
  offset?: number|NumberCallback,
  easing?: EasingCallback,
  onStart?: ElementXYCallback,
  onDone?: ElementXYCallback,
  onAborting?: ElementXYCallback,
  scrollX?: boolean,
  scrollY?: boolean,
  element?: HTMLElement,
  x?: number,
  y?: number,
}

const defaultOptions: ScrollToOptions = {
  container: 'body',
  duration: 500,
  delay: 0,
  offset: 0,
  easing: cubicOut,
  onStart: noop,
  onDone: noop,
  onAborting: noop,
  scrollX: false,
  scrollY: true,
};

const abortEvents: string[] = [
  'mousedown',
  'wheel',
  'DOMMouseScroll',
  'mousewheel',
  'keydown',
  'touchmove',
];

const scrollToInternal = (options: ScrollToOptions) => {
  const {
    duration,
    delay,
    easing,
    x = 0,
    y = 0,
    scrollX,
    scrollY,
    onStart,
    onDone,
    container,
    onAborting,
    element,
  } = options;

  let {
    offset,
  } = options;

  if (typeof offset === 'function') {
    offset = offset();
  }

  const cumulativeOffsetContainer = helper.cumulativeOffset(container);
  const cumulativeOffsetTarget = element
    ? helper.cumulativeOffset(element)
    : { top: y, left: x };

  const initialX: number = helper.scrollLeft(container);
  const initialY: number = helper.scrollTop(container);

  const targetX: number = cumulativeOffsetTarget.left - cumulativeOffsetContainer.left + offset;
  const targetY: number = cumulativeOffsetTarget.top - cumulativeOffsetContainer.top + offset;

  const diffX: number = targetX - initialX;
  const diffY: number = targetY - initialY;

  let scrolling = true;
  let started = false;
  const startTime: number = now() + delay;
  const endTime: number = startTime + duration;

  function scrollToTopLeft(
    elem: HTMLElement,
    top: number,
    left: number,
  ): void {
    if (scrollX) {
      helper.scrollLeft(elem, left);
    }
    if (scrollY) {
      helper.scrollTop(elem, top);
    }
  }

  function stop(): void {
    scrolling = false;
    helper.removeListeners(container, abortEvents, stop);
  }

  function start(
    delayStart: number,
  ): void {
    if (!delayStart) {
      started = true;
      onStart(element, { x, y });
    }
    helper.addListeners(container, abortEvents, stop, { passive: true });
  }

  function tick(progress: number) {
    scrollToTopLeft(
      container,
      initialY + diffY * progress,
      initialX + diffX * progress,
    );
  }

  loop((time) => {
    if (!started && time >= startTime) {
      start(0);
    }

    if (started && time >= endTime) {
      tick(1);
      stop();
      onDone(element, { x, y });
      return false;
    }

    if (!scrolling) {
      onAborting(element, { x, y });
      return false;
    }

    if (started) {
      const p: number = time - startTime;
      const t: number = 0 + 1 * easing(p / duration);
      tick(t);
    }

    return true;
  });

  start(delay);

  tick(0);

  return stop;
};

const proceedOptions = (options: ScrollToOptions) => {
  const opts: ScrollToOptions = helper.extend({}, defaultOptions, options);
  opts.container = helper.$(opts.container);
  opts.element = helper.$(opts.element);
  return opts;
};

const scrollContainerHeight = (containerElement: HTMLElement|Document) => {
  if (containerElement
    && containerElement !== document
    && containerElement !== document.body) {
    return containerElement.scrollHeight - containerElement.offsetHeight;
  }
  const { body } = document;
  const html = document.documentElement;

  return Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight,
  );
};

export const setGlobalOptions = (options: ScrollToOptions) => {
  helper.extend(defaultOptions, options || {});
};

const scrollTo = (options: ScrollToOptions) => scrollToInternal(proceedOptions(options));

export const scrollToBottom = (options: ScrollToOptions) => {
  options = proceedOptions(options);

  return scrollToInternal(
    helper.extend(options, {
      element: null,
      y: scrollContainerHeight(options.container),
    }),
  );
};

const scrollToTop = (options: ScrollToOptions) => {
  options = proceedOptions(options);

  return scrollToInternal(
    helper.extend(options, {
      element: null,
      y: 0,
    }),
  );
};

const makeScrollToAction = (scrollToFunc) => (node: Node, options: ScrollToOptions) => {
  let current: ScrollToOptions = options;
  const handle: EventListener = (e: Event) => {
    e.preventDefault();
    scrollToFunc(
      typeof current === 'string' ? { element: current } : current,
    );
  };

  helper.addListeners(node, ['click', 'touchstart'], handle);

  return {
    update(
      updateOptions: ScrollToOptions,
    ) {
      current = updateOptions;
    },
    destroy() {
      helper.removeListeners(node, ['click', 'touchstart'], handle);
    },
  };
};

export const scrollto = makeScrollToAction(scrollTo);
export const scrolltotop = makeScrollToAction(scrollToTop);
export const scrolltobottom = makeScrollToAction(scrollToBottom);
