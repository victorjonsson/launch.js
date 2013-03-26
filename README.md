# launch.js

Lorem te ipsum...

[Here you can see a demo app](http://victorjonsson.se/launch/)

#### Browser support

IE v8+, Firefox v18+, Safari v5.1+, Chrome v21+, Opera v12.1+, iOS Safari v4.2+, Android browser v2.1+

## The manifest

Launch.js will start of by loading a manifest from your server (app.manifest). This manifest holds the
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

An array with all the files that is required by your app and that should be saved to local storage. Be vary of
declaring a lot of large images so that you won't exceed the local storage quota. In case you do exceed
the quota the user will alerted that the local storage quota has to be increased.

No image will be saved to local storage in those browsers that doesn't support Canvas. They will be still be
available
