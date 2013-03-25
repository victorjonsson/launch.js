
WebApp.on('ready', function() {

    // Background images
    var bgImageIndex = 0;
    var bgImages = [
            'img/los-angeles-skyline.jpg',
            'img/morning-glory-pool.jpg',
            'img/yosemite-stream.jpg',
            'img/mountain-109.jpg'
        ];

    // Set initial background
    var $currentBackground = $('.clock-background');
    var img = WebApp.resources[bgImages[0]];
    img.style.width = '100%';
    img.style.height = '100%';
    $currentBackground.append(img);

    // Function that switches background
    var switchBackgroundImage = function() {
        bgImageIndex++;
        if( bgImageIndex == bgImages.length )
            bgImageIndex = 0;
        var img = WebApp.resources[bgImages[bgImageIndex]];
        img.style.width = '100%';
        img.style.height = '100%';
        var $newBackground = $('<div></div>');
        $newBackground.append(img);
        $newBackground.addClass('clock-background');
        $newBackground.insertBefore($currentBackground);
        $currentBackground.fadeOut('slow', function() {
            $currentBackground.remove();
            $currentBackground = $newBackground;
        });
    };

    // Start background switcher
    setInterval(switchBackgroundImage, 7000);

    // Setup clock
    var $clock = $('#clock');
    var showTime = function() {
        var now = new Date();
        $clock.text(now.toTimeString().split(' ')[0]);
    };
    showTime();
    setInterval(showTime, 500);

    // Add reload button
    $('<button></button>')
        .text('Clear cache and reload app')
        .addClass('reload-button')
        .appendTo('body')
        .bind('click', function() {
            WebApp.removeApp();
            window.location.reload();
        });
});