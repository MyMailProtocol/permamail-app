import { cubicOut } from 'svelte/easing';
import { noop, loop, now } from 'svelte/internal';
import helper from './helper';

const defaultOptions = {
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

const abortEvents = [
  'mousedown',
  'wheel',
  'DOMMouseScroll',
  'mousewheel',
  'keydown',
  'touchmove',
];

const _scrollTo = (options) => {
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

  const initialX = helper.scrollLeft(container);
  const initialY = helper.scrollTop(container);

  const targetX = cumulativeOffsetTarget.left - cumulativeOffsetContainer.left + offset;
  const targetY = cumulativeOffsetTarget.top - cumulativeOffsetContainer.top + offset;

  const diffX = targetX - initialX;
  const diffY = targetY - initialY;

  let scrolling = true;
  let started = false;
  const startTime = now() + delay;
  const endTime = startTime + duration;

  function scrollToTopLeft(element, top, left) {
    if (scrollX) {
      helper.scrollLeft(element, left);
    }
    if (scrollY) {
      helper.scrollTop(element, top);
    }
  }

  function stop() {
    scrolling = false;
    helper.removeListeners(container, abortEvents, stop);
  }

  function start(delayStart) {
    if (!delayStart) {
      started = true;
      onStart(element, { x, y });
    }
    helper.addListeners(container, abortEvents, stop, { passive: true });
  }

  function tick(progress) {
    scrollToTopLeft(
      container,
      initialY + diffY * progress,
      initialX + diffX * progress,
    );
  }

  loop((now) => {
    if (!started && now >= startTime) {
      start(false);
    }

    if (started && now >= endTime) {
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
      const p = now - startTime;
      const t = 0 + 1 * easing(p / duration);
      tick(t);
    }

    return true;
  });

  start(delay);

  tick(0);

  return stop;
};

const proceedOptions = (options) => {
  const opts = helper.extend({}, defaultOptions, options);
  opts.container = helper.$(opts.container);
  opts.element = helper.$(opts.element);
  return opts;
};

const scrollContainerHeight = (containerElement) => {
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

export const setGlobalOptions = (options) => {
  helper.extend(defaultOptions, options || {});
};

export const scrollTo = (options) => _scrollTo(proceedOptions(options));

export const scrollToBottom = (options) => {
  options = proceedOptions(options);

  return _scrollTo(
    helper.extend(options, {
      element: null,
      y: scrollContainerHeight(options.container),
    }),
  );
};

export const scrollToTop = (options) => {
  options = proceedOptions(options);

  return _scrollTo(
    helper.extend(options, {
      element: null,
      y: 0,
    }),
  );
};

export const makeScrollToAction = (scrollToFunc) => (node, options) => {
  let current = options;
  const handle = (e) => {
    e.preventDefault();
    scrollToFunc(
      typeof current === 'string' ? { element: current } : current,
    );
  };
  helper.addListeners(node, ['click', 'touchstart'], handle);
  return {
    update(options) {
      current = options;
    },
    destroy() {
      helper.removeListeners(node, ['click', 'touchstart'], handle);
    },
  };
};

export const scrollto = makeScrollToAction(scrollTo);
export const scrolltotop = makeScrollToAction(scrollToTop);
export const scrolltobottom = makeScrollToAction(scrollToBottom);
