angular.module('linuxDash').directive('navBar', ['$location', '$rootScope', function($location, $rootScope) {
  return {
    template: '\
      \
      <span class="title">BOARD</span>\
      \
      <ul> \
        <li ng-class="{active: isActive(navItem) }" ng-repeat="navItem in items"> \
          <a href="#/{{navItem}}" ng-bind="getNavItemName(navItem)"></a> \
        </li> \
      </ul> \
      <button class="theme-toggle-btn pause-btn" ng-click="togglePause()" title="Pause/Resume (Space)">{{ pauseIcon }}</button>\
      <button class="theme-toggle-btn" ng-click="toggleTheme()" title="Toggle theme (D)">{{ themeIcon }}</button>\
    ',
    link: function(scope) {
      scope.items = [
        'system-status',
        'basic-info',
        'network',
        'accounts',
        'apps'
      ]

      scope.getNavItemName = function(url) {
        return url.replace('-', ' ')
      }

      scope.isActive = function(route) {
        return '/' + route === $location.path()
      }

      // Theme toggle
      var stored = localStorage.getItem('theme') || 'dark'
      scope.theme = stored
      scope.themeIcon = stored === 'dark' ? '☀' : '🌙'
      document.documentElement.setAttribute('data-theme', stored)

      scope.toggleTheme = function() {
        scope.theme = scope.theme === 'dark' ? 'light' : 'dark'
        scope.themeIcon = scope.theme === 'dark' ? '☀' : '🌙'
        localStorage.setItem('theme', scope.theme)
        document.documentElement.setAttribute('data-theme', scope.theme)
      }

      // Listen for keyboard shortcut to toggle theme
      scope.$on('toggle-theme', function() {
        scope.toggleTheme()
      })

      // Pause / resume toggle
      scope.pauseIcon = '▶'
      scope.togglePause = function() {
        $rootScope.$broadcast('toggle-pause')
      }

      scope.$on('toggle-pause', function() {
        scope.pauseIcon = scope.pauseIcon === '▶' ? '⏸' : '▶'
      })

      // Refresh all
      var refreshAllHandler = scope.$on('refresh-all', function() {
        $rootScope.$broadcast('refresh-all-plugins')
      })

      scope.$on('$destroy', function() {
        refreshAllHandler()
      })
    }
  }
}])