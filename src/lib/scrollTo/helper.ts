let supportsPassive = false;
try {
  const opts = Object.defineProperty({}, 'passive', {
    get: () => {
      supportsPassive = true;
      return true;
    },
  });
  window.addEventListener('test', null, opts);
} catch (e) {
  // ignore
}

interface CumulativeOffsetResult {
  top: number,
  left: number,
}

export default {
  $(selector) {
    if (typeof selector === 'string') {
      return document.querySelector(selector);
    }
    return selector;
  },
  extend(...args) {
    // @ts-ignore
    return Object.assign(...args);
  },
  addListeners(
    element: HTMLElement,
    events: string|string[],
    handler: EventListener,
    opts = { passive: false },
  ): void {
    if (!(events instanceof Array)) {
      events = [events];
    }
    events.forEach((event: string) => {
      element.addEventListener(
        event,
        handler,
        supportsPassive ? opts : false,
      );
    });
  },
  removeListeners(
    element: HTMLElement,
    events: string|string[],
    handler: EventListener,
  ): void {
    if (!(events instanceof Array)) {
      events = [events];
    }
    events.forEach((event: string) => {
      element.removeEventListener(event, handler);
    });
  },
  cumulativeOffset(
    element: HTMLElement,
  ): CumulativeOffsetResult {
    let top = 0;
    let left = 0;

    do {
      top += element.offsetTop || 0;
      left += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);

    return {
      top,
      left,
    };
  },
  directScroll(
    element: HTMLElement|Document,
  ): boolean {
    return element && element !== document && element !== document.body;
  },
  scrollTop(
    element: HTMLElement,
    value?: number,
  ): number {
    const inSetter: boolean = (value !== undefined);
    if (this.directScroll(element)) {
      if (inSetter) {
        element.scrollTop = value;
      }
      return element.scrollTop;
    }

    if (inSetter) {
      document.documentElement.scrollTop = value;
      document.body.scrollTop = value;
      return value;
    }
    return window.pageYOffset
      || document.documentElement.scrollTop
      || document.body.scrollTop
      || 0;
  },
  scrollLeft(
    element: HTMLElement,
    value?: number,
  ): number {
    const inSetter: boolean = (value !== undefined);
    if (this.directScroll(element)) {
      if (inSetter) {
        element.scrollLeft = value;
        return value;
      }
      return element.scrollLeft;
    }
    if (inSetter) {
      document.documentElement.scrollLeft = value;
      document.body.scrollLeft = value;
      return value;
    }
    return window.pageXOffset
      || document.documentElement.scrollLeft
      || document.body.scrollLeft
      || 0;
  },
};
