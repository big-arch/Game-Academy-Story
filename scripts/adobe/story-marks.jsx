// Illustrator: следы истории на корпусах вещей — наклейки, царапины, укусы, изолента.
// Ожидает глобальный CFG = { root, done } (подставляет run-illustrator.ps1).
// Результат: assets/ui/marks/<след>.svg, 48×48.
#target illustrator
(function () {
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  var S = 48, INK = '2b1d14';
  var out = new Folder(CFG.root + 'assets/ui/marks'); out.create();
  function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0, 2), 16); c.green = parseInt(hex.substr(2, 2), 16); c.blue = parseInt(hex.substr(4, 2), 16); return c; }
  function style(item, fill, stroke, width) {
    item.filled = Boolean(fill); if (fill) item.fillColor = rgb(fill);
    item.stroked = Boolean(stroke); if (stroke) { item.strokeColor = rgb(stroke); item.strokeWidth = width || 2; item.strokeJoin = StrokeJoin.ROUNDENDJOIN; item.strokeCap = StrokeCap.ROUNDENDCAP; }
    return item;
  }
  // Координаты сверху вниз, как в SVG.
  function path(doc, pts, closed, fill, stroke, width) {
    var p = doc.pathItems.add(), f = [];
    for (var i = 0; i < pts.length; i++) f.push([pts[i][0], S - pts[i][1]]);
    p.setEntirePath(f); p.closed = closed; return style(p, fill, stroke, width);
  }
  function oval(doc, cx, cy, rx, ry, fill, stroke, width) { return style(doc.pathItems.ellipse(S - (cy - ry), cx - rx, rx * 2, ry * 2), fill, stroke, width); }
  function rect(doc, x, y, w, h, r, fill, stroke, width) { return style(doc.pathItems.roundedRectangle(S - y, x, w, h, r, r), fill, stroke, width); }
  function star(cx, cy, ro, ri) { var pts = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ri : ro; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return pts; }

  var marks = {
    'sticker-star': function (d) { // детская наклейка-звёздочка с белой каймой
      path(d, star(24, 25, 21, 9.5), true, 'fffaf0', INK, 1.5);
      path(d, star(24, 25, 16, 7), true, 'ffcf3f', null);
      path(d, [[19, 15], [23, 12]], false, null, 'fff6c8', 2);
    },
    'sticker-heart': function (d) { // наклейка-сердечко, уголок отклеился
      path(d, [[24, 41], [8, 25], [8, 15], [15, 9], [24, 15], [33, 9], [40, 15], [40, 25]], true, 'fffaf0', INK, 1.5);
      path(d, [[24, 37], [11, 24], [11, 16], [16, 12], [24, 18], [32, 12], [37, 16], [37, 24]], true, 'e8506a', null);
      path(d, [[33, 9], [40, 15], [35, 17]], true, 'd9d0c0', INK, 1);
    },
    'sticker-smile': function (d) { // круглая наклейка-смайлик, выцветшая
      oval(d, 24, 24, 19, 19, 'fffaf0', INK, 1.5); oval(d, 24, 24, 15.5, 15.5, 'e9d27a', null);
      oval(d, 18.5, 20, 2.2, 3, INK, null); oval(d, 29.5, 20, 2.2, 3, INK, null);
      path(d, [[16, 28], [20, 33], [28, 33], [32, 28]], false, null, INK, 2.2);
    },
    'scratch': function (d) { // глубокие царапины
      path(d, [[6, 34], [20, 24], [34, 15], [43, 9]], false, null, 'f2e7d2', 2.2);
      path(d, [[7, 35], [21, 25], [35, 16]], false, null, '1a120d', 1);
      path(d, [[10, 40], [24, 31], [37, 23]], false, null, 'f2e7d2', 1.6);
      path(d, [[13, 43], [22, 37]], false, null, 'e2d4ba', 1.2);
    },
    'bite': function (d) { // следы зубов (собака/щенок) — две дуги вмятин
      var marksTop = [[9, 16], [15, 12], [22, 10], [29, 10], [36, 12], [41, 16]];
      var marksBottom = [[11, 33], [17, 37], [24, 38], [31, 38], [37, 36]];
      for (var i = 0; i < marksTop.length; i++) oval(d, marksTop[i][0], marksTop[i][1], 2.6, 3.2, 'eadbbd', '4a3829', 1.2);
      for (var j = 0; j < marksBottom.length; j++) oval(d, marksBottom[j][0], marksBottom[j][1], 2.4, 3, 'eadbbd', '4a3829', 1.2);
    },
    'tape': function (d) { // кусок синей изоленты наискосок
      path(d, [[4, 30], [38, 8], [44, 17], [10, 39]], true, '2f5f9e', INK, 1.5);
      path(d, [[8, 31], [39, 12]], false, null, '5f8fd0', 1.5);
      path(d, [[4, 30], [7, 34], [6, 37], [10, 39]], false, null, INK, 1);
    },
  };
  var names = [];
  for (var name in marks) {
    var doc = app.documents.add(DocumentColorSpace.RGB, S, S);
    marks[name](doc);
    var svg = new ExportOptionsSVG(); svg.embedRasterImages = true; svg.documentEncoding = SVGDocumentEncoding.UTF8;
    doc.exportFile(new File(out.fsName + '/' + name + '.svg'), ExportType.SVG, svg);
    doc.close(SaveOptions.DONOTSAVECHANGES);
    names.push(name);
  }
  var done = new File(CFG.done); done.open('w'); done.write(names.join(', ')); done.close();
})();
