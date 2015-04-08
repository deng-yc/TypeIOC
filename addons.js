/*---------------------------------------------------------------------------------------------------
 * Copyright (c) 2015 Maxim Gherman
 * typeioc - Dependency injection container for node typescript
 * @version v1.2.7
 * @link https://github.com/maxgherman/TypeIOC
 * @license (MIT) - https://github.com/maxgherman/TypeIOC/blob/master/LICENSE
 * --------------------------------------------------------------------------------------------------*/


var main = require('./');
var AddonsBuilder = require('./lib/scaffoldAddons');

var scaffold = new AddonsBuilder.ScaffoldAddons();

module.exports = {
    Types: main.Types,
    Exceptions : main.Exceptions,

    createBuilder: main.createBuilder,

    interceptor : function() {
        return scaffold.interceptor();
    }
};

