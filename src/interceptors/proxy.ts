/*---------------------------------------------------------------------------------------------------
 * Copyright (c) 2017 Maxim Gherman
 * typeioc - Dependency injection container for node typescript / javascript
 * @version v2.1.1
 * @link https://github.com/maxgherman/TypeIOC
 * @license MIT
 * --------------------------------------------------------------------------------------------------*/

 'use strict';

import { Reflection } from '../utils';
import { ProxyError } from '../exceptions';
import IStorage = Typeioc.Internal.Interceptors.IStorage;
import IProxy  = Typeioc.Internal.Interceptors.IProxy;
import ISubstitute = Addons.Interceptors.ISubstitute;
import IStrategyInfo = Typeioc.Internal.Interceptors.IStrategyInfo;

interface IPropertyPredicate {
    (name : string) : boolean;
}

export class Proxy implements IProxy {

    private restrictedProperties;

    constructor(private _decorator : Typeioc.Internal.Interceptors.IDecorator) {

        this.restrictedProperties = Reflection.getAllPropertyNames(Function);
    }

    public byPrototype(parent : Function,
                       storage? : IStorage) : Function {

        var self = this;

        function Proxy() {
            this._parent = Reflection.construct(parent, arguments);

            Object.getOwnPropertyNames(this._parent)
            .filter(name => !isBlackListProperty(name))    
            .filter(name => (name in this) === false &&
                    (name in Proxy.prototype) === false)
            .map(p => self.createStrategyInfo(this._parent, this, p))
            .forEach(s => self.decorateProperty(s, storage));
        }

        const source = parent.prototype;
        Reflection.getAllPropertyNames(source)
            .filter(name => !isBlackListProperty(name))
            .map(p => self.createStrategyInfo(source, Proxy.prototype, p, '_parent'))
            .forEach(s => self.decorateProperty(s, storage));

        Object.getOwnPropertyNames(parent)
            .filter(name =>  self.restrictedProperties.indexOf(name) === -1)
            .map(p => self.createStrategyInfo(parent, Proxy, p))
            .forEach(s => self.decorateProperty(s, storage));

        return Proxy;
    }

    public byInstance(parent : Object, storage? : IStorage) : Object {

        const result = Object.create({});

        Reflection.getAllPropertyNames(parent)
            .filter(name => !isBlackListProperty(name))
            .map(p => this.createStrategyInfo(parent, result, p))
            .forEach(s => this.decorateProperty(s, storage));

        return result;
    }

    private decorateProperty(strategyInfo : IStrategyInfo, storage? : IStorage) {

        let substitutes = [];

        if(storage) {
            var types = storage.getKnownTypes(strategyInfo.name);
            substitutes = storage.getSubstitutes(strategyInfo.name, types);
        }

        if(substitutes.length) {

            this.checkProxyCompatibility(strategyInfo.name, types, strategyInfo.type);

            substitutes.forEach(item => {

                strategyInfo.substitute = item;
                this._decorator.wrap(strategyInfo);
            });
        } else {
            this._decorator.wrap(strategyInfo);
        }
    }

    private hasProperType(types: Array<Addons.Interceptors.CallInfoType>, type : Addons.Interceptors.CallInfoType) : boolean {

        const hasAny = types.indexOf(Addons.Interceptors.CallInfoType.Any) >= 0;
        const hasType = types.indexOf(type) >= 0;

        if((types.length == 1 && hasAny) ||
           (types.length == 2 && hasAny  && hasType) ||
           (types.length == 1 && hasType)) return true;

        return false;
    }

    private checkProxyCompatibility(
        propertyName : string,
        types: Array<Addons.Interceptors.CallInfoType>,
        propertyType : Typeioc.Internal.Reflection.PropertyType) {

        switch (propertyType) {
            case Typeioc.Internal.Reflection.PropertyType.Method:

                if(this.hasProperType(types, Addons.Interceptors.CallInfoType.Method) === false) {
                    throw this.combineError(propertyName, 'Method', types);
                }

                break;

            case Typeioc.Internal.Reflection.PropertyType.Getter:

                if(this.hasProperType(types, Addons.Interceptors.CallInfoType.Getter) === false) {
                    throw this.combineError(propertyName, 'Getter', types);
                }

                break;

            case Typeioc.Internal.Reflection.PropertyType.Setter:
                if(this.hasProperType(types, Addons.Interceptors.CallInfoType.Setter) === false) {
                    throw this.combineError(propertyName, 'Setter', types);
                }

                break;
            case Typeioc.Internal.Reflection.PropertyType.FullProperty:

                if(this.hasProperType(types, Addons.Interceptors.CallInfoType.GetterSetter) === false &&
                   this.hasProperType(types, Addons.Interceptors.CallInfoType.Getter) === false &&
                   this.hasProperType(types, Addons.Interceptors.CallInfoType.Setter)=== false) {
                    throw this.combineError(propertyName, 'GetterSetter', types);
                }

                break;

            case Typeioc.Internal.Reflection.PropertyType.Field:

                if(this.hasProperType(types, Addons.Interceptors.CallInfoType.Field) === false) {
                    throw this.combineError(propertyName, 'Field', types);
                }

                break;
        }
    }

    private createStrategyInfo(source : Function | Object,
                               destination : Function | Object,
                               name : string,
                               contextName? : string) : IStrategyInfo {

        const descriptor = Reflection.getPropertyDescriptor(source, name);
        const propertyType = Reflection.getPropertyType(name, descriptor);

        return {
            type : propertyType,
            descriptor : descriptor,
            substitute : null,
            name : name,
            source : source,
            destination : destination,
            contextName : contextName
        };
    }

    private combineError(propertyName : string, nativeTypeName: string, types : Array<Addons.Interceptors.CallInfoType>) {

        const type = types.filter(t => t !== Addons.Interceptors.CallInfoType.Any)[0];

        const allTypes = {
            [Addons.Interceptors.CallInfoType.Field]: 'Field',
            [Addons.Interceptors.CallInfoType.Getter]: 'Getter',
            [Addons.Interceptors.CallInfoType.Setter]: 'Setter',
            [Addons.Interceptors.CallInfoType.Method]: 'Method',
            [Addons.Interceptors.CallInfoType.GetterSetter]: 'GetterSetter'
        };

        const typeName = allTypes[type];

        const message = ['Could not match proxy type and property type. Expected: "', nativeTypeName, '", Actual: "', typeName, '"'].join('');
        const error = new ProxyError(message);
        error.data = { method : propertyName, expected : nativeTypeName, actual : typeName };
        return error;
    }
 }

 const blacListProperties = [
   '__lookupGetter__',
   '__lookupSetter__',
   '__proto__',
   '__defineGetter__',
   '__defineSetter__',
   'hasOwnProperty',
   'propertyIsEnumerable',
   'constructor'            
 ];

 const isBlackListProperty = (property: string) => {
     return blacListProperties.indexOf(property) >= 0;
 }