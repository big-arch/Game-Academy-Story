// Illustrator: находки внутри техники — каждая своя вещь, а не одинаковая записка.
// Ожидает глобальный CFG = { root, done } (подставляет run-illustrator.ps1).
// Результат: assets/ui/finds/<вещь>.svg, 48×48.
#target illustrator
(function () {
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  var S = 48, INK = '2b1d14';
  var out = new Folder(CFG.root + 'assets/ui/finds'); out.create();
  function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0, 2), 16); c.green = parseInt(hex.substr(2, 2), 16); c.blue = parseInt(hex.substr(4, 2), 16); return c; }
  function style(item, fill, stroke, width) {
    item.filled = Boolean(fill); if (fill) item.fillColor = rgb(fill);
    item.stroked = Boolean(stroke); if (stroke) { item.strokeColor = rgb(stroke); item.strokeWidth = width || 1.5; item.strokeJoin = StrokeJoin.ROUNDENDJOIN; item.strokeCap = StrokeCap.ROUNDENDCAP; }
    return item;
  }
  function path(d, pts, closed, fill, stroke, width) { var p = d.pathItems.add(), f = []; for (var i = 0; i < pts.length; i++) f.push([pts[i][0], S - pts[i][1]]); p.setEntirePath(f); p.closed = closed; return style(p, fill, stroke, width); }
  function oval(d, cx, cy, rx, ry, fill, stroke, width) { return style(d.pathItems.ellipse(S - (cy - ry), cx - rx, rx * 2, ry * 2), fill, stroke, width); }
  function rect(d, x, y, w, h, r, fill, stroke, width) { return style(d.pathItems.roundedRectangle(S - y, x, w, h, r, r), fill, stroke, width); }

  var finds = {
    note: function (d) { // сложенная записка
      path(d, [[8, 12], [38, 8], [41, 36], [11, 40]], true, 'f2e6c8', INK, 1.5);
      path(d, [[13, 18], [34, 15]], false, null, '8a6f4a', 1.4); path(d, [[14, 24], [35, 21]], false, null, '8a6f4a', 1.4); path(d, [[15, 30], [28, 28]], false, null, '8a6f4a', 1.4);
      path(d, [[30, 38], [41, 36], [39, 28]], true, 'd9cba8', INK, 1);
    },
    photo: function (d) { // фото в белой рамке
      rect(d, 8, 9, 32, 30, 1, 'f5efe2', INK, 1.5); rect(d, 11, 12, 26, 20, 0, '6f8a96', null);
      oval(d, 19, 21, 3.5, 3.5, 'f0c39a', null); path(d, [[11, 32], [20, 24], [27, 29], [37, 21], [37, 32]], true, '4e6b4c', null);
    },
    ticket: function (d) { // билет с отрывным краем
      path(d, [[5, 15], [43, 15], [43, 21], [40, 24], [43, 27], [43, 33], [5, 33], [5, 27], [8, 24], [5, 21]], true, 'e9b44c', INK, 1.5);
      path(d, [[32, 16], [32, 32]], false, null, 'a3741f', 1.2); path(d, [[10, 21], [27, 21]], false, null, '7a4f12', 1.6); path(d, [[10, 27], [22, 27]], false, null, '7a4f12', 1.6);
    },
    coin: function (d) { // старая монета
      oval(d, 24, 25, 15, 15, 'c98b32', INK, 1.5); oval(d, 24, 25, 11, 11, 'e6b052', 'a36b1c', 1.2);
      path(d, [[19, 25], [24, 18], [29, 25], [24, 32]], true, 'f5d58a', null); oval(d, 18, 18, 3, 1.6, 'fff3c4', null);
    },
    key: function (d) { // маленький ключик
      oval(d, 15, 17, 8, 8, 'd9a648', INK, 1.5); oval(d, 15, 17, 3.5, 3.5, '3a2a1f', null);
      path(d, [[21, 23], [38, 38]], false, null, INK, 5); path(d, [[21, 23], [38, 38]], false, null, 'd9a648', 3);
      path(d, [[33, 33], [37, 29]], false, null, INK, 3); path(d, [[29, 29], [32, 26]], false, null, INK, 3);
    },
    flower: function (d) { // засушенный цветок
      path(d, [[24, 42], [24, 22]], false, null, '6b7a3a', 2); path(d, [[24, 32], [16, 27]], false, null, '6b7a3a', 1.6);
      oval(d, 24, 15, 4, 5, 'c97a8a', INK, 1); oval(d, 18, 19, 4, 3.5, 'c97a8a', INK, 1); oval(d, 30, 19, 4, 3.5, 'c97a8a', INK, 1);
      oval(d, 24, 19, 2.6, 2.6, 'e9c46a', null); path(d, [[16, 27], [12, 24], [15, 30]], true, '8a9a52', null);
    },
    drawing: function (d) { // детский рисунок: дом и солнце
      rect(d, 6, 8, 36, 32, 1, 'fbf6ea', INK, 1.5);
      oval(d, 34, 15, 4, 4, 'ffcf3f', 'e0a020', 1); path(d, [[13, 26], [21, 18], [29, 26]], false, null, 'd2453a', 2);
      rect(d, 14, 26, 14, 10, 0, null, '3e6fa8', 1.8); path(d, [[19, 36], [19, 31], [23, 31], [23, 36]], false, null, '3e6fa8', 1.4);
    },
    ring: function (d) { // колечко
      oval(d, 24, 28, 12, 11, null, INK, 6); oval(d, 24, 28, 12, 11, null, 'e2b04a', 3.5);
      path(d, [[20, 17], [24, 10], [28, 17], [24, 20]], true, 'bfe6ef', INK, 1.2); path(d, [[22, 15], [24, 12]], false, null, 'ffffff', 1);
    },
    button: function (d) { // пуговица от пальто
      oval(d, 24, 24, 15, 15, '7a4a2e', INK, 1.5); oval(d, 24, 24, 11, 11, null, '5a3420', 1.5);
      oval(d, 20, 20, 2, 2, '2b1d14', null); oval(d, 28, 20, 2, 2, '2b1d14', null); oval(d, 20, 28, 2, 2, '2b1d14', null); oval(d, 28, 28, 2, 2, '2b1d14', null);
    },
    letter: function (d) { // конверт
      rect(d, 6, 13, 36, 24, 1, 'efe3c6', INK, 1.5); path(d, [[6, 13], [24, 27], [42, 13]], false, null, INK, 1.5);
      oval(d, 24, 28, 3.5, 3.5, 'b33a2e', '6e1f18', 1);
    },
  };
  var names = [];
  for (var name in finds) {
    var doc = app.documents.add(DocumentColorSpace.RGB, S, S);
    finds[name](doc);
    var svg = new ExportOptionsSVG(); svg.embedRasterImages = true; svg.documentEncoding = SVGDocumentEncoding.UTF8;
    doc.exportFile(new File(out.fsName + '/' + name + '.svg'), ExportType.SVG, svg);
    doc.close(SaveOptions.DONOTSAVECHANGES);
    names.push(name);
  }
  var done = new File(CFG.done); done.open('w'); done.write(names.join(', ')); done.close();
})();
