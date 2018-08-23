$(document).ready(function () {
    console.log('Document is ready')
    $('#learn-more').click(function () {
        $('html, body').animate({
            scrollTop: $('#about').offset().top
        }, 500);
    });
    $('#try-today').click(function () {
        $('html, body').animate({
            scrollTop: $('#new-game').offset().top
        }, 500);
    });
});