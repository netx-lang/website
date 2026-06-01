---
title: 文档
nav: 概览
order: 0
---

NetX（读作 *net-ex*）是一种硬件描述语言，它采用原理图式的编程模型，并把一致性作为一等设计原则。总体而言，NetX 代码与电路原理图高度相似：每个标识符对应一个电路元件，组合子则对应元件之间的连接。
NetX 把代码摆放在一块"面包板"上：元件通过串联、并联组合子 `<>` 与 `||` 沿水平与竖直网格对齐；具名变量对应跳线，用来刻画复杂的拓扑结构；元编程则进一步把面包板上重复出现的模式抽象出来。

## 快速开始
工具链既可以由源码构建，也可以直接安装预编译包，下面分别说明。

### 从源码构建工具链
从源码构建工具链需要以下依赖：
- Java Development Kit (JDK) 25 或更高版本
- 支持 C++23 或更高标准的编译器（例如 GCC 15 或更高版本、Clang 21 或更高版本）
- CMake 3.28 或更高版本
- Boost 1.80 或更高版本
- [nlohmann/json](https://github.com/nlohmann/json/) 3.11.3 或更高版本

在 Ubuntu/Debian 系统上，可以用以下命令安装依赖：
```bash
sudo apt install -y openjdk-25-jdk g++-15 cmake libboost-all-dev nlohmann-json3-dev
```

然后克隆仓库：
```bash
git clone <repository-url> NetX && cd NetX
```

并构建工具链：
```bash
# 安装到默认位置（~/.local/netx）
./install.sh

# 或安装到自定义位置（请确保对该目录有写入权限）
INSTALL_PREFIX=/usr/local ./install.sh
```

### 安装预编译版本
每个 release 都提供 Linux（x64/arm64）、macOS（x64/arm64）和 Windows（x64）的自包含压缩包。压缩包内已附带裁剪过的 JVM，因此不需要安装 JDK 或 C++ 工具链，解压后把 `bin/` 加入 `PATH` 即可：

```bash
# 以 linux-x64 为例
tar -xzf netx-0.1.0-linux-x64.tar.gz
export PATH="$PWD/netx-0.1.0-linux-x64/bin:$PATH"
nx --version
```

## 参考资料

- [技术报告 (PDF)](/assets/netx-paper.pdf)
