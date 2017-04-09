$(function() {

    $('#login-form-link').click(function(e) {
        $("#login-form").delay(100).fadeIn(100);
        $("#register-form").fadeOut(100);
        $('#register-form-link').removeClass('active');
        $(this).addClass('active');
        e.preventDefault();
    });
    $('#register-form-link').click(function(e) {
        $("#register-form").delay(100).fadeIn(100);
        $("#login-form").fadeOut(100);
        $('#login-form-link').removeClass('active');
        $(this).addClass('active');
        e.preventDefault();
    });

});


$(document).ready(function() {
    $('login-form').submit(function(e) {
        console.log("REACHED");
        e.preventDefault();

        // http://stackoverflow.com/questions/1184624/convert-form-data-to-javascript-object-with-jquery
        const formData = {};
        $(e.target).serializeArray().map(function(x){formData[x.name] = x.value;});
        console.log("reached2");
        $.post('/v1/session', formData)
            .done((result) => {
                console.log("reached");
                window.location = 'listings.html';
                localStorage.setItem('vunetid', result.vunetid);
                localStorage.setItem('primary_email', result.primary_email);
            })
            .fail((err) => {
                alert('Could not authenticate user. Please try again.');
                localStorage.removeItem('vunetid');
                localStorage.removeItem('primary_email');
                console.error(err);
            });
    });
/*
    $('register-form').submit(function(e) {
        e.preventDefault();
        console.log("REACHEDDD");
        // http://stackoverflow.com/questions/1184624/convert-form-data-to-javascript-object-with-jquery
        const formData = {};
        $(e.target).serializeArray().map(function(x){formData[x.name] = x.value;});

       // $("#error").hide();
/!*        const valid = [validateUsername, validatePassword].every(validator => {
            const error = validator(formData);
            if (error) {
                $("#error").text(error).show();
                return false;
            }
            return true;
        });

        if (!valid) {
            return;
        }*!/

        $.post('/v1/user', formData)
            .done((result) => {
                localStorage.setItem('vunetid', result.vunetid);
                localStorage.setItem('email', result.primary_email);
                window.location = `/listings.html`
                console.log(result);
            })
            .fail((err) => {
                alert('Error signing up. Please try again.');
                console.error(err);
            });
    });*/

});

$(document).ready(function() {
    $('#register-form').submit(function(e) {
        e.preventDefault();
        console.log("REACHEDDD");
        // http://stackoverflow.com/questions/1184624/convert-form-data-to-javascript-object-with-jquery
        const formData = {};
        $(e.target).serializeArray().map(function(x){formData[x.name] = x.value;});

        $.post('/v1/user', formData)
            .done((result) => {
                localStorage.setItem('vunetid', result.vunetid);
                localStorage.setItem('email', result.primary_email);
                //window.location = `/listings.html`
                console.log("user created");
            })
            .fail((err) => {
                alert('Error signing up. Please try again.');
                console.error(err);
            });
    });
});


/*
const validateUsername = function(data) {
    const {username} = data;
    if (username.length < 6 || username.length > 16) {
        return 'Username must be between 6-16 characters';
    } else if (!ALPHANUMERIC_REGEX_PATTERN.test(username)) {
        return 'Username must be alphanumeric';
    }
};

const validatePassword = function(data) {
    const {password} = data;
    if (password.length < 8) {
        return 'Password must be greater than 8 characters';
    } else if (!LOWERCASE_REGEX_PATTERN.test(password)) {
        return 'Password must contain a lowercase letter';
    } else if (!UPPERCASE_REGEX_PATTERN.test(password)) {
        return 'Password must contain a uppercase letter';
    } else if (!NUMBER_REGEX_PATTERN.test(password)) {
        return 'Password must contain a number';
    } else if (!SYMBOL_REGEX_PATTERN.test(password)) {
        return 'Password must contain a symbol';
    }
};
*/
