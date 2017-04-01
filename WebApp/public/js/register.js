/**
 * Created by Githiora_Wamunyu on 4/1/2017.
 */
// (function() {
//
//     $('#login-form-link').click(function(e) {
//         $("#login-form").delay(100).fadeIn(100);
//         $("#register-form").fadeOut(100);
//         $('#register-form-link').removeClass('active');
//         $(this).addClass('active');
//         e.preventDefault();
//     });
//     $('#register-form-link').click(function(e) {
//         $("#register-form").delay(100).fadeIn(100);
//         $("#login-form").fadeOut(100);
//         $('#login-form-link').removeClass('active');
//         $(this).addClass('active');
//         e.preventDefault();
//     });
//
// });

$(document).ready(function() {
    $('login-form').submit(function(e) {
        e.preventDefault();

        // http://stackoverflow.com/questions/1184624/convert-form-data-to-javascript-object-with-jquery
        const formData = {};
        $(e.target).serializeArray().map(function(x){formData[x.name] = x.value;});

        $.post('/v1/session', formData)
            .done((result) => {
                window.location = 'listings.html';
                localStorage.setItem('username', result.vunetid);
                localStorage.setItem('email', result.primary_email);
            })
            .fail((err) => {
                alert('Could not authenticate user. Please try again.');
                localStorage.removeItem('username');
                localStorage.removeItem('email');
                console.error(err);
            });
    });
});
