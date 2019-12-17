# VS Code Extension for C/C++ Development

> Note: This is a preliminary milestone release. Please help us by trying out this extension and providing feedback using [our github issues page](https://github.com/eclipse-cdt/cdt-vscode/issues).

This is a Visual Studio Code extension that supports C/C++ development and is brought to you by the same experts who built the C/C++ IDE for Eclipse.

The main focus of this extension is to serve the same community that used the C/C++ IDE for Eclipse but who are looking for the more editor focused experience of Visual Studio Code. It includes the clangd C/C++ language server and provides a platform to integrate build systems, compilers, and debuggers that are used by embedded system, server, and game developers. We provide exemplary implementations for the GNU toolchain but endeavour to support other toolchains as well.

## Settings

TODO

## Build

We use yarn to as our package manager. To build, simply do

```
yarn
yarn build
```
You can also run the build in watch mode using
```
yarn watch
```
