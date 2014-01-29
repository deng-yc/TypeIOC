/// <reference path="../d.ts/node.d.ts" />
/// <reference path="../d.ts/typeioc.d.ts" />
'use strict';
var Exceptions = require('./exceptions');
var RegistrationBaseModule = require('./registrationBase');
var InternalStorageModule = require('./internalStorage');
var DisposableStorageModule = require('./disposableStorage');

var weak = require('weak');

var Container = (function () {
    function Container(registrations) {
        this.weakRef = weak;
        this.children = [];
        this.collection = new InternalStorageModule.InternalStorage();
        this.disposables = new DisposableStorageModule.DisposableStorage();

        if (registrations) {
            this.import(registrations);
        }
    }
    Container.prototype.createChild = function () {
        var child = new Container();
        child.parent = this;
        this.children.push(child);
        return child;
    };

    Container.prototype.dispose = function () {
        this.disposables.disposeItems();

        while (this.children.length > 0) {
            var item = this.children.pop();
            item.dispose();
        }
    };

    Container.prototype.resolve = function (service) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        var rego = this.createRegistration(service);
        rego.args = args;

        return this.resolveBase(rego, true);
    };

    Container.prototype.tryResolve = function (service) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        var rego = this.createRegistration(service);

        return this.resolveBase(rego, false);
    };

    Container.prototype.resolveNamed = function (service, name) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
        var rego = this.createRegistration(service);
        rego.name = name;
        rego.args = args;

        return this.resolveBase(rego, true);
    };

    Container.prototype.tryResolveNamed = function (service, name) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
        var rego = this.createRegistration(service);
        rego.name = name;
        rego.args = args;

        return this.resolveBase(rego, false);
    };

    Container.prototype.import = function (registrations) {
        var self = this;

        registrations.forEach(function (item) {
            self.registerImpl(item);
        });
    };

    Container.prototype.registerImpl = function (registration) {
        if (!registration.factory)
            throw new Exceptions.ArgumentNullError("Factory is not defined for: " + registration.service.name);

        registration.container = this;

        this.collection.addEntry(registration);
    };

    Container.prototype.resolveBase = function (registration, throwIfNotFound) {
        var entry = this.resolveImpl(registration, throwIfNotFound);

        if (!entry && throwIfNotFound === false)
            return null;
        entry.args = registration.args;

        return this.resolveScope(entry, throwIfNotFound);
    };

    Container.prototype.resolveImpl = function (registration, throwIfNotFound) {
        var serviceEntry = this.collection.getEntry(registration);

        if (!serviceEntry && this.parent) {
            return this.parent.resolveImpl(registration, throwIfNotFound);
        }

        if (!serviceEntry && throwIfNotFound === true)
            throw new Exceptions.ResolutionError('Could not resolve service');

        return serviceEntry;
    };

    Container.prototype.resolveScope = function (registration, throwIfNotFound) {
        switch (registration.scope) {
            case 1 /* None */:
                return this.createTrackable(registration);

            case 2 /* Container */:
                return this.resolveContainerScope(registration);

            case 3 /* Hierarchy */:
                return this.resolveHierarchyScope(registration, throwIfNotFound);

            default:
                throw new Exceptions.ResolutionError('Unknown scoping');
        }
    };

    Container.prototype.resolveContainerScope = function (registration) {
        var entry;

        if (registration.container !== this) {
            entry = registration.cloneFor(this);
            this.collection.addEntry(entry);
        } else {
            entry = registration;
        }

        if (!entry.instance) {
            entry.instance = this.createTrackable(entry);
        }

        return entry.instance;
    };

    Container.prototype.resolveHierarchyScope = function (registration, throwIfNotFound) {
        if (registration.container && registration.container !== this) {
            var container = registration.container;

            return container.resolveBase(registration, throwIfNotFound);
        }

        if (!registration.instance) {
            registration.instance = this.createTrackable(registration);
        }

        return registration.instance;
    };

    Container.prototype.createTrackable = function (registration) {
        var instance = registration.invoker();

        if (registration.owner === 1 /* Container */ && registration.disposer) {
            this.disposables.add(instance, registration.disposer);
        }

        if (registration.initializer) {
            registration.initializer(this, instance);
        }

        return instance;
    };

    Container.prototype.createRegistration = function (service) {
        return new RegistrationBaseModule.RegistrationBase(service);
    };
    return Container;
})();
exports.Container = Container;