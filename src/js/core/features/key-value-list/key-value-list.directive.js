angular.module('linuxDash').directive('keyValueList', ['server', '$rootScope', function (server, $rootScope) {
  return {
    scope: {
      heading: '@',
      info: '@',
      moduleName: '@',
    },
    templateUrl: 'src/js/core/features/key-value-list/key-value-list.html',
    link: function(scope, element) {

      var buildCsv = function() {
        if (!scope.tableRows || Object.keys(scope.tableRows).length === 0) {
          $rootScope.csvCache = $rootScope.csvCache || {};
          delete $rootScope.csvCache[scope.moduleName];
          return;
        }
        var csv = 'Key,Value\n';
        Object.keys(scope.tableRows).forEach(function(key) {
          var v = scope.tableRows[key];
          if (v === null || v === undefined) v = '';
          csv += '"' + key + '","' + String(v).replace(/"/g, '""') + '"\n';
        });
        $rootScope.csvCache = $rootScope.csvCache || {};
        $rootScope.csvCache[scope.moduleName] = csv;
      };

      scope.getData = function() {
        delete scope.tableRows

        server.get(scope.moduleName, function(serverResponseData) {
          scope.tableRows = serverResponseData
          scope.lastGet = new Date().getTime()
          buildCsv()

          if (Object.keys(serverResponseData).length === 0) {
            scope.emptyResult = true
          }

          if (!scope.$$phase && !$rootScope.$$phase) scope.$digest()
        })
      }

      scope.getData()

      var refreshHandler = $rootScope.$on('refresh-all-plugins', function() {
        scope.getData();
      });

      scope.$on('$destroy', function() {
        refreshHandler();
      })
    }
  }
}])