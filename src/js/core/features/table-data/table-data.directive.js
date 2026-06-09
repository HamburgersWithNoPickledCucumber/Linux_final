angular.module('linuxDash').directive('tableData', ['server', '$rootScope', function (server, $rootScope) {
  return {
    scope: {
      heading: '@',
      info: '@',
      moduleName: '@',
      width: '@',
      height: '@'
    },
    templateUrl: 'src/js/core/features/table-data/table-data.html',
    link: function(scope, element) {

      scope.sortByColumn = null
      scope.sortReverse = null

      scope.setSortColumn = function(column) {
        if (column === scope.sortByColumn) {
          scope.sortReverse = !scope.sortReverse
        } else {
          scope.sortByColumn = column
        }
        scope.sortTableRows()
      }

      scope.sortTableRows = function() {
        scope.tableRows.sort(function(currentRow, nextRow) {
          var sortResult = 0
          if (currentRow[scope.sortByColumn] < nextRow[scope.sortByColumn]) {
            sortResult = -1
          } else if (currentRow[scope.sortByColumn] === nextRow[scope.sortByColumn]) {
            sortResult = 0
          } else {
            sortResult = 1
          }
          if (scope.sortReverse) {
            sortResult = -1 * sortResult
          }
          return sortResult
        })
      }

      var buildCsv = function() {
        if (!scope.tableRows || scope.tableRows.length === 0) {
          $rootScope.csvCache = $rootScope.csvCache || {};
          delete $rootScope.csvCache[scope.moduleName];
          return;
        }
        var headers = scope.tableHeaders || Object.keys(scope.tableRows[0]);
        var csv = headers.map(function(h) { return '"' + h + '"'; }).join(',') + '\n';
        scope.tableRows.forEach(function(row) {
          csv += headers.map(function(h) {
            var v = row[h];
            if (v === null || v === undefined) return '';
            return '"' + String(v).replace(/"/g, '""') + '"';
          }).join(',') + '\n';
        });
        $rootScope.csvCache = $rootScope.csvCache || {};
        $rootScope.csvCache[scope.moduleName] = csv;
      };

      scope.getData = function() {
        delete scope.tableRows

        server.get(scope.moduleName, function(serverResponseData) {

          if (serverResponseData.length > 0) {
            scope.tableHeaders = Object.keys(serverResponseData[0])
          }

          scope.tableRows = serverResponseData
          buildCsv()

          if (scope.sortByColumn) {
            scope.sortTableRows()
          }

          scope.lastGet = new Date().getTime()

          if (serverResponseData.length < 1) {
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