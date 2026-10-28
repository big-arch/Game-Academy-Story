// Illustrator: векторные иконки инструментов для панели внизу рабочего стола.
// Ожидает глобальный CFG = { root, done } (подставляет run-illustrator.ps1).
// Результат: assets/ui/tools/<инструмент>.svg, 48×48, палитра мастерской с тёмным контуром.
#target illustrator
(function () {
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  var S = 48, INK = '2b1d14';
  var out = new Folder(CFG.root + 'assets/ui/tools'); out.create();
  function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0, 2), 16); c.green = parseInt(hex.substr(2, 2), 16); c.blue = parseInt(hex.substr(4, 2), 16); return c; }
  // Координаты задаются сверху вниз (как в SVG); Illustrator считает Y снизу, переворачиваем здесь.
  function style(item, fill, stroke, width) {
    item.filled = Boolean(fill); if (fill) item.fillColor = rgb(fill);
    item.stroked = Boolean(stroke); if (stroke) { item.strokeColor = rgb(stroke); item.strokeWidth = width || 2; item.strokeJoin = StrokeJoin.ROUNDENDJOIN; }
    return item;
  }
  function line(doc, pts, color, width) {
    var p = doc.pathItems.add(), flipped = [];
    for (var i = 0; i < pts.length; i++) flipped.push([pts[i][0], S - pts[i][1]]);
    p.setEntirePath(flipped); style(p, null, color, width); p.strokeCap = StrokeCap.ROUNDENDCAP; return p;
  }
  function poly(doc, pts, fill, stroke, width) { var p = line(doc, pts, stroke || INK, width || 2); p.closed = true; return style(p, fill, stroke || INK, width || 2); }
  function rect(doc, x, y, w, h, r, fill, stroke, width) { return style(doc.pathItems.roundedRectangle(S - y, x, w, h, r, r), fill, stroke === undefined ? INK : stroke, width || 2); }
  function oval(doc, cx, cy, rx, ry, fill, stroke, width) { return style(doc.pathItems.ellipse(S - (cy - ry), cx - rx, rx * 2, ry * 2), fill, stroke === undefined ? INK : stroke, width || 2); }

  var icons = {
    inspect: function (d) { // лупа
      line(d, [[29, 29], [40, 40]], INK, 9); line(d, [[29, 29], [40, 40]], '8a5a2a', 5);
      oval(d, 20, 20, 12, 12, 'f6dcb0', INK, 2); oval(d, 20, 20, 8, 8, '7fb3b8', INK, 1.5);
      line(d, [[15, 16], [18, 13]], 'eaf6f2', 2);
    },
    screw: function (d) { // отвёртка
      line(d, [[9, 39], [26, 22]], INK, 6); line(d, [[9, 39], [26, 22]], 'c9c9c9', 3);
      line(d, [[25, 23], [38, 10]], INK, 12); line(d, [[25, 23], [38, 10]], 'c8452e', 8);
      line(d, [[30, 14], [35, 9]], 'f08a6e', 2);
    },
    brush: function (d) { // кисть
      line(d, [[36, 8], [23, 25]], INK, 7); line(d, [[36, 8], [23, 25]], 'a8743c', 4);
      line(d, [[23, 25], [19, 30]], INK, 9); line(d, [[23, 25], [19, 30]], 'b9b2a6', 6);
      poly(d, [[16, 28], [22, 33], [12, 42], [8, 39]], 'e8c88a');
    },
    paste: function (d) { // тюбик термопасты
      rect(d, 13, 8, 22, 26, 3, 'd8d2c4'); rect(d, 13, 8, 22, 5, 1, 'a39c8c');
      rect(d, 17, 17, 14, 10, 1, '6b8fb4', null); rect(d, 19, 34, 10, 6, 1, '5a5a5a');
      oval(d, 24, 43, 3, 2.5, 'b9b9b9', INK, 1.5);
    },
    clean: function (d) { // флакон спирта
      rect(d, 20, 5, 8, 6, 1, 'c8452e'); rect(d, 21, 11, 6, 7, 1, 'cfe6e8');
      rect(d, 14, 18, 20, 25, 5, '9ecbd0'); rect(d, 16, 25, 16, 9, 1, 'f3e6c8', null);
      line(d, [[18, 21], [18, 40]], 'e6f6f7', 2);
    },
    belt: function (d) { // приводной ремень
      oval(d, 24, 24, 16, 10, null, INK, 7); oval(d, 24, 24, 16, 10, null, '3e3a36', 4);
      oval(d, 24, 24, 16, 10, null, '6e6862', 1);
    },
    meter: function (d) { // мультиметр со щупами
      rect(d, 12, 6, 22, 32, 4, 'e0a83a'); rect(d, 15, 9, 16, 9, 1, 'b9d3a8'); rect(d, 15, 9, 16, 9, 1, null, INK, 1);
      oval(d, 23, 27, 5, 5, '3a3a3a', INK, 1.5); line(d, [[23, 27], [26, 24]], 'f2f2f2', 1.5);
      line(d, [[18, 38], [10, 44]], 'c8452e', 2.5); line(d, [[28, 38], [36, 44]], '2b2b2b', 2.5);
    },
    solder: function (d) { // паяльник с каплей припоя
      line(d, [[10, 38], [24, 24]], INK, 5); line(d, [[10, 38], [24, 24]], 'c9c9c9', 2.5);
      line(d, [[24, 24], [40, 8]], INK, 11); line(d, [[24, 24], [40, 8]], '3e6fa8', 7);
      line(d, [[27, 21], [31, 17]], 'e6e6e6', 2);
      oval(d, 9, 40, 3.2, 3.2, 'ffb84d', INK, 1.2); oval(d, 8, 39, 1.2, 1.2, 'fff3c4', null);
    },
    hand: function (d) { // рука
      var skin = 'f0c39a';
      rect(d, 13, 9, 5, 18, 2.5, skin); rect(d, 18.5, 6, 5, 20, 2.5, skin); rect(d, 24, 7, 5, 19, 2.5, skin); rect(d, 29.5, 10, 5, 17, 2.5, skin);
      poly(d, [[34, 26], [41, 20], [44, 23], [37, 33]], skin);
      rect(d, 13, 22, 22, 20, 7, skin);
      line(d, [[18, 33], [27, 33]], 'c98f63', 1.5);
    },
  };
  var names = [];
  for (var name in icons) {
    var doc = app.documents.add(DocumentColorSpace.RGB, S, S);
    icons[name](doc);
    var svg = new ExportOptionsSVG(); svg.embedRasterImages = true; svg.documentEncoding = SVGDocumentEncoding.UTF8;
    doc.exportFile(new File(out.fsName + '/' + name + '.svg'), ExportType.SVG, svg);
    doc.close(SaveOptions.DONOTSAVECHANGES);
    names.push(name);
  }
  var done = new File(CFG.done); done.open('w'); done.write(names.join(', ')); done.close();
})();
