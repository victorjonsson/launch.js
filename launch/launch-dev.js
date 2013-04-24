/** * * * * * * * * * * * * * * * * * * * * *
 * launch.js - Web app distribution system
 *
 * @version 1.1.5
 * @author Victor Jonsson (http://www.victorjonsson)
 * @license Dual licensed under the MIT and the GPLv2 licenses
 */
var WebApp = (function(win) {

    'use strict';

    // Log level
    var DEBUG = true;

    // Detect possible IE version
    var IS_OLD_IE = false;
    if( win.navigator.userAgent.toLowerCase().indexOf('msie ') > -1) {
        IS_OLD_IE = parseFloat(navigator.appVersion.split("MSIE")[1]) < 10;
    }

    // Support for canvas
    var IS_CANVAS_SUPPORTED = false;
    try {
        var c = document.createElement("canvas");
        IS_CANVAS_SUPPORTED = 'toDataURL' in c && 'getContext' in c;
    } catch(e) {}

    /**
     * Collection of utility methods
     */
    var Utils = {

        /**
         * Turns '1.0.34xyz' => 1.034
         * @param {String} version
         * @return {Number}
         */
        versionToFloat : function(version) {
            if( !version )
                return 0;
            var parts = version.split('.');
            var main = parts.splice(0,1)[0];
            return parseFloat( (main +'.'+ parts.join('')) );
        },

        /**
         * @param {String} nodeName
         * @param {String} content
         * @param {HTMLElement|String} [parentNode]
         * @returns {*|HTMLElement}
         */
        createElement : function(nodeName, content, parentNode) {
            var element = win.document.createElement(nodeName);
            element.innerHTML = content;
            if( typeof parentNode == 'string' ) {
                win.document.getElementsByTagName(parentNode)[0].appendChild(element);
            }
            else if( typeof parentNode == 'object' && parentNode ) {
                parentNode.appendChild(element);
            }
            return element;
        },

        /**
         * (for old ie compatibility) borrowed from http://json.org/json2.js
         * @param {String} data
         * @returns {Function}
         */
        parseJSON : function(data) {

            try {
                if( !IS_OLD_IE ) {
                    return JSON.parse(data);
                }

                data = data.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); // For ie's sake...

                // JSON RegExp
                var rvalidchars = /^[\],:{}\s]*$/,
                    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
                    rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
                    rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g;

                if ( rvalidchars.test( data.replace( rvalidescape, "@" )
                    .replace( rvalidtokens, "]" )
                    .replace( rvalidbraces, "")) ) {

                    return ( new Function( "return " + data ) )();
                }
            } catch(e) {}

            // we shouldn't have come this far
            throw new Error('Unable to parse JSON');
        },

        /**
         * @param file
         * @returns {boolean}
         */
        isImageFile : function(file) {
            var ext = file.substr(file.length-4, 4).toLowerCase();
            return ext == 'jpeg' || ext == '.jpg' || ext == '.gif' || ext == '.png';
        }

    };


    /**
     * Object managing events
     */
    var EventManager = {

        listeners : {},

        on : function(event, func) {
            if(this.listeners[event] === undefined)
                this.listeners[event] = [];
            this.listeners[event].push(func);
        },

        call : function(event, arg) {
            if( this.listeners[event] !== undefined ) {
                for(var i=0; i < this.listeners[event].length; i++) {
                    this.listeners[event][i](arg);
                }
            }
        }
    };

    /**
     * @param {*} msg
     * @param {String} [level]
     */
    var log = function(msg, level) {
        if( console ) {
            if( (level == 'debug' || !level) && DEBUG ) {
                console.log('DEBUG: '+msg);
            } else if(level == 'info') {
                console.log(msg);
            }
        }
    };

    return {

        /**
         * @type {EventManager}
         */
        events : EventManager,

        /**
         * The number of files that needs to be downloaded
         * and saved to local storage
         */
        filesToLoad : 0,

        /**
         * The number of request to server currently open
         */
        concurrentRequests : 0,

        /**
         * Object containing all resources downloaded that
         * is not stylesheets or scripts
         */
        resources : {},

        /**
         * Variable holding the manifest data downloaded
         * from server
         */
        manifest : null,

        /**
         * This request has downloaded the application if
         * this variable is true
         */
        isDownloaded : false,

        /**
         * Start the web app:
         *  1) Search after meta tag with name app-manifest referring to manifest file
         *  2) Download app.manifest (will fire event "init")
         *  3) Either download app files from server or load them from local storage
         *  4) Downloads files that is declared as "nocache" in app.manifest
         *  5) Add files to dom or WebApp.resources
         *  6) Fires event "load"
         */
        start : function() {
            var _self = this;
            var manifestFile = 'app.manifest';
            var meta = win.document.getElementsByTagName('meta');
            for(var i=0; i < meta.length; i++) {
                if( meta[i].getAttribute('name') === 'app-manifest' ) {
                    manifestFile = meta[i].getAttribute('content');
                }
            }
            this.request(manifestFile, function(response) {

                _self.manifest = Utils.parseJSON(response);

                var currentVersion = Utils.versionToFloat( win.localStorage.getItem(_self.manifest.name+'-app-version') );
                var newVersion = Utils.versionToFloat(_self.manifest.version);
                _self.isDownloaded = newVersion == currentVersion;

                log('Manfiest loaded, calling event init');

                _self.events.call('init');

                if( IS_OLD_IE || !IS_CANVAS_SUPPORTED ) {
                    log('Moving images to no cache');
                    _self.moveImagesToNoCache();
                }

                // Download new version
                if( !_self.isDownloaded ) {
                    log('Downloading new app', 'info');
                    _self.downloadApp(currentVersion);
                }
                else {
                    log('Fetching app files from local storage', 'info');
                    _self.downloadUnCachedFiles(function() {
                        _self.initiateFiles();
                    });
                }
            });
        },

        /**
         * Function called in old versions of Internet explorer that
         * moves images from "file" declaration to "nocache" declaration.
         * This is needed because internet explorer (version < 10) can't
         * store the images in local storage
         */
        moveImagesToNoCache : function() {
            if( !this.manifest.nocache )
                this.manifest.nocache = [];

            var _self= this;
            var getFileIndex = function(f) {
                for(var i=0; i < _self.manifest.files.length; i++) {
                    if( _self.manifest.files[i] == f )
                        return i;
                }
                return -1;
            };

            // old ie can not cache images
            var fileCopy = this.manifest.files.slice(0, this.manifest.files.length);
            for(var i=0; i < fileCopy.length; i++) {
                if( Utils.isImageFile(fileCopy[i]) ) {
                    this.manifest.nocache.push(fileCopy[i]);
                    this.manifest.files.splice(getFileIndex(fileCopy[i]), 1);
                }
            }
        },

        /**
         * Add content either to DOM or WebApp.resources
         * @param content
         * @param file
         */
        addToDOM : function(content, file) {

            var ext = file.substr(file.length-4, 4).toLowerCase();

            // JS
            if( file.substr(file.length-3, 3) == '.js' ) {
                Utils.createElement('SCRIPT', content, 'head');
            }

            // CSS
            else if( ext == '.css' ) {
                Utils.createElement('STYLE', content, 'head');
            }

            // JSON resource
            else if( ext == 'json' ) {
                this.resources[file] = Utils.parseJSON(content);
            }

            // Image resource (base64 encoded)
            else if( Utils.isImageFile(file) && typeof content == 'string' ) {
                var img = new Image();
                img.src = content;
                this.resources[file] = img;
            }

            // Text/image resource resource
            else  {
                this.resources[file] = content;
            }
        },

        /**
         * Download all files and store them locally
         */
        downloadApp : function(currentVersion) {
            var _self = this;
            var appName = this.manifest.name;

            this.filesToLoad = this.manifest.files.length;
            if( currentVersion )
                this.removeApp();

            win.localStorage.setItem(this.manifest.name+'-app-version', this.manifest.version);

            for(var i=0; i < this.manifest.files.length; i++) {
                if( this.halt ) {
                    log('halted download...', 'info');
                    break;
                }
                this.request(this.manifest.files[i], function(content, file) {
                    log(file+' downloaded');
                    if( _self.halt ) {
                        return;
                    }
                    try {
                        win.localStorage.setItem(appName+'-file-'+file, content);
                    } catch(e) {
                        log(e, 'info');
                        _self.events.call('QuotaExceeded');
                        _self.halt = true;
                        return;
                    }
                    _self.events.call('download', file);
                    _self.filesToLoad--;
                    if( _self.filesToLoad == 0 ) {

                        win.localStorage.setItem(_self.manifest.name+'-app-files', _self.manifest.files.join('<file-divider />'));

                        _self.downloadUnCachedFiles(function() {
                            _self.initiateFiles();
                        });
                    }
                });
            }
        },

        /**
         * Will go through all files of the app and add its
         * content to DOM.
         *
         * If a file does not have the extension .js or .css
         * it will be placed in WebApp.resources.
         */
        initiateFiles : function() {
            for(var i=0; i < this.manifest.files.length; i++) {
                var file = this.manifest.files[i];
                var content = win.localStorage.getItem(this.manifest.name+'-file-'+file);
                this.addToDOM(content, file);
            }
            var _self = this;
            // Let things catch up
            setTimeout(function() {
                _self.events.call('load');
                log('App loaded', 'info');
            }, 100);
        },

        /**
         * Downloads files that not will be cached accordingly to
         * the application manifest
         *
         * @param {Function} callback
         */
        downloadUnCachedFiles : function(callback) {
            var _self = this, i;
            log('Downloading uncached files', 'info');
            if( this.manifest.nocache && this.manifest.nocache.length ) {
                var unCachedFilesLoaded = this.manifest.nocache.length;
                var headNode = win.document.getElementsByTagName('head')[0];
                for(i=0; i < this.manifest.nocache.length; i++) {
                    var file = this.manifest.nocache[i];
                    if( file.substr(file.length-3, 3) == '.js' ) {
                        var script = win.document.createElement('SCRIPT');
                        script.onload = function() {
                            unCachedFilesLoaded--;
                            if( unCachedFilesLoaded == 0 ) {
                                callback();
                            }
                        };
                        script.src = file;
                        headNode.appendChild(script);
                    }
                    else {
                        this.request(file, function(content, file) {
                            _self.addToDOM(content, file);
                            unCachedFilesLoaded--;
                            if( unCachedFilesLoaded == 0 ) {
                                callback();
                            }
                        });
                    }
                }
            } else {
                callback();
            }
        },

        /**
         * Removes all stored files used in this app
         */
        removeApp : function() {
            log('Removing old app');
            win.localStorage.removeItem(this.manifest.name+'-app-version');
            var files = win.localStorage.getItem(this.manifest.name+'-app-files');
            if( files ) {
                files = files.split('<file-divider />');
                for(var i=0; i < files.length; i++) {
                    win.localStorage.removeItem(this.manifest.name+'-file-'+files[i]);
                }
            }
            win.localStorage.removeItem(this.manifest.name+'-app-files');
        },

        /**
         * Load a file over HTTP
         * @param {String} URL
         * @param {Function} callback
         */
        request : function(URL, callback) {
            var _self = this;
            if( this.concurrentRequests > 4 ) {
                log(URL+' being queued for download');
                setTimeout(function() {
                    _self.request(URL, callback);
                }, 500);
            }
            else {
                this.concurrentRequests++;
                setTimeout(function() {
                    var ext = URL.substr(URL.length-4, 4).toLocaleLowerCase();
                    if( ext != 'jpeg' )
                        ext = ext.substr(1, 3);
                    if( ext == 'jpg' )
                        ext = 'jpeg';

                    var isImage = Utils.isImageFile(URL);
                    log(URL+' starting download');

                    //
                    // Download image using canvas
                    ///
                    if( isImage ) {
                        var img = win.document.createElement('IMG');
                        img.onload = function() {

                            _self.concurrentRequests--;

                            // Get canvas contents as a data URL
                            if( IS_CANVAS_SUPPORTED ) {
                                log('Downloaded image '+URL+' using canvas');

                                var imgCanvas = win.document.createElement("canvas"),
                                    imgContext = imgCanvas.getContext("2d");

                                // Make sure canvas is as big as the picture
                                imgCanvas.width = this.width;
                                imgCanvas.height = this.height;

                                // Draw image into canvas element
                                imgContext.drawImage(this, 0, 0, this.width, this.height);

                                callback(imgCanvas.toDataURL("image/"+ext), URL);

                            } else {
                                callback(this, URL);
                            }
                        };
                        img.onerror = function() {
                            _self.concurrentRequests--;
                            log(URL+' failed to load (image), retrying...', 'info');
                            _self.request(URL, callback);
                        };
                        img.src = URL; // Start "download"
                    }

                    //
                    // Download using ajax
                    //
                    else {
                        var http = 'XMLHttpRequest' in win ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
                        if( 'overrideMimeType' in http ) {
                            http.overrideMimeType('text/plain; charset=x-user-defined');
                        }
                        http.onreadystatechange = function() {
                            if( http.readyState == 4 ) {
                                _self.concurrentRequests--;
                                if( http.status != 200 ) {
                                    log(URL+' responded with status '+http.status+', retrying...', 'info');
                                    _self.request(URL, callback);
                                } else {
                                    callback(http.responseText, URL);
                                }
                            }
                        };
                        http.open("GET", URL, true);
                        http.send();
                    }
                }, 50);
            }
        },


        /**
         * Bind listener to an event
         * @param {String} event
         * @param {Function} func
         */
        on : function(event, func) {
            this.events.on(event, func);
        }

    };

})(window);


/** * * * * * * * * * * * * * * * * * * * * *
 * App initiation (you may replace this code with
 * something of your own if you want)
 */
(function(WebApp, win) {

    var panel, loadedElem, numElem, infoElem, progressBar;

    var fadePanel = function(callback) {
        var opac = panel.style.opacity;
        opac = (opac ? parseFloat(opac) : 1) - 0.04;
        panel.style.opacity = opac;
        panel.style.filter = 'alpha('+(opac * 100)+')';
        if( opac > 0 ) {
            setTimeout(function() {
                fadePanel(callback);
            }, 10);
        } else {
            callback();
        }
    };

    panel = document.getElementById('launch-panel');
    progressBar = document.getElementById('launch-progress-bar');
    infoElem = document.getElementById('launch-progress-info');

    panel.style.position = 'absolute';
    panel.style.width = '200px';
    panel.style.height = '200px';
    panel.style.left = '50%';
    panel.style.top = '50%';
    panel.style.padding = '20px 25px 0';
    panel.style.margin = '-180px 0 0 -130px';
    progressBar.parentNode.style.height = '22px';
    progressBar.parentNode.style.height = '22px';
    progressBar.parentNode.style.margin = '20px 0 8px';
    progressBar.parentNode.style.overflow = 'hidden';
    progressBar.style.height = '100%';
    progressBar.style.width = '0';

    panel.style.display = 'block';

    // Show download info
    WebApp.on('init', function() {
        infoElem.innerHTML = 'Downloaded <span id="loaded-launch-files"></span>'+
                                ' of <span id="num-launch-files"></span> files';
        numElem = document.getElementById('num-launch-files');
        loadedElem = document.getElementById('loaded-launch-files');

        if( WebApp.isDownloaded ) {
            progressBar.style.width = '100%';
            infoElem.innerHTML = 'Application loaded from local storage...';
        } else {
            numElem.innerHTML = WebApp.manifest.files.length;
            loadedElem.innerHTML = '0';
        }
    });

    // Update download status
    WebApp.on('download', function(file) {
        if( !WebApp.isDownloaded ) {
            var count = parseInt(loadedElem.innerHTML) + 1;
            var percent = Math.round( (count / WebApp.manifest.files.length * 100) );
            progressBar.style.width = percent+'%';
            loadedElem.innerHTML = count;
            if( count == WebApp.manifest.files.length ) {
                infoElem.innerHTML = 'Application downloaded...';
            }
        } else {
            // a file declared as "nocache" is downloaded
        }
    });

    // App is to large
    WebApp.on('QuotaExceeded', function() {
        progressBar.parentNode.parentNode.removeChild(progressBar.parentNode);
        infoElem.style.textAlign = 'center';
        infoElem.style.paddingTop = '10px';
        infoElem.style.lineHeight = '130%';
        infoElem.innerHTML = '<strong style="color:red">ERROR<br /></strong><strong>Local storage quoata exceeded.</strong> '+
                                '<br /> You have to increase the local storage quota in your browser in order '+
                                'to run this web app.';
    });

    // Remove preloader and setup app
    WebApp.on('load', function() {
        fadePanel(function() {
            var mainFile = WebApp.manifest.main;
            if( mainFile ) {
                win.document.getElementsByTagName('body')[0].innerHTML = WebApp.resources[mainFile]
            }
            WebApp.events.call('ready');
        });
    });

    setTimeout(function() {
        WebApp.start();
    }, 500);

})(WebApp, window);