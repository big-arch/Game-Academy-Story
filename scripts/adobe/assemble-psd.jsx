// Photoshop: собирает редактируемый PSD устройства из вырезанных деталей.
// Ожидает глобальный CFG = { src, psd, partsDir, parts: [{ name, x, y }] }
// (подставляет scripts/adobe/run-photoshop.ps1 из assets/devices/<device>/parts.json).
// В PSD: исходный лист (скрыт) и группа, где каждая деталь — отдельный слой на своём месте листа.
#target photoshop
(function () {
  var prevUnits = app.preferences.rulerUnits, prevDialogs = app.displayDialogs;
  app.preferences.rulerUnits = Units.PIXELS;
  app.displayDialogs = DialogModes.NO;
  var sheet = app.open(new File(CFG.src));
  try {
    var base = sheet.artLayers[0];
    if (base.isBackgroundLayer) base.isBackgroundLayer = false;
    base.name = CFG.sourceLayer;
    base.visible = false;
    var group = sheet.layerSets.add(); group.name = CFG.groupName;
    for (var i = CFG.parts.length - 1; i >= 0; i--) {
      var p = CFG.parts[i];
      var piece = app.open(new File(CFG.partsDir + p.name + '.png'));
      var src = piece.artLayers[0];
      var layer = src.duplicate(group, ElementPlacement.INSIDE);
      piece.close(SaveOptions.DONOTSAVECHANGES);
      app.activeDocument = sheet;
      layer.name = p.name;
      // Дубликат ложится в левый верхний угол содержимого — переносим на исходное место листа.
      layer.translate(p.x - layer.bounds[0].as('px'), p.y - layer.bounds[1].as('px'));
    }
    var psd = new PhotoshopSaveOptions(); psd.layers = true; psd.maximizeCompatibility = true;
    sheet.saveAs(new File(CFG.psd), psd, false, Extension.LOWERCASE);
  } finally {
    sheet.close(SaveOptions.DONOTSAVECHANGES);
    app.preferences.rulerUnits = prevUnits;
    app.displayDialogs = prevDialogs;
  }
})();
