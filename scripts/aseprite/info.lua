-- Печатает устройство .aseprite-файла: размер, кадры, слои, теги.
--   aseprite -b <файл.aseprite> --script scripts/aseprite/info.lua
local s = app.activeSprite
print(("size %dx%d, frames %d, layers %d, tags %d"):format(s.width, s.height, #s.frames, #s.layers, #s.tags))
for _, l in ipairs(s.layers) do print("layer: " .. l.name) end
for _, t in ipairs(s.tags) do print(("tag: %s %d-%d"):format(t.name, t.fromFrame.frameNumber, t.toFrame.frameNumber)) end
