# launch.js

Lorem te ipsum...

[Here you can see a demo app](http://victorjonsson.se/launch/)

#### Browser support

IE v8+, Firefox v18+, Safari v5.1+, Chrome v21+, Opera v12.1+, iOS Safari v4.2+, Android browser v2.1+

## The manifest

Launch.js will start of by loading a manifest from your server (app.manifest). This manifest holds
information about which files that is required by the app. Example:

```json
{
    "name" : "my-app",
    "version" : "1.3",
    "files" : [
        "css/style.css",
        "js/main.js",
        "js/another-script.js"
        "img/some-large-image.jpg",
        "app.html"
    ],
    "nocache" : [
        "http://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js",
        "http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.2/jquery-ui.min.js"
    ],
    "main" : "app.html"
}
```

#### name *(required)*

The name property will not be displayed anywhere, its only used as namespace for your downloaded files.

#### version *(required)*

The version property has to be a [semantic version number](http://semver.org/). Launch.js will remove all
app files and download them again when you increase the version number.

#### files *(required)*

An array with all the files that is required by your app and that should be saved to local storage. Be vary when
declaring several large images so that you won't exceed the local storage quota. In case you do exceed
the quota, the user will become notified that the local storage quota in the browser has to be increased.

The content of stylesheets and javascripts will asynchroniuosly becom added to the DOM. Other files (such as images)
will be accessible through `WebApp.resources`. Example:

```js
    $('#some-element').append( WebApp.resources['img/some-large-image.jpg'] );
```

Images will not be saved to local storage in those browsers that doesn't support Canvas. You can still access the images
 through `WebApp.resources` but they will be downloade every time the web page gets loaded.


#### nocache *(required)*

Here is where you place files that your app is dependent on but that should'nt be saved to local storage. Third-party
scripts must be declared in this property.

#### main

This property is used to point to one of the files in the app which content should be added to DOM once all files is
downloaded. The file must be present in the `file` property, and it has to contain HTML (*this property is optional*)


## What about window.onload?

Your ordinary window.onload (or perhaps `$(window).readey(...)`) will no longer work since the files will be added to
the DOM after that the page is loaded. Instead you should use `WebApp.on('ready', function() { ... })`

## Hello World!

**index.html**

```html
<html>
  <head>
      <title>Hello World!</title>
  </head>
  <body>
      <div id="launch-panel">
        <h1 style="text-align:center">Hello World App</h1>
        <div id="launch-progress">
            <div id="launch-progress-bar"></div>
        </div>
        <div id="launch-progress-info">
            Downloading manifest...
        </div>
</div>
<script src="launch/launch.min.js"></script>
  </body>
</html>
```


