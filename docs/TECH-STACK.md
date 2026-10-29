# Game languages

This game uses JavaScript for runtime logic/UI and Capacitor for Android/iOS packaging. Chapter one adds a C# build-time graph auditor, compiled by PowerShell's `Add-Type`; it does not add a .NET dependency to the mobile app. Run `npm run audit:chapter`. No .NET SDK or NuGet packages are needed for this audit on the current Windows/PowerShell host.

Go is not installed on the current host and has not been added as an unnecessary client dependency. It remains an option for future backend services. It can also power mobile 2D games with [Ebitengine](https://ebitengine.org/en/documents/mobile.html), but switching this established game to another engine is a separate migration.

Other choices:

- C# with Unity; GDScript/C#/C++ with Godot; C++/Blueprint with Unreal; Lua with Defold. See [Android game-development basics](https://developer.android.com/games/guides/basics).
- Kotlin/Java for Android platform code and integrations, C/C++ for native engine code. See the same Android guide.
- Swift/Objective-C with Apple's frameworks, including [SpriteKit](https://developer.apple.com/documentation/spritekit).
- JavaScript/TypeScript for browser-based clients and hybrid/mobile wrappers. This project's current working client is JavaScript.

Python is useful for offline pipelines, but chapter one's game logic, asset analysis and tools were implemented with JavaScript and C# rather than Python. Adding a language should solve an actual problem, not multiply build chains.
