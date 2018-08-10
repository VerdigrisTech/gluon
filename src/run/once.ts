function once(fn: Function, context) {
  let result;

  return function (...args) {
    if (fn) {
      result = fn.apply(context || this, args);
      fn = null;
    }

    return result;
  }
}

export default once;
