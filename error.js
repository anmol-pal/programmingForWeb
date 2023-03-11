"use strict";
exports.__esModule = true;
exports.errResult = exports.okResult = exports.ErrResult = exports.OkResult = exports.error = exports.Err = void 0;
var Err = /** @class */ (function () {
    function Err(message, options) {
        this.message = message;
        this.options = options;
    }
    return Err;
}());
exports.Err = Err;
;
function error(e, options) {
    var opts = (typeof options === 'string') ? { code: options } : options;
    return (typeof e === 'string')
        ? new Err(e, opts)
        : (e instanceof Err)
            ? e
            : (e instanceof Error)
                ? new Err(e.message, opts)
                : new Err(e.toString(), opts);
}
exports.error = error;
var OkResult = /** @class */ (function () {
    function OkResult(v) {
        this.isOk = true;
        this.val = v;
    }
    OkResult.prototype.chain = function (fn) {
        return fn(this.val);
    };
    return OkResult;
}());
exports.OkResult = OkResult;
var ErrResult = /** @class */ (function () {
    function ErrResult(errors) {
        if (errors === void 0) { errors = []; }
        this.isOk = false;
        this.errors = errors;
    }
    ErrResult.prototype.addError = function (e, options) {
        return new ErrResult(this.errors.concat(error(e, options)));
    };
    ErrResult.prototype.chain = function (_fn) {
        return this;
    };
    return ErrResult;
}());
exports.ErrResult = ErrResult;
function okResult(v) { return new OkResult(v); }
exports.okResult = okResult;
function errResult(e, options) {
    return new ErrResult().addError(e, options);
}
exports.errResult = errResult;
function demo(result) {
    if (!result.isOk)
        return result;
    var v = result.val + 1;
    return result.chain(function (val) { return okResult('x'.repeat(v * val)); });
}
console.log(demo(errResult('errrrr', 'ERR')));
console.log(demo(okResult(2)));
