    function successHandler(data) {
        console.log("success handler");
        alert("Hello");
        window.location.replace('/login/callback');
      }
   
      function failureHandler(data) {
        console.log("failure handler");
        //alert("Login failed!!")
      }

     function initLoginWidget() {
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
        "apiFqdn": "abc0123-kcv.my.localdev.idaptive.app",
        //"appKey": "781576a4-c86c-4f48-bc68-c80a0e137189",
        "success": successHandler,
        "failure": failureHandler
        });
        });
    }
