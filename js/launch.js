/** * * * * * * * * * * * * * * * * * * * * *
 * Web app object
 * @author Victor Jonsson
 * @license Dual licensed under the MIT and the GPLv2 licenses
 */
var WebApp = (function(win) {


    /** * * * * * * * * * * * * * * * * * * * * *
     * Base64 class
     * @copyright Chris Vennes (2002-2001)
     */
    var Base64={};Base64.code="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";Base64.encode=function(str,utf8encode){utf8encode=typeof utf8encode=="undefined"?false:utf8encode;var o1,o2,o3,bits,h1,h2,h3,h4,e=[],pad="",c,plain,coded;var b64=Base64.code;plain=utf8encode?str.encodeUTF8():str;c=plain.length%3;if(c>0){while(c++<3){pad+="=";plain+="\0"}}for(c=0;c<plain.length;c+=3){o1=plain.charCodeAt(c);o2=plain.charCodeAt(c+1);o3=plain.charCodeAt(c+2);bits=o1<<16|o2<<8|o3;h1=bits>>18&63;h2=bits>>12&63;h3=bits>>6&63;h4=bits&63;e[c/3]=b64.charAt(h1)+b64.charAt(h2)+b64.charAt(h3)+b64.charAt(h4)}coded=e.join("");coded=coded.slice(0,coded.length-pad.length)+pad;return coded};Base64.decode=function(str,utf8decode){utf8decode=typeof utf8decode=="undefined"?false:utf8decode;var o1,o2,o3,h1,h2,h3,h4,bits,d=[],plain,coded;var b64=Base64.code;coded=utf8decode?str.decodeUTF8():str;for(var c=0;c<coded.length;c+=4){h1=b64.indexOf(coded.charAt(c));h2=b64.indexOf(coded.charAt(c+1));h3=b64.indexOf(coded.charAt(c+2));h4=b64.indexOf(coded.charAt(c+3));bits=h1<<18|h2<<12|h3<<6|h4;o1=bits>>>16&255;o2=bits>>>8&255;o3=bits&255;d[c/4]=String.fromCharCode(o1,o2,o3);if(h4==64)d[c/4]=String.fromCharCode(o1,o2);if(h3==64)d[c/4]=String.fromCharCode(o1)}plain=d.join("");return utf8decode?plain.decodeUTF8():plain};var Utf8={};Utf8.encode=function(strUni){var strUtf=strUni.replace(/[\u0080-\u07ff]/g,function(c){var cc=c.charCodeAt(0);return String.fromCharCode(192|cc>>6,128|cc&63)});strUtf=strUtf.replace(/[\u0800-\uffff]/g,function(c){var cc=c.charCodeAt(0);return String.fromCharCode(224|cc>>12,128|cc>>6&63,128|cc&63)});return strUtf};Utf8.decode=function(strUtf){var strUni=strUtf.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,function(c){var cc=(c.charCodeAt(0)&15)<<12|(c.charCodeAt(1)&63)<<6|c.charCodeAt(2)&63;return String.fromCharCode(cc)});strUni=strUni.replace(/[\u00c0-\u00df][\u0080-\u00bf]/g,function(c){var cc=(c.charCodeAt(0)&31)<<6|c.charCodeAt(1)&63;return String.fromCharCode(cc)});return strUni};var RC4Cipcher={encrypt:function(key,pt){var s=new Array;for(var i=0;i<256;i++){s[i]=i}var j=0,x;for(i=0;i<256;i++){j=(j+s[i]+key.charCodeAt(i%key.length))%256;x=s[i];s[i]=s[j];s[j]=x}i=0;j=0;var ct="";for(var y=0;y<pt.length;y++){i=(i+1)%256;j=(j+s[i])%256;x=s[i];s[i]=s[j];s[j]=x;ct+=String.fromCharCode(pt.charCodeAt(y)^s[(s[i]+s[j])%256])}return ct},decrypt:function(key,ct){return this.encrypt(key,ct)}};

    // Detect possible IE version
    var IS_OLD_IE = false;
    if( win.navigator.userAgent.toLowerCase().indexOf('msie ') > -1) {
        IS_OLD_IE = parseFloat(navigator.appVersion.split("MSIE")[1]) < 10;
    }

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

            throw new Error('Unable to parse JSON')
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

    return {

        events : EventManager,

        filesToLoad : 0,

        concurrentRequests : 0,

        resources : {},

        manifest : null,

        isDownloaded : false,

        /**
         * Start the web app
         */
        start : function() {
            var _self = this;
            this.request('app.manifest', function(response) {

                _self.manifest = Utils.parseJSON(response);

                var currentVersion = Utils.versionToFloat( win.localStorage.getItem(_self.manifest.name+'-app-version') );
                var newVersion = Utils.versionToFloat(_self.manifest.version);
                _self.isDownloaded = newVersion == currentVersion;

                _self.events.call('init');

                if( IS_OLD_IE ) {
                    _self.moveImagesToNoCache();
                }

                // Download new version
                if( !_self.isDownloaded ) {
                    console.log('Downloading new app');
                    _self.downloadApp(currentVersion);
                }
                else {
                    console.log('Loading app from local storage');
                    _self.downloadUnCachedFiles(function() {
                        _self.initiateFiles();
                    });
                }
            });
        },

        /**
         * Function called in old versions of Internet explorer that
         * moves images from "file" declaration to "nocache" declaration.
         * This is needed because internet explorer (v <= 10) can't
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
            };

            // old ie can not cache images
            var fileCopy = this.manifest.files.slice(0, this.manifest.files.length);
            for(i=0; i < fileCopy.length; i++) {
                if( Utils.isImageFile(fileCopy[i]) ) {
                    this.manifest.nocache.push(fileCopy[i]);
                    this.manifest.files.splice(getFileIndex(fileCopy[i]), 1);
                }
            }
        },

        /**
         * Add content to DOM
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

            // Image resource
            else if( Utils.isImageFile(file) ) {
                var img = new Image();
                img.src = content;
                this.resources[file] = img;
            }

            // Text resource
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
                    console.log('halted download...');
                    break;
                }
                this.request(this.manifest.files[i], function(content, http, file) {
                    try {
                        win.localStorage.setItem(appName+'-file-'+file, content);
                    } catch(e) {
                        console.log(e);
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

            if( this.manifest.nocache ) {
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
                        this.request(file, function(content, http, file) {
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
            if( this.concurrentRequests > 1 ) {
                setTimeout(function() {
                    _self.request(URL, callback);
                }, 500);
            }
            else {
                this.concurrentRequests++;
                setTimeout(function() {
                    var http = 'XMLHttpRequest' in win ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
                    if( 'overrideMimeType' in http ) {
                        http.overrideMimeType('text/plain; charset=x-user-defined');
                    }
                    http.onreadystatechange = function() {
                        if( http.readyState == 4 ) {
                            _self.concurrentRequests--;
                            if( http.status != 200 ) {
                                console.warn(URL+' responded with status '+http.status+', retrying...');
                                _self.request(URL, callback);
                            } else {
                                if( Utils.isImageFile(URL) ) {
                                    var data = '';
                                    var dataLen = http.responseText.length-1;
                                    for (var i=0; i<=dataLen; i++)
                                        data += String.fromCharCode(http.responseText.charCodeAt(i) & 0xff);

                                    var ext = URL.substr(URL.length-4, 4).toLocaleLowerCase();
                                    if( ext != 'jpeg' )
                                        ext = ext.substr(1, 3);

                                    callback('data:image/'+ext+';base64,'+Base64.encode(data), http, URL);
                                }
                                else {
                                    callback(http.responseText, http, URL);
                                }
                            }
                        }
                    };
                    http.open("GET", URL, false);
                    http.send();
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


/**
 * App initiation. Replace this code with something of your own if
 * you want to customaize the preloader screen
 */
(function(WebApp, win) {

    var panel, loadedElem, numElem, infoElem, progressBar;

    var fadePanel = function(callback) {
        var opac = panel.style.opacity;
        opac = (opac ? parseFloat(opac) : 1) - 0.04;
        panel.style.opacity = opac;
        if( opac > 0 ) {
            panel.style.filter = 'alpha('+(opac * 100)+')';
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
        console.log('Manifest downloaded');
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
            // now loading files declared as "nocache"
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
        console.log('app ready');
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