function runFn(server, $location, $rootScope, $document) {
  server.checkIfWebsocketsAreSupported()

  $rootScope.$on("$locationChangeSuccess", function(event, next, current) {
    var nextRoute = next.split('#')[1]
    if (nextRoute !== '/loading') {
      localStorage.setItem('currentTab', nextRoute)
    }
  });

  // Keyboard shortcuts
  var tabRoutes = ['/system-status', '/basic-info', '/network', '/accounts', '/apps'];
  $document.bind('keydown', function(e) {
    // Don't trigger when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    var key = e.key;
    if (key >= '1' && key <= '5') {
      e.preventDefault();
      $rootScope.$apply(function() {
        $location.path(tabRoutes[parseInt(key) - 1]);
      });
    } else if (key === 'd' || key === 'D') {
      e.preventDefault();
      $rootScope.$broadcast('toggle-theme');
    } else if (key === 'r' || key === 'R') {
      e.preventDefault();
      $rootScope.$broadcast('refresh-all');
    } else if (key === ' ') {
      e.preventDefault();
      $rootScope.$broadcast('toggle-pause');
    }
  });

  $location.path('/loading')
}

angular
  .module('linuxDash', ['ngRoute'])
  .run([ 'server', '$location', '$rootScope', '$document', runFn])
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false)
  }])