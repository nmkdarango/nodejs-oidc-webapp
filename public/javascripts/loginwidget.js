//Use successHandler and failureHandler if we need to receive a callback to separate function
    // function successHandler(data) {
    //     console.log("success handler");
    //     alert("Hello");
    //     window.location.replace('/login/callback');
    //   }
   
    //   function failureHandler(data) {
    //     console.log("failure handler");
    //     //alert("Login failed!!")
    //   }

     function initializeLoginWidget(tenantFqdn) {
        document.addEventListener('DOMContentLoaded', function () {
        LaunchLoginView({
        "success": "loginSuccess",
        "containerSelector": ".idaptive-login",
        "initialTitle": "Login",
        "defaultTitle": "Authentication",
        "allowSocialLogin": true,
        "allowRememberMe": true,
        "allowRegister": true,
        "allowForgotUsername": false,
        "apiFqdn": tenantFqdn,
        "appKey": "7f9e43f6-8820-458d-92c6-83ce338ca208"
        //"success": successHandler,
        //"failure": failureHandler
        });
        });
    }
