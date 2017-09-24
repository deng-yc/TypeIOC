/*---------------------------------------------------------------------------------------------------
 * Copyright (c) 2017 Maxim Gherman
 * typeioc - Dependency injection container for node typescript / javascript
 * @version v2.1.3
 * @link https://github.com/maxgherman/TypeIOC
 * @license MIT
 * --------------------------------------------------------------------------------------------------*/

'use strict';

import ApplicationError from './applicationError';

export default class ArgumentError extends ApplicationError {

    constructor (public argumentName : string, message?: string) {
        super(message);

        this.name = "ArgumentError";
    }
}
