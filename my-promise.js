const STATUS_PENDING = 'pending';
const STATUS_FULFILLED = 'fulfilled';
const STATUS_REJECTED = 'rejected';

function resolvePromise (promise, x, resolve, reject) {
    if (promise === x) {
        return reject(new TypeError('promise and value can not be the same'));
    }

    // NOTE: error reminded in promiseaplus test case for 2.3.3.3.1 which is not pointed out in promiseaplus spec.
    if (x === null) {
        return resolve(x);
    }

    if (x instanceof MyPromise) {
        x.then((y) => {
            resolvePromise(promise, y, resolve, reject);
        }, reject);
    }
    else if (typeof x === 'object' || typeof x === 'function') {
        let then;

        try {
            then = x.then;
        } catch (e) {
            reject(e);
        }

        if (typeof then === 'function') {
            let called = false;

            try {
                then.call(
                    x,
                    function (y) {
                        if (called) return;
                        called = true;
                        resolvePromise(promise, y, resolve, reject);
                    },
                    function (r) {
                        if (called) return;
                        called = true;
                        reject(r);
                    }
                );
            } catch (error) {
                if (called) return;
                reject(error);
            }
        } else {
            resolve(x);
        }
    } else {
        resolve(x);
    }
}

class MyPromise {
    constructor (executor) {
        this.status = STATUS_PENDING;
        this.value = undefined;
        this.reason = undefined;
        this.fulfilledCallbacks = [];
        this.rejectedCallbacks = [];

        function resolve(value) {
            this.status = STATUS_FULFILLED;
            this.value = value;

            this.fulfilledCallbacks.forEach((callback) => {
                callback(this.value);
            });
        }

        function reject(reason) {
            this.status = STATUS_REJECTED;
            this.reason = reason;

            this.rejectedCallbacks.forEach((callback) => {
                callback(this.reason);
            });
        }

        executor(resolve.bind(this), reject.bind(this));
    }

    then (onFulfilled, onRejected) {
        let promise;

        if (this.status === STATUS_FULFILLED) {
            promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        if (typeof onFulfilled !== 'function') {
                            resolve(this.value);
                        } else {
                            let x = onFulfilled(this.value);
                            resolvePromise(promise, x, resolve, reject)
                        }
                    } catch (error) {
                        reject(error);
                    }
                }, 0);
            });

            return promise;
        }

        if (this.status === STATUS_REJECTED) {
            promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        if (typeof onRejected !== 'function') {
                            reject(this.reason);
                        } else {
                            let x = onRejected(this.reason);
                            resolvePromise(promise, x, resolve, reject);
                        }
                    } catch (error) {
                        reject(error);
                    }
                }, 0);
            });

            return promise;
        }

        if (this.status === STATUS_PENDING) {
            promise = new Promise((resolve, reject) => {
                this.fulfilledCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            if (typeof onFulfilled !== 'function') {
                                resolve(this.value);
                            } else {
                                let x = onFulfilled(this.value);
                                resolvePromise(promise, x, resolve, reject);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }, 0);
                });

                this.rejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            if (typeof onRejected !== 'function') {
                                reject(this.reason);
                            } else {
                                let x = onRejected(this.reason);
                                resolvePromise(promise, x, resolve, reject);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }, 0);
                });
            });

            return promise;
        }
    }

    // NOTE: for promiseaplus-test
    static deferred () {
        let result = {};

        result.promise = new MyPromise((resolve, reject) => {
            result.resolve = resolve;
            result.reject = reject;
        })

        return result;
    }
}

module.exports = MyPromise;
