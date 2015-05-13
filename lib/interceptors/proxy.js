/// <reference path="../../d.ts/typeioc.internal.d.ts" />
/// <reference path="../../d.ts/typeioc.addons.d.ts" />
'use strict';
var Utils = require('../utils/index');
var Exceptions = require('../exceptions/index');
var Proxy = (function () {
    function Proxy(decoratorService) {
        this._decorator = decoratorService.create();
        this.restrictedProperties = Utils.Reflection.getAllPropertyNames(function test() {
        });
    }
    Proxy.prototype.byPrototype = function (parent, storage) {
        var self = this;
        function Proxy() {
            var _this = this;
            this._parent = Utils.Reflection.construct(parent, arguments);
            Object.getOwnPropertyNames(this._parent).filter(function (name) { return name !== 'constructor' && name !== 'prototype' && (name in _this) === false && (name in Proxy.prototype) === false; }).map(function (p) { return self.createStrategyInfo(_this._parent, _this, p); }).forEach(function (s) { return self.decorateProperty(s, storage); });
        }
        var source = parent.prototype;
        Utils.Reflection.getAllPropertyNames(source).filter(function (name) { return name !== 'constructor' && name !== 'prototype'; }).map(function (p) { return self.createStrategyInfo(source, Proxy.prototype, p, '_parent'); }).forEach(function (s) { return self.decorateProperty(s, storage); });
        Object.getOwnPropertyNames(parent).filter(function (name) { return self.restrictedProperties.indexOf(name) === -1; }).map(function (p) { return self.createStrategyInfo(parent, Proxy, p); }).forEach(function (s) { return self.decorateProperty(s, storage); });
        return Proxy;
    };
    Proxy.prototype.byInstance = function (parent, storage) {
        var _this = this;
        var result = Object.create({});
        Utils.Reflection.getAllPropertyNames(parent).filter(function (name) { return name !== 'constructor'; }).map(function (p) { return _this.createStrategyInfo(parent, result, p); }).forEach(function (s) { return _this.decorateProperty(s, storage); });
        return result;
    };
    Proxy.prototype.decorateProperty = function (strategyInfo, storage) {
        var _this = this;
        var substitutes = [];
        if (storage) {
            var types = storage.getKnownTypes(strategyInfo.name);
            substitutes = storage.getSubstitutes(strategyInfo.name, types);
        }
        if (substitutes.length) {
            this.checkProxyCompatibility(strategyInfo.name, types, strategyInfo.type);
            substitutes.forEach(function (item) {
                strategyInfo.substitute = item;
                _this._decorator.wrap(strategyInfo);
            });
        }
        else {
            this._decorator.wrap(strategyInfo);
        }
    };
    Proxy.prototype.hasProperType = function (types, type) {
        var hasAny = types.indexOf(5 /* Any */) >= 0;
        var hasType = types.indexOf(type) >= 0;
        if ((types.length == 1 && hasAny) || (types.length == 2 && hasAny && hasType) || (types.length == 1 && hasType))
            return true;
        return false;
    };
    Proxy.prototype.checkProxyCompatibility = function (propertyName, types, propertyType) {
        switch (propertyType) {
            case 1 /* Method */:
                if (this.hasProperType(types, 1 /* Method */) === false)
                    throw this.combineError('Could not match proxy type and property type for method', propertyName, 1 /* Method */);
                break;
            case 2 /* Getter */:
                if (this.hasProperType(types, 2 /* Getter */) === false)
                    throw this.combineError('Could not match proxy type and property type for getter', propertyName, 2 /* Getter */);
                break;
            case 3 /* Setter */:
                if (this.hasProperType(types, 3 /* Setter */) === false)
                    throw this.combineError('Could not match proxy type and property type for setter', propertyName, 3 /* Setter */);
                break;
            case 4 /* FullProperty */:
                if (this.hasProperType(types, 4 /* GetterSetter */) === false && this.hasProperType(types, 2 /* Getter */) === false && this.hasProperType(types, 3 /* Setter */) === false)
                    throw this.combineError('Could not match proxy type and property type for getter-setter', propertyName, 4 /* GetterSetter */);
                break;
            case 5 /* Field */:
                if (this.hasProperType(types, 6 /* Field */) === false)
                    throw this.combineError('Could not match proxy type and property type for field', propertyName, 6 /* Field */);
                break;
        }
    };
    Proxy.prototype.createStrategyInfo = function (source, destination, name, contextName) {
        var descriptor = Utils.Reflection.getPropertyDescriptor(source, name);
        var propertyType = Utils.Reflection.getPropertyType(name, descriptor);
        return {
            type: propertyType,
            descriptor: descriptor,
            substitute: null,
            name: name,
            source: source,
            destination: destination,
            contextName: contextName
        };
    };
    Proxy.prototype.combineError = function (message, propertyName, type) {
        var error = new Exceptions.ProxyError(message);
        error.data = { method: propertyName, type: type };
        return error;
    };
    return Proxy;
})();
exports.Proxy = Proxy;
//# sourceMappingURL=proxy.js.map