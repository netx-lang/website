---
title: Type
order: 2
---

# Type

To help identify potential issues early in the development process, NetX is a statically and strongly typed language, meaning that every expression has a type that is determined at compile time, and type errors are caught before simulation or other processing.

Types in NetX can be categorized into two main classes: circuit types and meta types.
Circuit types describe the input and output signals of a hardware component; while meta types dictate the valid operations that can be performed during meta-programming.

## Circuit Type

The type of a circuit component describes the input and output signals of that component, noted as $\langle \mathit{sig} \cdots \mathit{sig}\rangle \to \langle \mathit{sig} \cdots \mathit{sig}\rangle$, pointing from the ordered list of input signal types to the ordered list of output signal types.
Here, each input and output port of that component has a specific signal type, denoted as sig.

### Signal Type

Signal types (noted as sig) are the fundamental building blocks of circuit types, representing the flow of data in a circuit.
There are primitive and compositional signal types:

#### Primitive Signal Type

A primitive signal type dictates the signal carried by an electrical wire.
It is either n-bit wide data type, denoted as bit(n); or a clocked signal type, denoted as clock.
Clocked signals are special signals of 1-bit width that flips between 0 and 1 regularly.
Notably, mismatching a clocked type clock with a 1-bit data type bit(1) should only raise a warning during compilation, since they are interchangeable in certain scenarios.

Moreover, enums are de facto primitive signal types. For example, the enumeration defined as

```netx
enum COLOR {
  RED = 2'b00, GREEN = 2'b01, BLUE = 2'b10
}
```

can be used as `wire color of COLOR;` that represents a wire carrying `COLOR` signals, which is a 2-bit wide data signal in the end.
In other words, it is equivalent to define `wire color of bit(2);` in NetX code---enumerations are only compile-time aliases for specific values.

Note that wires in NetX do not directly have a signal type, since wires are a special kind of component that directly passes the input signal to the output signal.
In this sense, saying the declaration `wire a of bit(1);` specifies a wire carrying a 1-bit data signal, it actually specifies a wire having the type $\langle \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1)\rangle$.

#### Compositional Signal Type

A compositional signal type is formed by combining multiple signal types together to form more complex data structures, specifically, arrays and bundles:

- Array types represent a collection of signals of the same type, denoted as sig[n], where n is a number fixed at compile time.
  For example, the declaration `wire a[4] of bit(32);` specifies an array having type bit(32)[4], meaning that it contains 4 elements, namely `a[0]`, `a[1]`, `a[2]`, `a[3]`, each of type `bit(32)`.
  During compilation, the compiler should flatten wires carrying array-typed signals.
  That is, if an array `a` appears alone in an expression, it should be transformed to a list of primitive wires `[a[0], a[1], a[2], a[3]]`, each of type `bit(32)`.
  Notably, though `a[0]` is not a valid identifier in NetX, it is valid in the backend representation NXON for this convenience.
- Bundle types represent a collection of signals of different types, each with a field name.
  These are defined by interfaces, which are a special kind of component that groups multiple wires together.
  For example, the definition:
  
```netx
interface PACKAGE : [valid, load] {
  wire valid of bit(1);
  wire load of bit(32);
}
```

  Specifies a special component named `PACKAGE` that has two input signals, `valid` and `load`, with types `bit(1)` and `bit(32)`, respectively.
  The output signal of the component is of a bundle type noted as
  The bundle type is $\tau ::= \{\, \mathrm{valid} : \mathrm{bit}(1),\ \mathrm{load} : \mathrm{bit}(32) \,\}_{\mathrm{PACKAGE}}$
  Then the `PACKAGE` component should have the type $\langle \mathrm{bit}(1), \mathrm{bit}(32)\rangle \to \langle \tau\rangle$, which is similar to a constructor.
  Also, we can define `bundle pack of PACKAGE;` having type $\langle \tau\rangle \to \langle \tau\rangle$, and the wires inside that bundle can be accessed by the field names, with `pack.valid` having type $\langle \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1)\rangle$ and `pack.load` having type $\langle \mathrm{bit}(32)\rangle \to \langle \mathrm{bit}(32)\rangle$.
  Moreover, during compilation, the compiler should blast bundles into lists of wires.
  That is, if a bundle `pack` appears alone in an expression, it should be transformed to a list of primitive wires `[pack.valid, pack.load]`, each of type `bit(1)` and `bit(32)` respectively.

Notably, compositional signal types can be nested, meaning that we can have arrays of bundles, bundles of bundles, and so on.
The flattening or blasting of these nested types should follow the order of the nesting, i.e., an array of bundles should be flattened first and blasted afterwards.

### Component Type

A component type describes the input and output signals of a hardware component.
It is represented as $\langle \mathit{sig} \cdots \mathit{sig}\rangle \to \langle \mathit{sig} \cdots \mathit{sig}\rangle$, where the left-hand side is a tuple of input signal types and the right-hand side is a tuple of output signal types.

For example, a register is a component that takes an input data signal and a clock signal, which stores the input data on the edge of the clock signal (i.e., when the clock signal flips), and outputs the stored data as an output signal.
A register can be defined as follows:

```netx
component REG : [data, clk] -> [out] {
  wire data, out of bit(32);
  wire clk of clock();
  /* ... */
}
```

The type of the component is $\langle \mathrm{bit}(32), \mathrm{clock}\rangle \to \langle \mathrm{bit}(32)\rangle$.

Except for common components such as the register shown above, NetX also treats entities (including wires, constants, interfaces and bundles) as special kinds of components:

- Wires are components that take an input signal and pass it directly to the output.
  A wire carrying a 1-bit data signal can be declared as `wire data of bit(1);` that has the type $\langle \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1)\rangle$, as we have already discussed in the section on signal type.
- Constants are components that have no input signals and output a fixed value.
  For example, the literal `4'b1010` is a constant of type $\langle \rangle \to \langle \mathrm{bit}(4)\rangle$, and the floating-point literal `3.14` is a constant of type $\langle \rangle \to \langle \mathrm{bit}(32)\rangle$.
  Notably, sometimes constants may have meta types rather than circuit types, determined by the context (i.e., the kind of expression) that they appear in.
- Interfaces and bundles are special components related to the bundle types we have discussed in the section on signal type:
  A bundle is a pass-through component that takes a bundle-typed input and outputs the same thing; and an interface is a component that receives multiple input signals and outputs a single output signal of a bundle type, serving as a bundle constructor.

### Operators on Component Type

The parallel combinator `||`, the sequential combinator `<>`, and the port decorator `#` are the only three operators that can perform operations on operands of component types.
The associativity and precedence of these operators will be discussed in the section on operator precedence and associativity.

#### Parallel Combinator

The parallel combinator `||` is used to combine two components in a parallel manner, allowing the components to operate independently and simultaneously.

For example, by parallelly composing two 2-to-1 components, we get a 4-to-2 component. Given a component `AND` of type $\langle \mathrm{bit}(1), \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1)\rangle$, which performs a logical AND operation on two 1-bit inputs, the parallel composition of two such gates can be expressed as `AND || AND`, resulting in a component type of $\langle \mathrm{bit}(1), \mathrm{bit}(1), \mathrm{bit}(1), \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1), \mathrm{bit}(1)\rangle$.

#### Sequential Combinator

The sequential combinator `<>` is used to combine two components in a sequential manner, passing the output of the second component as the input to the first component, which is similar to the composition of functions.
This requires the second component's output type to match the first component's input type.

For example, by sequentially composing a 4-to-2 component with a 2-to-1 component, we can create a 4-to-1 component.
Given the component `(AND || AND)` of type $\langle \mathrm{bit}(1), \mathrm{bit}(1), \mathrm{bit}(1), \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1), \mathrm{bit}(1)\rangle$, which we have just discussed, we can compose it with a 2-to-1 component, say another `AND` gate, of type $\langle \mathrm{bit}(1), \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1)\rangle$.
This can be expressed as `AND <> (AND || AND)`, resulting in a component type of $\langle \mathrm{bit}(1), \mathrm{bit}(1), \mathrm{bit}(1), \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1)\rangle$---a 4-to-1 component performing a logical AND operation on its four inputs.

#### Port Decorator

The port decorator `#` is used to ignore input or output ports of a component.
By appending `#` to the front or back of a component expression, we get a new component ignoring the input or output ports, respectively. This is useful when we need to manipulate the component type to facilitate meta-programming in certain scenarios. See the section on decorator expression for more details.

For example, given a component `AND` of type $\langle \mathrm{bit}(1), \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1)\rangle$, the expression `#AND` results in a component of type $\langle \mathrm{bit}(1), \mathrm{bit}(1)\rangle \to \langle \rangle$ and the expression `AND#` results in a component of type $\langle \rangle \to \langle \mathrm{bit}(1)\rangle$.

## Meta Type

Meta types are used to dictate the valid operations that can be performed during meta-programming, which is a process to abstract schematic patterns in the hardware design (see the section on meta programming for further discussion).
Currently, NetX supports primitive meta types such as boolean and integer types, as well as types that compose these primitive types and the circuit types we have discussed in the section on circuit type.

### Boolean Type

- The only two boolean literals are `true` and `false`, which represent the two possible values of the boolean type.
  The only way to create a boolean value from other types is to use the comparison operators, which will be discussed in the section on integer type.
- In certain program constructs, such as `if then else` expressions and `when` filter qualifiers, integer values can be implicitly converted to boolean values: zero is treated as `false`, and any nonzero value is treated as `true`.
- The logical operators `and`, `or`, and `not`; as well as the comparison operators `==` and `!=` are the only operators that can be applied to boolean values.
  The associativity and precedence of these operators will be discussed in the section on operator precedence and associativity.
  Here are some examples:
  - `true and false` evaluates to `false`.
  - `not true` evaluates to `false`.
  - `(true == false) or true` evaluates to `true`.
  - `false and (true != false)` evaluates to `false`.
- Expressions of boolean type can be used in meta-programming control structures.
  These include
  - The conditional expression `if b1 then e1 else e2` requires `b1` to have a boolean type.
  - The filter qualifier in list comprehensions, `when b1`, requires `b1` to have a boolean type.
  Check the section on list comprehensions for more details on list comprehensions.
  For example, the expression
  
```netx
[x | x in [0, 1, 2, 3, 4, 5], when x % 2 == 1]
```

  evaluates to `[1, 3, 5]`.

### Integer Type

#### Integer Literals

Generally, integer literals in NetX are represented in the form of

```netx
<width>'<radix><digits>
```

where `width` is the number of bits, `radix` is the base of the number system (e.g., `b` for binary, `o` for octal, `d` for decimal, and `h` for hexadecimal), and `digits` are the digits of the number in that base.
For example, `4'b1010` represents the binary number `1010` with a width of 4 bits, which is equivalent to the octal number `4'o12`, the decimal number `4'd10`, or the hexadecimal number `4'hA`.
For a literal with no width and radix specified, the compiler should assume it as a 32-bit decimal number.

Notably, the given digit sequence may not match the specified width, in which case the compiler will pad the literal with leading zeros or truncate it to fit the specified width.
For example:

- `8'b11010` is equivalent to `8'b00011010`, since the 5-bit binary number `11010` should be padded with leading zeros to fit the 8-bit width, resulting in `00011010`.
- `7'hFF` is equivalent to `7'h7F`, since the 8-bit hexadecimal number `FF` should be truncated to fit the 7-bit width, resulting in `7F`.
- If a 32-bit decimal number is specified without a width and radix; meanwhile the represented value is out of the range of 32-bit unsigned integer, the compiler should truncate the number to fit the 32-bit width.

The following integer literals are all valid:

```netx
4'b1010,          8'hFF,            12'o17,           32'd42,
4'B10,            8'Hff,            12'O17,           32'D42,
0,                12109432443123,   1_000_000_000,    540'd7_145_234_892
```

#### Integer Operators

The following operators can be applied to integer values:

- Arithmetic operators.
  The binary arithmetic operators are `+`, `-`, `*`, `/`, `%`, and `**` that perform addition, subtraction, multiplication, division, modulo, and exponentiation operations, respectively.
  These operators generate integer values of the same width as both operands.
  The unary arithmetic operators are `+` and `-` that perform identity and negation operations, respectively.
  Since integers are all unsigned, the negation (and subtraction) is calculated as the two's complement of the value.
  The unary operators generate integer values of the same width as their operands.
  Note that some of the operators listed above may produce result exceeding the range of bounded integers, in which case the result will be truncated to fit the specified width.
  For example, the expression `4'd5 * 4'd5` evaluates to `4'd9` since the result `25` (`11001`) exceeds the range of 4-bit unsigned integer, which is `0-15`, and thus is truncated to `9` (`1001`).
- Bitwise operators.
  The binary bitwise operators are `&`, `|`, `^`, and `~^`  that perform bitwise AND, OR, XOR and XNOR, respectively.
  The XNOR operator `~^` can be written as `^~` interchangeably.
  These operators generate integer values of the same width as both operands.
  The unary bitwise operator is `~` that performs bitwise NOT operation, generating an integer value of the same width as its operand.
- Shift operators.
  The shift operators are `>>`, `<<`, `>>>`, and `<<<` that perform right shift, left shift, arithmetic right shift, and arithmetic left shift operations, respectively.
  When shifting a value to the left, either `<<` and `<<<` will fill the vacated bits with zeros.
  When shifting a value to the right, `>>` will fill the vacated bits with zeros while `>>>` will fill the vacated bits with the sign bit (the most significant bit) of the value.
  These operators require both operands to have the same type, and will generate integer values of the same width as their first operand.
- Comparison operators.
  The comparison operators are `==`, `!=`, `<`, `<=`, `>`, `>=`, `<*`, `<=*`, `>*`, and `>=*`.
  The suffix `*` indicates that the comparison is unsigned, meaning that the operands are treated as unsigned integers rather than signed integers.
  These operators generate boolean values as the result, and are left-associative.

The associativity and precedence of these operators will be discussed in the section on operator precedence and associativity.

### Floating-point Type

#### Floating-point literals

Generally, floating-point literals in NetX are represented in the form of

```netx
<width>'[fF]<digits>
```

where `width` is the number of bits and `digits` are the digits of the number in that base.
The supported widths are 16, 32, and 64 bits corresponding to half-precision, single-precision, and double-precision IEEE 754 formats, respectively.
For example, `32'F3.14` represents the single-precision floating-point number 3.14.
For a literal with no width and radix specified, the compiler should assume it as a 32-bit single-precision floating-point number.

#### Floating-point Operators

The following operators can be applied to floating-point values:

- Arithmetic operators.
  The binary arithmetic operators are `+`, `-`, `*`, `/`, and `**` that perform addition, subtraction, multiplication, division, and exponentiation operations, respectively.
  These operators generate floating-point values of the maximum width of both operands.
  The unary arithmetic operators are `+` and `-` that perform identity and negation operations, respectively.
- Comparison operators.
  The comparison operators are `==`, `!=`, `<`, `<=`, `>`, `>=`.
  These operators generate boolean values as the result, and are left-associative.

Specifically, when performing operations between floating-point and integer values, the compiler should implicitly convert the integer values to floating-point values of the same width as the floating-point operand before performing the operation.

The associativity and precedence of these operators will be discussed in the section on operator precedence and associativity.

### List Type

NetX supports lists to represent a collection of entities, where

- List literals are enclosed in square brackets with elements separated by commas.
  For example, `[1, 2, 3]` is a list of integers containing three elements, `1`, `2`, and `3`.
- Lists containing consecutive integers can be specified with the range notation.
  For example, `[1..5]` is equivalent to `[1, 2, 3, 4]`; and `[5..1]` is equivalent to `[4, 3, 2, 1]`.
- Lists can be nested and do not require elements to be of the same type. For example, `[false, 1]`, `[AND <> (AND || AND), 4'b1010, 32'd42]`, and `[1, [2], [true, false]]` are all valid lists.
- Lists are ordered collections that can be compared using `==` and `!=` by comparing the elements in order.
  List equality is defined as two lists being equal if they have the same number of elements and each corresponding element is equal.
  For example, `[1, 2, 3] == [1, 2, 3]` evaluates to `true`, while `[1, 2, 3] == [1, 2, 3, 4]` evaluates to `false`.
- Elements in a list can be accessed by their index, starting from 0.
  For example, `[true, false][0]` evaluates to `true`, and `[1, [2]][1][0]` evaluates to `2`.
- Lists can be concatenated using the list concatenation operator `++` that appends the elements of the right-hand list to the left-hand list.
  For example, `[1, 2] ++ [3, 4]` evaluates to `[1, 2, 3, 4]`.
- Lists can be constructed using list comprehensions. Check the section on list comprehensions for more details.

### Function Type

Function types dictate valid parameterized macros in NetX, i.e., only those parameterized macros that have a valid function type can be used in meta-programming.
Here are some examples of function types in NetX:

```netx
component AND_120 : [a, b] -> [out] {
  wire a, b, out of bit(120);
  /* ... */
}

component test {
  let fact(i) = if i == 0 then 1 else i * fact(i - 1);
  let tower(box) = box <> (box || box);
  
  wire a of bit(fact(5));
  a <> tower(AND_120);
}
```

Here, `fact` is a lambda function in the form of $\lambda i.\ \cdots$ that is applied when used in the expression `fact(5)`, at which point its type is determined as $\mathrm{bit}(32) \to \mathrm{bit}(32)$, meaning that it takes an integer as input and returns an integer as output.
Similarly, the type of `tower` is determined to be $(\langle \mathrm{bit}(120), \mathrm{bit}(120) \rangle \to \langle \mathrm{bit}(120) \rangle) \to (\langle \mathrm{bit}(120), \mathrm{bit}(120), \mathrm{bit}(120), \mathrm{bit}(120) \rangle \to \langle \mathrm{bit}(120) \rangle)$, meaning it takes a 2-to-1 component as input and returns a 4-to-1 component as output.

For more details on parameterized macros and function types, check the section on meta programming.
