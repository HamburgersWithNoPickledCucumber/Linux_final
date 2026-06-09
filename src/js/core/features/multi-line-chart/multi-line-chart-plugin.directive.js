angular.module('linuxDash').directive('multiLineChartPlugin', [
  '$interval', '$compile', 'server', '$window', '$rootScope',
  function ($interval, $compile, server, $window, $rootScope) {
    return {
      scope: {
        heading: '@',
        moduleName: '@',
        refreshRate: '=',
        getDisplayValue: '=',
        units: '=',
        delay: '='
      },
      templateUrl: 'src/js/core/features/multi-line-chart/multi-line-chart-plugin.html',
      link: function(scope, element) {

        var w, h, canvas

        angular.element($window).bind('resize', function() {
          canvas.width = w
          canvas.height = h
        })

        var chart = new SmoothieChart({
          borderVisible: false,
          sharpLines: true,
          grid: {
            fillStyle: '#ffffff',
            strokeStyle: 'rgba(232,230,230,0.93)',
            sharpLines: true,
            borderVisible: false
          },
          labels: {
            fontSize: 12,
            precision: 0,
            fillStyle: '#0f0e0e'
          },
          maxValue: 100,
          minValue: 0,
          horizontalLines: [{
            value: 1,
            color: '#ecc',
            lineWidth: 1
          }]
        })

        var seriesOptions = [
          { strokeStyle: 'rgba(255, 0, 0, 1)', lineWidth: 2 },
          { strokeStyle: 'rgba(0, 255, 0, 1)', lineWidth: 2 },
          { strokeStyle: 'rgba(0, 0, 255, 1)', lineWidth: 2 },
          { strokeStyle: 'rgba(255, 255, 0, 1)', lineWidth: 1 }
        ]

        scope.seriesArray  = []
        scope.metricsArray = []

        var delay = 1000
        if (angular.isDefined(scope.delay))
          delay = scope.delay

        var initializeChart = function () {
          var checkForCanvasReadyState = $interval(function () {
            if (element.find('canvas')[0]) {
              canvas  = element.find('canvas')[0]
              w       = canvas.width
              h       = canvas.height

              server.get(scope.moduleName, function(serverResponseData) {
                var numberOfLines = Object.keys(serverResponseData).length
                for (var x = 0; x < numberOfLines; x++) {
                  var keyForThisLine = Object.keys(serverResponseData)[x];
                  scope.seriesArray[x] = new TimeSeries();
                  chart.addTimeSeries(scope.seriesArray[x], seriesOptions[x]);
                  scope.metricsArray[x] = {
                    name: keyForThisLine,
                    color: seriesOptions[x].strokeStyle,
                  }
                }
              })

              chart.streamTo(canvas, delay)
              $interval.cancel(checkForCanvasReadyState)
            }
          }, 100)
        }

        scope.reInitializeChart = function () {
          chart.seriesSet.forEach(function (ts) {
            chart.removeTimeSeries(ts.timeSeries)
          })
          initializeChart()
        }

        if (!scope.isHidden)
          initializeChart()

        scope._dataCallInProgress = false

        scope.getData = function() {

          if (scope._dataCallInProgress) return
          if (!scope.seriesArray.length) return

          scope._dataCallInProgress = true

          server.get(scope.moduleName, function(serverResponseData) {

            scope._dataCallInProgress = false
            scope.lastGet = new Date().getTime()
            var keyCount = 0
            var maxAvg = 100

            for (var key in serverResponseData) {
              scope.seriesArray[keyCount].append(scope.lastGet, serverResponseData[key])
              keyCount++
              maxAvg = Math.max(maxAvg, serverResponseData[key])
            }

            scope.metricsArray.forEach(function(metricObj) {
              metricObj.data = serverResponseData[metricObj.name].toString() + ' ' + scope.units
            })

            var len = parseInt(Math.log(maxAvg) / Math.log(10))
            var div = Math.pow(10, len)
            chart.options.maxValue = Math.ceil(maxAvg / div) * div

          })

        }

        var refreshRate = (angular.isDefined(scope.refreshRate)) ? scope.refreshRate : 1000
        var intervalRef = $interval(scope.getData, refreshRate)
        var removeInterval = function() {
          $interval.cancel(intervalRef)
        }

        element.on("$destroy", removeInterval)

        var refreshHandler = $rootScope.$on('refresh-all-plugins', function() {
          scope._dataCallInProgress = false;
          if (scope.getData) scope.getData();
        });

        scope.$on('$destroy', function() {
          refreshHandler();
        })
      }
    }
  }
])