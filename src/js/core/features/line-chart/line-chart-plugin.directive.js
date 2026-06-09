angular.module('linuxDash').directive('lineChartPlugin', [
  '$interval', '$compile', 'server', '$window', '$rootScope',
  function ($interval, $compile, server, $window, $rootScope) {
    return {
      scope: {
        heading: '@',
        moduleName: '@',
        refreshRate: '=',
        maxValue: '=',
        minValue: '=',
        getDisplayValue: '=',
        metrics: '=',
        color: '@'
      },
      templateUrl: 'src/js/core/features/line-chart/line-chart-plugin.html',
      link: function(scope, element) {

        scope.initializing = true

        var start_rendering_line_chart = function () {

          if (!scope.color)
            scope.color = '0, 255, 0'

          var series, w, h, canvas

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
              millisPerLine: 3000,
              borderVisible: false
            },
            labels: {
              fontSize: 11,
              precision: 0,
              fillStyle: '#0f0e0e'
            },
            maxValue: parseInt(scope.maxValue),
            minValue: parseInt(scope.minValue),
            horizontalLines: [{
              value: 5,
              color: '#eff',
              lineWidth: 1
            }]
          })

          var initializeChart = function () {
            var checkForCanvasReadyState = $interval(function () {
              if (element.find('canvas')[0]) {
                canvas  = element.find('canvas')[0]
                series  = series || new TimeSeries()
                w       = canvas.width
                h       = canvas.height

                if (chart.seriesSet.length > 0)
                  chart.removeTimeSeries(chart.seriesSet[0].timeSeries)

                chart.addTimeSeries(series, {
                  strokeStyle: 'rgba(' + scope.color + ', 1)',
                  fillStyle: 'rgba(' + scope.color + ', 0.2)',
                  lineWidth: 2
                })

                chart.streamTo(canvas, 1000)
                $interval.cancel(checkForCanvasReadyState)
              }
            }, 100)
          }

          scope.reInitializeChart = function () {
            initializeChart()
          }

          if (!scope.isHidden)
            initializeChart()

          scope._dataCallInProgress = false

          scope.getData = function() {

            if(scope.initializing)
              scope.initializing = false

            if (scope._dataCallInProgress || !element.find('canvas')[0]) return

            scope._dataCallInProgress = true

            server.get(scope.moduleName, function(serverResponseData) {

              scope._dataCallInProgress = false

              if (!serverResponseData || serverResponseData.length < 1) {
                scope.emptyResult = true
                return
              }

              scope.lastGet = new Date().getTime()

              if (scope.maxValue / 4 * 3 < scope.getDisplayValue(serverResponseData)) {
                chart.seriesSet[0].options.strokeStyle = 'rgba(255, 89, 0, 1)'
                chart.seriesSet[0].options.fillStyle = 'rgba(255, 89, 0, 0.2)'
              } else if (scope.maxValue / 3 < scope.getDisplayValue(serverResponseData)) {
                chart.seriesSet[0].options.strokeStyle = 'rgba(255, 238, 0, 1)'
                chart.seriesSet[0].options.fillStyle = 'rgba(255, 238, 0, 0.2)'
              } else {
                chart.seriesSet[0].options.strokeStyle = 'rgba(' + scope.color + ', 1)'
                chart.seriesSet[0].options.fillStyle = 'rgba(' + scope.color + ', 0.2)'
              }

              scope.newData = scope.getDisplayValue(serverResponseData)
              series.append(scope.lastGet, scope.newData)

              scope.metrics.forEach(function(metricObj) {
                metricObj.data = metricObj.generate(serverResponseData)
              })

            })
          }

          var intervalRef = $interval(scope.getData, scope.refreshRate)
          var removeInterval = function() {
            $interval.cancel(intervalRef)
          }

          element.on("$destroy", removeInterval)
        }

        var stopWatching = scope.$watch('maxValue', function (n, o) {
          if (n) {
            start_rendering_line_chart()
            stopWatching()
          }
        })

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