/*

jQuery Graphie Plugin
version 0.2.3

Copyright (c) 2011 Cameron Daigle, http://camerondaigle.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function($) {

  var opts;

  $.fn.graphie = function(options) {
    var defaults = {
      type: 'line',
      line: {
        bgcolor: '#5ad0ea',
        smoothing: 'auto',
        stroke: '#5ad0ea',
        stroke_width: 0,
        column_width: 'auto'
      },
      labels: {
        x: 5,
        y: 5,
        color: '#000',
        family: 'Helvetica, arial, sans-serif',
        weight: 'bold',
        size: 12
      }
    };
    return this.each(function() {
      opts = $.extend(true, defaults, options);
      var graph = initGraph($(this));
      var data = parseData($(this));
      drawLine(graph, data.points);
      attachLabels(graph, data.labels);
    });

  };

  function initGraph($el) {
    $el.addClass('graphie');
    opts.w = $el.width();
    opts.h = $el.height();
    $el.children().hide();
    return Raphael($el.attr('id'), opts.w, opts.h);
  }

  function parseData($el) {
    var data = {
      points: [],
      labels: []
    };
    var parsers = {
      'dl': function() {
        data.labels.push($el.find('dt:first').text());
        data.labels.push($el.find('dt:last').text());
        $el.find('dd').each(function() {
          data.points.push(parseInt($(this).text(), 10));
        });
        return data;
      },
      'table': function() {
        data.labels.push($el.find('tr:first td:first').text());
        data.labels.push($el.find('tr:last td:first').text());
        $el.find('tr').each(function() {
          data.points.push([
            parseInt($(this).find('td:first').text(), 10),
            parseInt($(this).find('td:last').text(), 10)
          ]);
        });
        return data;
      },
      'ul': function() {
        $el.find('li').each(function() {
          data.points.push(parseInt($(this).text(), 10));
        });
        return data;
      }
    };
    parsers.ol = parsers.ul;
    return parsers[$el[0].tagName.toLowerCase()]();
  };

  function drawLine(graph, points) {
    var coords = 'M0 ' + opts.h,
        line = graph.path(coords).attr({stroke: opts.line.stroke, "stroke-width": opts.line.stroke_width, fill: opts.line.bgcolor}),
        scale = getYScale(points),
        x, y, interval;
    var types = {
      'line': function() {
        interval = opts.w / (points.length - 1);
        opts.line.smoothing === 'auto' ? opts.line.smoothing = interval / 2 : false;
        if (!opts.line.bgcolor) {
          coords = 'M0 ' + (opts.h - (scale * points[0]));
        }
        for(var i = 0, j = points.length; i < j; i++) {
          x = interval * i;
          y = (opts.h - (scale * points[i]));
          coords += ' S' + (x - opts.line.smoothing) + ' ' + y + ' ' + x + ' ' + y;
        }
        if (opts.line.bgcolor) {
          coords += ' L' + opts.w + ' ' + opts.h;
        }
        return coords;
      },
      'x_line': function() {
        x_scale = getXScale(points);
        opts.line.smoothing === 'auto' ? opts.line.smoothing = x_scale / 2 : false;
        if (!opts.line.bgcolor) {
          coords = 'M0 ' + (opts.h - (scale * points[0]));
        }
        for(var i = 0, j = points.length; i < j; i++) {
          x = x_scale * points[i][0];
          y = (opts.h - (scale * points[i][1]));
          coords += ' S' + (x - opts.line.smoothing) + ' ' + y + ' ' + x + ' ' + y;
        }
        if (opts.line.bgcolor) {
          coords += ' L' + opts.w + ' ' + opts.h;
        }
        return coords;
      },
      'column': function() {
        if (opts.line.column_width === 'auto') {
          interval = (opts.w - points.length - 1) / points.length;
        } else {
          interval = +opts.line.column_width;
        }
        interval = interval > 1 ? Math.floor(interval) : 1;
        coords += ' L';
        x = 0;
        for(var i = 0, j = points.length; i < j; i++) {
          y = Math.floor(opts.h - (scale * points[i]));
          coords += x + ' ' + y + ' ' + (x + interval) + ' ' + y + ' ' + (x + interval) + ' ' + opts.h + ' ' + (x + interval + 1) + ' ' + opts.h + ' ';
          x = x + interval + 1;
        }
        return coords;
      }
    };
    return line.attr({path: types[opts.type]()});
  }

  function attachLabels(graph, labels) {
    var text_attrs = {
      font: opts.labels.weight + ' ' + opts.labels.size + 'px ' + opts.labels.family,
      fill: opts.labels.color,
      'text-anchor': 'start'
    };
    graph.text(opts.labels.x, opts.h - opts.labels.y - opts.labels.size / 2, labels[0]).attr(text_attrs);
    var right_caption = graph.text(opts.w - opts.labels.x, opts.h - opts.labels.y - opts.labels.size / 2, labels.pop()).attr(text_attrs);
    right_caption.attr({ 'text-anchor': 'end' });
  }

  function getYScale(points) {
    if(opts.type == 'x_line') {
      points = $.map(points, function(n, i) {
        return n[1];
      });
    }
    return opts.h / Math.max.apply(Math, points);
  }
  function getXScale(points) {
    if(opts.type == 'x_line') {
      points = $.map(points, function(n, i) {
        return n[0];
      });
    }
    return opts.w / Math.max.apply(Math, points);
  }

})(jQuery);