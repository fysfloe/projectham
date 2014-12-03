/**
 * Created with JetBrains WebStorm.
 * User: SantiagoPC
 * Date: 25/08/13
 * Time: 13:38
 * To change this template use File | Settings | File Templates.
 */

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