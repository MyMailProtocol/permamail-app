let supportsPassive = false;
try {
  const opts = Object.defineProperty({}, 'passive', {
    get: function () {
      supportsPassive = true;
    },
  });
  window.addEventListener('test', null, opts);
} catch (e) {
  // ignore
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
    element,
    events,
    handler,
    opts = { passive: false },
  ) {
    if (!(events instanceof Array)) {
      events = [events];
    }
    for (let i = 0; i < events.length; i += 1) {
      element.addEventListener(
        events[i],
        handler,
        supportsPassive ? opts : false,
      );
    }
  },
  removeListeners(element, events, handler) {
    if (!(events instanceof Array)) {
      events = [events];
    }
    for (let i = 0; i < events.length; i += 1) {
      element.removeEventListener(events[i], handler);
    }
  },
  cumulativeOffset(
    element,
  ) {
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
    element,
  ) {
    return element && element !== document && element !== document.body;
  },
  scrollTop(
    element,
    value,
  ) {
    const inSetter = (value !== undefined);
    if (this.directScroll(element)) {
      if (inSetter) {
        element.scrollTop = value;
        return value;
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
    element,
    value,
  ) {
    const inSetter = (value !== undefined);
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
