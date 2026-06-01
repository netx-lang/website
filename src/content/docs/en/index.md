---
title: Documentation
nav: Overview
order: 0
---

NetX (pronounced as *net-ex*) is a hardware description language that adopts a schematic programming model and treats consistency as a first-class design principle. Generally speaking, NetX code closely resembles circuit schematics, with each identifier corresponding to a circuit component, and the composition operators corresponding to the connections of components.
NetX arranges code on a breadboard: components are aligned along horizontal and vertical grids via the serial and parallel combinators `<>` and `||`; named variables correspond to jumper wires modeling complex topologies; and meta-programming further abstracts the repeated pattern on the breadboard.

## Get Started
The toolchain can be built from source or installed from a pre-built archive; both routes are described below.

### Build the toolchain
To build the toolchain from source, you need to have the following dependencies:
- Java Development Kit (JDK) 25 or later
- C++23 or later compliant compiler (e.g., GCC 15 or later, Clang 21 or later)
- CMake 3.28 or later
- Boost 1.80 or later
- [nlohmann/json](https://github.com/nlohmann/json/) 3.11.3 or later

For Ubuntu/Debian-based systems, you can install the dependencies using:
```bash
sudo apt install -y openjdk-25-jdk g++-15 cmake libboost-all-dev nlohmann-json3-dev
```

Then clone the repository:
```bash
git clone <repository-url> NetX && cd NetX
```

and build the toolchain:
```bash
# Install to default location (~/.local/netx)
./install.sh

# Or, install to custom location (Make sure you have write permissions to the directory)
INSTALL_PREFIX=/usr/local ./install.sh
```

### Install from pre-built binaries
Every release ships a self-contained archive for
Linux (x64/arm64), macOS (x64/arm64), and Windows (x64). Each archive bundles a trimmed JVM, so no JDK or C++ toolchain is required; just unpack it and put `bin/` on your `PATH`:

```bash
# linux-x64 as an example
tar -xzf netx-0.1.0-linux-x64.tar.gz
export PATH="$PWD/netx-0.1.0-linux-x64/bin:$PATH"
nx --version
```

## Reference

- [Tech Report (PDF)](/assets/netx-paper.pdf)
