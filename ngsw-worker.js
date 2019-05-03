(function () {
    'use strict';
    
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    
    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const NOTIFICATION_OPTION_NAMES = [
        'actions', 'badge', 'body', 'data', 'dir', 'icon', 'image', 'lang', 'renotify',
        'requireInteraction', 'silent', 'tag', 'timestamp', 'title', 'vibrate'
    ];
    class Driver {
        constructor(scope) {
            // Set up all the event handlers that the SW needs.
            this.scope = scope;
            this.initialized = null;
            this.scope.addEventListener('install', (event) => {
                // SW code updates are separate from application updates, so code updates are
                // almost as straightforward as restarting the SW. Because of this, it's always
                // safe to skip waiting until application tabs are closed, and activate the new
                // SW version immediately.
                event.waitUntil(this.scope.skipWaiting());
            });
            this.scope.addEventListener('push', (event) => this.onPush(event));
            this.scope.addEventListener('notificationclick', (event) => this.onClick(event));
            
        }
        onPush(msg) {
            // Push notifications without data have no effect.
            if (!msg.data) {
                return;
            }
            // Handle the push and keep the SW alive until it's handled.
            msg.waitUntil(this.handlePush(msg.data.json()));
        }
        onClick(event) {
            // Handle the click event and keep the SW alive until it's handled.
            event.waitUntil(this.handleClick(event.notification, event.action));
        }
        handlePush(data) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.broadcast({
                    type: 'PUSH',
                    data,
                });
                if (!data.notification || !data.notification.title) {
                    return;
                }
                const desc = data.notification;
                let options = {};
                NOTIFICATION_OPTION_NAMES.filter(name => desc.hasOwnProperty(name))
                    .forEach(name => options[name] = desc[name]);
                yield this.scope.registration.showNotification(desc['title'], options);
            });
        }
        handleClick(notification, action) {
            return __awaiter(this, void 0, void 0, function* () {
                notification.close();
                const options = {};
                // The filter uses `name in notification` because the properties are on the prototype so
                // hasOwnProperty does not work here
                NOTIFICATION_OPTION_NAMES.filter(name => name in notification)
                    .forEach(name => options[name] = notification[name]);
                yield this.broadcast({
                    type: 'NOTIFICATION_CLICK',
                    data: { action, notification: options },
                });
            });
        }
        broadcast(msg) {
            return __awaiter(this, void 0, void 0, function* () {
                const clients = yield this.scope.clients.matchAll();
                clients.forEach(client => { client.postMessage(msg); });
            });
        }
    }
    const scope = self;
    const driver = new Driver(scope);
}());