-- Собирает анимированный cat.aseprite из полос кадров игры (assets/sprites/cat/*.png):
-- каждая анимация — тег на таймлайне с той же скоростью, что в cat.js.
--   aseprite -b --script-param dir=<assets/sprites/cat> --script scripts/aseprite/build-cat.lua
-- Дальше анимацию правят в Aseprite, а в игру возвращают scripts/aseprite/export-cat.ps1.
local dir = app.params.dir
local W, H = 48, 34
-- Должно совпадать с ANIMS в cat.js (кадров, кадров в секунду).
local anims = {
  { name = "idle", frames = 11, fps = 5 },
  { name = "walk", frames = 6, fps = 9 },
  { name = "wash", frames = 8, fps = 8 },
  { name = "sleep", frames = 2, fps = 1.2 },
  { name = "stretch", frames = 5, fps = 6 },
}

local sprite = Sprite(W, H, ColorMode.RGB)
local layer = sprite.layers[1]
layer.name = "cat"
local index = 0
for _, a in ipairs(anims) do
  local strip = Image{ fromFile = dir .. "/" .. a.name .. ".png" }
  for i = 0, a.frames - 1 do
    index = index + 1
    local frame = index == 1 and sprite.frames[1] or sprite:newEmptyFrame()
    frame.duration = 1 / a.fps
    local img = Image(W, H, ColorMode.RGB)
    img:drawImage(strip, Point(-i * W, 0))
    sprite:newCel(layer, frame, img, Point(0, 0))
  end
end
-- Add tags only after all frames exist: appending frames at a tag's end
-- otherwise expands that tag into the following animations.
local first = 1
for _, a in ipairs(anims) do
  local tag = sprite:newTag(first, first + a.frames - 1)
  tag.name = a.name
  first = first + a.frames
end
sprite:saveAs(dir .. "/source/cat.aseprite")
print(("cat.aseprite: %d frames, %d tags"):format(#sprite.frames, #sprite.tags))
