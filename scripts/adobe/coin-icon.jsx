// Illustrator: векторная иконка монеты для счётчика заработка.
// Ожидает глобальный CFG = { svg, ai } — пути результата (подставляет run-illustrator.ps1).
#target illustrator
(function () {
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  var doc = app.documents.add(DocumentColorSpace.RGB, 64, 64);
  function rgb(hex) { var c = new RGBColor(); c.red = parseInt(hex.substr(0, 2), 16); c.green = parseInt(hex.substr(2, 2), 16); c.blue = parseInt(hex.substr(4, 2), 16); return c; }
  // Иллюстратор считает Y вверх от нижнего края артборда; top = 64 - отступ.
  function circle(cx, cy, r, fill, stroke, width) {
    var e = doc.pathItems.ellipse(64 - (cy - r), cx - r, r * 2, r * 2);
    e.filled = Boolean(fill); if (fill) e.fillColor = rgb(fill);
    e.stroked = Boolean(stroke); if (stroke) { e.strokeColor = rgb(stroke); e.strokeWidth = width; }
    return e;
  }
  circle(32, 34, 27, '5a3412');                 // тень-ребро монеты
  circle(32, 31, 27, 'e2a33a', '3b220c', 3);     // тело
  circle(32, 31, 20, 'f3c35a', 'b8741f', 2);     // внутренний ободок
  // Ромб-знак мастерской (как ◈ в интерфейсе).
  var d = doc.pathItems.add();
  d.setEntirePath([[32, 64 - 18], [45, 64 - 31], [32, 64 - 44], [19, 64 - 31]]);
  d.closed = true; d.filled = true; d.fillColor = rgb('b8741f'); d.stroked = false;
  var d2 = doc.pathItems.add();
  d2.setEntirePath([[32, 64 - 24], [39, 64 - 31], [32, 64 - 38], [25, 64 - 31]]);
  d2.closed = true; d2.filled = true; d2.fillColor = rgb('fff0b8'); d2.stroked = false;
  // Блик.
  var h = doc.pathItems.ellipse(64 - 10, 17, 10, 5); h.filled = true; h.fillColor = rgb('fff6d6'); h.stroked = false; h.opacity = 70; h.rotate(-30);

  var svg = new ExportOptionsSVG(); svg.embedRasterImages = true; svg.fontSubsetting = SVGFontSubsetting.None; svg.documentEncoding = SVGDocumentEncoding.UTF8;
  doc.exportFile(new File(CFG.svg), ExportType.SVG, svg);
  doc.saveAs(new File(CFG.ai), new IllustratorSaveOptions());
  doc.close(SaveOptions.DONOTSAVECHANGES);
})();
