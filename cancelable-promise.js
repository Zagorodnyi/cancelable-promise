"use strict";

class Cancelable extends Promise {
  constructor(executor) {
    assertIsFunction(executor, "executor must be a function", true);

    let _reject;
    super((resolve, reject) => {
      _reject = reject.bind(executor);

      executor(resolve, reject);
    });

    this.cancel = cancelPromise(_reject).bind(this);

    this.isCanceled = false;
    this.promises = [];
    this.parent = null;
  }

  then(onfulfilled, onrejected) {
    assertIsFunction(onfulfilled, "onfulfilled must be a function");
    assertIsFunction(onrejected, "onrejected must be a function");

    const thenPromise = super.then(onfulfilled, onrejected);
    thenPromise.parent = this.parent || this;

    const promises = this.parent?.promises || this.promises;
    promises.push(thenPromise);

    return thenPromise;
  }
}

function cancelPromise(reject) {
  return function () {
    if (this.isCanceled) return void 0;

    this.isCanceled = true;

    if (this.parent) {
      return void this.parent.cancel();
    }

    this.promises.forEach((promise) => void promise.cancel());

    reject({ isCanceled: true });
  };
}

function assertIsFunction(value, message, required = false) {
  if ((!value && required) || (value && typeof value !== "function")) {
    throw new Error(message);
  }

  return void 0;
}

module.exports = Cancelable;
