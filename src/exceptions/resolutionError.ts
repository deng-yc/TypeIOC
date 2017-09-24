/*---------------------------------------------------------------------------------------------------
 * Copyright (c) 2017 Maxim Gherman
 * typeioc - Dependency injection container for node typescript / javascript
 * @version v2.1.2
 * @link https://github.com/maxgherman/TypeIOC
 * @license MIT
 * --------------------------------------------------------------------------------------------------*/

'use strict';

import ApplicationError from './applicationError';

export default class ResolutionError extends ApplicationError {

    constructor (message?: string) {
        super(message);

        this.name = "ResolutionError";
    }
}


