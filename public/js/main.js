var projectham = projectham || {};

projectham.module = (function($) {

    var appView,
        init;

    init = function() {
        localStorage.clear();
        appView = new projectham.AppView();
    };

    $(document).ready(init);

}($));