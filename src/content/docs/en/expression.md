---
title: Expression
order: 4
---

# Expression

Expressions in NetX are used to assemble and manipulate hardware design and to perform meta-programming computations.
Each expression has a type, which is determined by its operands and the context in which it is used.
In this section, we will cover the syntax and semantics of various types of expressions in NetX, including circuit expressions, list expressions, etc.

## Circuit Expression

Circuit expressions are used to describe hardware designs in NetX.
They can be used to instantiate components, connect wires, and perform various operations on circuit elements.

### Circuit Constant

Circuit constants are those constants involved in circuit expressions, in which case the constant literal will be interpreted as a special component that has no input and one output port with the constant value.
This also includes constant expressions that evaluate to a constant during compile-time computation in NetX.

For example, in the following expression

```netx
immU <> CONCAT <> (instr[31:12] || 12'b0)
```

the `12'b0` is a circuit constant that represents a component of type $\langle \rangle \to \langle \mathrm{bit}(12)\rangle$, outputting `12'b0` constantly.
Replacing the `12'b0` with a meta expression that evaluates to `12'b0`, such as `12'd42 ^ 12'd42`, will not change the semantics of the circuit expression.

### Built-in Component

Built-in components are the components listed in the section on global scope and are available in the global scope.
These components can be used directly in circuit expressions without any additional import statements, allowing you to instantiate logic gates, registers, and other basic circuit elements.
In most cases, the input and output signal types of these components are inferred from context, though some components have attributes that explicitly specify their input and output types.

- `DUP` duplicates an input signal into multiple outputs.
  It has an attribute `n` specifying the number of outputs.
  For example, the following code passes the constant value `12'b0` to two wires, `a` and `b`, each carrying a `bit(12)` signal:
  
```netx
wire a, b of bit(12);
(a || b) <> DUP(2) <> 12'b0
```

- `TO` is an anonymous wire that passes its input to its output without modification. It is equivalent to `DUP(1)`, but without any attributes.
- `CONCAT` concatenates multiple input signals into a single output signal.
  It can take an attribute `n` specifying the number of inputs, but if omitted, the compiler will infer the number of inputs from context.
  For example, the following code shows that the signal carried by wire `a` is formed by concatenating a constant `1'b1`, the signal from wire `b`, and a constant `5'b0`:
  
```netx
wire a of bit(20);
wire b of bit(14);
a <> CONCAT <> [1'b1, b, 5'b0];
```

- `SPLIT` decomposes a signal into multiple outputs.
  It has an attribute `n` specifying the number of outputs.
  It takes a n-bit input signal and produces n 1-bit outputs.
  For example, the following code
  
```netx
wire a, b of bit(1);
wire c    of bit(2);
[a, b] <> SPLIT(2) <> 2'b10;
```

  is equivalent to
  
```netx
wire a, b of bit(1);
wire c    of bit(2);
[a, b] <> [c[1], c[0]];
```

- `CAST` and `UCAST` are used to cast a signal from one type to another.
  It has an attribute `width` specifying the target width of the output signal; if not specified, the compiler will infer it from context.
  If the input signal is wider than the target width, the component truncates the input to fit.
  If the input is narrower, it extends the signal: `CAST` sign-extends the signal using its most significant bit, while `UCAST` zero-extends the signal to match the target width.
- `REGISTER` creates a register that stores a value and updates it on the edge of a clock signal.
  It has an attribute specifying whether the register updates on the rising or falling edge of the clock.
  The first input is the clock signal, and the second input is the value to store.
  The only output is the stored value.
  It can be used as:
  
```netx
wire input, output of bit(32);
wire clk of clock();
output <> REGISTER(pos_edge = true) <> [clk, input]
```

  or simply as `output <> REGISTER(true) <> [input, clk]`.
- `ASYNC_REGISTER` creates a register that resets its value asynchronously based on a reset signal.
  It has three attributes: `pos_edge`, `high_rst`, and `rst_value`; each specifies
  (1) whether the register updates on the rising or falling edge of the clock;
  (2) whether the register resets on the high or low level of the reset signal; and
  (3) the value to which the register resets when the reset signal is active.
  It has three inputs, the clock signal `clk`, the reset signal `rst`, and the input `i`.
  It can be used as
  
```netx
wire input, output of bit(32);
wire rst           of bit(1);
wire clk           of clock();
output <> ASYNC_REGISTER(
  pos_edge = true, 
  high_rst = true, 
  rst_value = 0
) <> [clk, rst, input];
```

- `NOT` is a unary component that inverts its input signal.
  It has no attributes and produces a single output signal that is the logical negation of the input.
- `AND`, `OR`, `XOR`, `XNOR`, `NAND`, and `NOR` are components that perform logical operations on their input signals.
  They have an attribute `n` specifying the number of inputs; if omitted, the compiler will infer the number of inputs from context.
- `EQ`, `NE`, `SLT`, `SLE`, `SGT`, `SGE`, `ULT`, `ULE`, `UGT`, and `UGE` are components that perform comparison operations on their two input signals.
  They have no attributes and produce a single 1-bit wide output signal that indicates the result of the comparison.
  The prefix `S` indicates signed comparison, while `U` indicates unsigned comparison.
- `SHL`, `LSHR`, `ASHR` are components that perform shift operations on their two input signals.
  `SHL` performs a logical left shift, `LSHR` performs a logical right shift, and `ASHR` performs an arithmetic right shift.
  They have no attributes and produce a single output signal of the same width as the first input.
- `ADD`, `SUB`, `MUL`, `DIV`, and `MOD` are components that perform arithmetic operations on their input signals.
  Here, `ADD` and `MUL` have an attribute specifying the number of inputs; if omitted, the compiler will infer the number of inputs from context; the others operate on exactly two inputs and have no attributes.

### Wire and Wire Selection

Wires are special 1-to-1 components that directly pass their input to their output without any modification.
They can be used to connect different parts of a circuit or to pass signals between components.

- Wires can be used to represent cycles in a circuit.
  For example, the following code creates a wire named `counter` that receives its input from a register and feeds it back to the register, effectively forming a cycle that increments the counter value on each clock cycle:
  
```netx
wire counter of bit(32);
wire clk of clock();
counter <> REGISTER(pos_edge = true) <> [
  ADD <> [counter, 1], clk
];
```

  Note that combinational loops—cycles that do not include any registers to break the path—are not allowed in NetX. For example, the following code will be rejected:
  
```netx
wire a of bit(1);
a <> ADD <> [a, 1]; // ERROR: Combinational loop
```

- Each wire in a circuit must have exactly one source driving its input; this is known as the no-multiple-driver rule.
  Specifically, once a wire is used as the input to a component, its input port is considered occupied and cannot be connected to any other component.
  For example, the following code will be rejected:
  
```netx
component TEST : [a] -> [b] {
  wire a, b of bit(32);
  [b, b] <> [42, 0];  // ERROR: Multiple drivers for wire b
  a <> ADD <> [b, 1]; // ERROR: Using the occupied input port of wire a
}
```

- Wires can be indexed to access their individual bits.
  For example, for a 2-bit wide wire declared as `wire a of bit(2)`, the expression `a[1] || a[0]` is equivalent to simply writing `a`.
  Moreover, wires can be sliced to access a range of bits (as known as part selection).
  For example, for a 4-bit wide wire declared as `wire a of bit(4)`, the expression `CONCAT <> [a[3], a[2], a[1]]` is equivalent to the slice `a[3:1]`.
  The selecting indices must be constant expressions, and out-of-range indices will be rejected by the compiler.
- Wires can also be organized into arrays, which are collections of wires indexed by constant expressions.
  For example, `wire arr[4] of bit(8)` declares an array of four wires named `arr`, each 8 bits wide.
  It is important to note that an array of n 1-bit wires is distinct from a single n-bit wire:
  a single n-bit wire carries an n-bit signal that can participate in operations (such as bitwise or arithmetic operations) as a whole, enabling more optimization opportunities for the compiler.
  In contrast, an array of n 1-bit wires consists of n independent wires, each carrying a 1-bit signal, and these are treated as separate entities.
  Array elements can be accessed using constant indices, e.g., `arr[2]` refers to the third wire in the array.
  However, slicing (selecting a range of elements) is not supported for arrays.

### Bundle and Field Access

Bundles are composite types that group multiple wires together, enabling convenient access and manipulation of related signals (we have discussed bundle types in the section on circuit type).
Each field within a bundle can be accessed using dot notation (if the bundle is nested, the dot notation can be chained).

For example, consider the following code:

```netx
interface PACKAGE : [valid, load]{
  wire valid of bit(1);
  wire load of bit(32);
}
```

```netx
component TEST : [a, b] -> [c] {
  wire a, b, c of PACKAGE;
  c <> PACKAGE <> [
    AND <> [a.valid, b.valid],
    ADD <> [a.load, b.load]
  ];
}
```

This is equivalent to writing:

```netx
component TEST : [a, b] -> [c] {
  wire a, b, c of PACKAGE;
  c.valid <> AND <> [a.valid, b.valid];
  c.load  <> ADD <> [a.load, b.load];
}
```

Since sequential composition supports named connections (the section on combinator expression), it is also equivalent to:

```netx
component TEST : [a, b] -> [c] {
  wire a, b, c of PACKAGE;
  c <> PACKAGE <> {
    valid : AND <> [a.valid, b.valid],
    load  : ADD <> [a.load, b.load]
  };
}
```

### Combinator Expression

Combinator expressions are used to compose components and wires in a circuit.
They can be used to create complex circuits by combining simpler components and wires.
A combinator expression is a sequence of components and wires connected together, where each component can have multiple inputs and outputs.
The components are connected in a way that allows the output of one component to be used as the input to another component, forming a graph of components.

#### Parallel Combinator

The parallel combinator `||` is used to compose components in parallel, allowing them to operate independently and simultaneously.
For example, composing two 2-to-1 components in parallel yields a 4-to-2 component.
Given a component `AND` of type $\langle \mathrm{bit}(1), \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1)\rangle$, the parallel composition `AND || AND` results in a component of type $\langle \mathrm{bit}(1), \mathrm{bit}(1), \mathrm{bit}(1), \mathrm{bit}(1)\rangle \to \langle \mathrm{bit}(1), \mathrm{bit}(1)\rangle$.

Since hardware operates in parallel, long parallel chains such as `(e1 || e2 || e3 || e4)` are common.
To simplify such expressions, NetX provides list notation: `[e1, e2, e3, e4]` is syntactic sugar for a chain of parallel combinators. While the list notation may not seem dramatically different for short cases, it becomes especially powerful when combined with advanced list expressions (such as list comprehensions), making it much more convenient to construct large parallel compositions.
For example,

```netx
wire a of bit(8);
 OR <> (a[0] || a[2] || a[4] || a[6]);
AND <> (a[1] || a[3] || a[5] || a[7]);
```

is equivalent to:

```netx
wire a of bit(8);
 OR <> [a[i] | i in [0..8], when i % 2 == 0];
AND <> [a[i] | i in [0..8], when i % 2 == 1];
```

#### Sequential Combinator

The sequential combinator `<>` connects components in series, passing the output of one component directly as the input to the next—similar to function composition.

For example, you can connect an `AND` gate to a `NOT` gate using `NOT <> AND`. This combination behaves like a `NAND` gate, since the output of the `AND` is immediately inverted by the `NOT`.
You can also build more complex circuits by chaining components. For instance, `AND <> (AND || AND)` creates a 4-to-1 AND gate by first combining two pairs of inputs in parallel (with `AND || AND`), then feeding their outputs into another `AND` gate in sequence.

The sequential combinator requires that the output type of the second operand matches the input type of the first operand. Specifically, the number of ports and the width of each corresponding port must be identical for the composition to be valid.

When hardware components have many input and output ports, the sequential combinator supports named connections to simplify and clarify complex wiring.

For example, consider the following code:

```netx
component CHIP : [clk, rst, en, input_a, input_b] -> [output_a, output_b] {
  /* ... */
}

component TOP {
  wire my_clk of clock();
  wire my_rst, my_en of bit(1);
  wire x, y, out_a, out_b of bit(32);
  [out_a, out_b] <> CHIP <> [my_clk, my_rst, my_en, AND <> [x, y], OR <> [x, y]];
}
```

This can be rewritten using named connections for greater clarity:

```netx
{
  output_a : out_a,
  output_b : out_b
} <> CHIP <> {
  clk     : my_clk,
  rst     : my_rst,
  en      : my_en,
  input_a : AND <> [x, y], 
  input_b : OR <> [x, y]
}
```

Here, the `:` operator explicitly associates each port of the component with a specific wire or expression in the circuit, regardless of their order in the port list.
This approach improves readability and maintainability, especially for components with many ports.
Note named connection can have a special case `default : expr`, meaning for the unspecified ports, the expression `expr` will be used as the default connection.
Named connections can be used for either input ports, output ports, or both. If named connections are omitted for one side, positional (unnamed) connections can still be used for that side as needed.

### Decorator Expression

Decorator expressions use the port decorator `#` to ignore the input or output ports of a component.
Decorator expressions are useful when you want to selectively ignore certain input or output ports of a component, allowing you to focus only on the ports relevant to your current connection. This is particularly helpful when working with components that have multiple ports, but you only need to connect a subset of them.

For example, consider the following code snippet that defines a 32-bit carry-lookahead adder using a 1-bit full adder component:

```netx
component FULL_ADDER : [a, b, cin] -> [sum, cout] {
  wire a, b, cin, sum, cout of bit(1);
  /* ... */
}
```

```netx
component ADDER : [a, b] -> [c] {
  wire a, b, c of bit(32);

  let bit_adder(i) = [#c[i], TO] <> FULL_ADDER <> [a[i]#, b[i]#, TO];
  let adder(i) = bit_adder(i) <> (
    if i == 0 then 1'b0 
    else adder(i - 1)
  );
  adder(31);
}
```

In this example, the `FULL_ADDER` component has three input ports (`a`, `b`, `cin`) and two output ports (`sum`, `cout`).
When constructing the 32-bit adder, we only need to connect specific ports at each stage. The port decorator `#` is used to ignore the ports that are not needed in a particular connection.
For instance, `a[i]#` and `b[i]#` indicate that only the output of these wires is used, while `#c[i]` means only the input of `c[i]` is relevant.
The `TO` component is used as a pass-through for ports that are not being ignored.
In this case, we get `bit_adder(i)`, which is a 1-to-1 component that takes a carry-in signal and produces a carry-out signal—by connecting them in sequence through the recursive macro `adder(i)`, we effectively build a 32-bit adder.

By using decorator expressions, you can write concise and readable code for complex circuits, avoiding unnecessary wiring and making the intent of each connection clear. This approach is especially powerful in recursive or parameterized circuit definitions, where you want to systematically connect only the relevant ports at each step.

## List Expression

List expressions in NetX are powerful syntax sugar for parallel combinators (the section on combinator expression) as well as data structures useful for meta-programming.

### List Literal

List literals are enclosed in square brackets with elements separated by commas. For example, `[1, 2, 3]` is a list of integers containing three elements: 1, 2, and 3.
See the section on list type for more details.

### Range

Range expressions let you easily create a list of integers between two values.
The syntax is `[e1..e2]`, where `e1` and `e2` are constant expressions that become 32-bit integers (if they are not already, they are adjusted to fit 32 bits).

Suppose `e1` evaluates to $n_1$ and `e2` evaluates to $n_2$. The range expression produces a list of numbers starting from $n_1$ and ending at $n_2$, incrementing or decrementing by 1. The direction of the list matches the order of the endpoints:

- If $n_1 < n_2$, the list counts up from $n_1$ to $n_2 - 1$.
- If $n_1 > n_2$, the list counts down from $n_1 - 1$ to $n_2$.

For example:

- `[0..5]` produces `[0, 1, 2, 3, 4]`
- `[5..0]` produces `[4, 3, 2, 1, 0]`

### List Access

List access allows you to retrieve elements from a list using an index.
The syntax is `list[index]`, where `list` is a list expression and `index` is a constant expression that evaluates to an integer.
For example,

- `[1, 2, 3][0]` evaluates to `1`, the first element of the list.
- `[0, [1], AND, [AND, [OR], XOR]][3][1][0]` evaluates to `OR`, accessing the lists layer by layer.

### Concatenation

List concatenation allows you to combine multiple lists into a single list.
The syntax is `list1 ++ list2`, where `list1` and `list2` are both list expressions.
For example,

- `[1, 2] ++ [3, 4]` produces `[1, 2, 3, 4]`.
- `[0, [1], AND] ++ [2, [3], OR]` produces `[0, [1], AND, 2, [3], OR]`.

### List Comprehension

List comprehension is a concise way to create lists by specifying a pattern and a source.
The syntax is `[expr | qualifier]`, where `expr` is an expression to evaluate, and `qualifier` is the elements specifying the source, filter, or binding of the list.
There are three types of qualifiers:

- Generator: `x in list` that iterates over each element `x` in the given list.
- Binding:   `let x = expr` that binds a value to a variable for use in the expression.
- Filter:    `when condition` that filters elements based on a boolean condition.

The qualifier takes effect in order of appearance, meaning that later qualifiers can use the bindings and filtered elements from earlier ones.
Here are some examples:

- `[x | x in [1, 2, 3]]` evaluates to `[1, 2, 3]`.
- `[x | x in [0..10], when x & 1 == 1]` evaluates to `[1, 3, 5, 7, 9]`.
- `[a[k] | i in [0..3], let k = i ** 2]` evaluates to `[a[0], a[1], a[4], a[9]]`.
- `[i + j | i in [0..3], j in [0..3]]` evaluates to `[0, 1, 2,  1, 2, 3,  2, 3, 4,  3, 4, 5]`.

List comprehension can be very useful.
For example, if we want to check whether an element x is in a list, we can use the following expression:
`[x | x in list, when x == target] != []`, which evaluates to `true` if `x` is in `list`, and `false` otherwise.

## Meta Constant

Meta constants are those constants used in meta-expressions.
These include boolean literals and numeric literals (see the section on meta type for more details).
Meta constants differ from constants in circuit expressions (the section on circuit constant) in that they are not interpreted as components, but rather as values that can be used in meta-programming computations.

## Arithmetic Expression

Arithmetic expressions in NetX are used to perform mathematical operations on integer values.
NetX supports both unary and binary arithmetic operators.

The unary prefix operators `+` and `-` can be applied to integers to indicate positive or negative values, respectively.
Note that all numbers are unsigned in NetX, so the unary minus operator `-` is actually calculated as the two's complement.

The supported binary infix operators include:

- `+` for addition
- `-` for subtraction
- `*` for multiplication
- `/` for division
- `%` for modulo (remainder)
- `**` for exponentiation

These operators can be used only with meta-expressions. Operator precedence and associativity are described in the section on operator precedence and associativity.

## Logical Expression

Logical expressions in NetX are used to perform boolean operations on boolean values.
The supported logical operators include:

- `and` for logical conjunction (AND)
- `or` for logical disjunction (OR)
- `not` for logical negation (NOT)

The evaluation of logical expressions follows the short-circuit evaluation strategy, meaning that the evaluation stops as soon as the result is determined. For example, in the expression `a and b`, if `a` is `false`, then `b` is not evaluated because the overall result is already determined to be `false`.

These operators can be used only with meta-expressions. Operator precedence and associativity are described in the section on operator precedence and associativity.

## Bitwise Expression

Bitwise expressions in NetX are used to perform bitwise operations on integer values.
The supported bitwise operators include:

- `~` for bitwise NOT (unary)
- `|` for bitwise OR (binary)
- `&` for bitwise AND (binary)
- `^` for bitwise XOR (binary)
- `~^` and `^~` for bitwise XNOR (binary)

These operators can be used only with meta-expressions. Operator precedence and associativity are described in the section on operator precedence and associativity.

## Comparison Expression

Comparison expressions in NetX are used to compare two values and return a boolean result.
While the operators support multiple types, both operands must be of the same type.
For integer operands, their widths must also match.

The binary infix equality operators are `==` (equality) and `!=` (inequality).
These support integer, boolean, and list values.
Two lists are considered equal if they have the same length and all corresponding elements are equal.

The binary infix relational operators include:

- `<`  less than (signed)
- `<=`  less than or equal to (signed)
- `>`  greater than (signed)
- `>=`  greater than or equal to (signed)
- `<*`  less than (unsigned)
- `>*`  greater than (unsigned)
- `<=*` less than or equal to (unsigned)
- `>=*` greater than or equal to (unsigned)

These operators work only with integer values and compare them according to their numerical order.
The `*` suffix indicates signed comparison: although integers in NetX are unsigned by default, these operators interpret their binary representation as signed integers.

Comparison operators can be used only with meta-expressions. Operator precedence and associativity are described in the section on operator precedence and associativity.

## Shift Expression

Shift expressions in NetX are used to perform bitwise shift operations on integer values.
The supported shift operators include:

- `<<` for logical left shift
- `<<<` for arithmetic left shift
- `>>` for logical right shift with zero fill
- `>>>` for arithmetic right shift with most significant bit fill

These operators can be used only with meta-expressions. Operator precedence and associativity are described in the section on operator precedence and associativity.

## Bracket Expression

Bracket expressions in NetX are used to group expressions and control the order of evaluation.
The supported bracket operators include:

- `(` and `)` for grouping expressions
- `[` and `]` for indexing into wires, arrays, and lists
- `{` and `}` for named connection (the section on combinator expression) and syntactic separating (the section on component scope)

These operators can be used with both circuit expressions and meta-expressions. Operator precedence and associativity are described in the section on operator precedence and associativity.

## Conditional Expression

Conditional expressions in NetX allow you to select between two expressions based on a boolean condition.
The syntax is `if condition then expr1 else expr2`, where `condition` is a boolean expression, and `expr1` and `expr2` are expressions of the same type.
If `condition` evaluates to `true`, the result is `expr1`; otherwise, the result is `expr2`.
Conditional expressions can be used only with meta-expressions, provided the types of the two branches match.

## Binding Expression

Binding expressions in NetX allow you to bind a value to a variable for use in subsequent expressions.
The syntax is `let x = e1 in e2`, where `x` is the variable name, `e1` is the expression whose value will be bound to `x`, and `e2` is the expression in which `x` can be used.
It is an expression-level equivalent of the primitive let-binding statement described in the section on primitive let binding.

## Operator Precedence and Associativity

The binary operators in NetX are left-associative except for the exponentiation operator `**`, which is right-associative.
The unary operators in NetX are right-associative if they are prefix operators (such as `+`, `-`, `~`, `not`, and the prefix `#`), and left-associative if they are postfix operators (such as the postfix `#`).

The precedence and associativity of the operators, from highest to lowest, are:

| Operators | Associativity | Usage |
| --- | --- | --- |
| `[]`, `.` | — | `expr[index]`, `expr.field` |
| `#` | Right (prefix), Left (postfix) | `#expr`, `expr#` |
| `+`, `-`, `~`, `not` | Right | `+expr`, `-expr`, `~expr`, `not expr` |
| `**` | Right | `expr ** expr` |
| `*`, `/`, `%` | Left | `expr * expr`, `expr / expr`, `expr % expr` |
| `<<`, `<<<`, `>>`, `>>>` | Left | `expr << expr`, `expr <<< expr`, `expr >> expr`, `expr >>> expr` |
| `<`, `<=`, `>`, `>=`, `<*`, `>*`, `<=*`, `>=*` | Left | relational comparison |
| `==`, `!=` | Left | equality comparison |
| `&` | Left | `expr & expr` |
| `^~`, `~^`, `^` | Left | XNOR and XOR |
| `\|` | Left | `expr \| expr` |
| `and` | Left | `expr and expr` |
| `or` | Left | `expr or expr` |
| `++` | Left | `expr ++ expr` |
| `<>` | Left | `expr <> expr` |
| `\|\|` | Left | `expr \|\| expr` |
| `if`, `then`, `else` | — | `if expr then expr else expr` |
| `()` | — | `(expr)` |

## Syntax Definition

Here we define the syntax for expressions in the NetX language.

```antlr
expression
  : symbol                                                          # SymbolExpr
  | STRING                                                          # StringExpr
  | number                                                          # NumberExpr
  | '[' list ']'                                                    # ListExpr
  | expression (selector)+                                          # AccessExpr
  | expression '.' ID                                               # FieldExpr
  | <assoc=right> prev='#' expression                               # UnaryExpr
  | <assoc=left> expression post='#'                                # UnaryExpr
  | <assoc=right> op=('+' | '-' | '~' | 'not') expression           # UnaryExpr
  | <assoc=right> lhs=expression op='**' rhs=expression             # BinaryExpr
  | lhs=expression op=('*' | '/' | '%') rhs=expression              # BinaryExpr
  | lhs=expression op=('+' | '-') rhs=expression                    # BinaryExpr
  | lhs=expression op=('>>'| '<<' | '>>>' | '<<<') rhs=expression   # BinaryExpr
  | lhs=expression op=('<' | '<=' | '>'  | '>=') rhs=expression     # BinaryExpr
  | lhs=expression op=('<*' | '<=*' | '>*'  | '>=*') rhs=expression # BinaryExpr
  | lhs=expression op=('==' | '!=') rhs=expression                  # BinaryExpr
  | lhs=expression op='&' rhs=expression                            # BinaryExpr
  | lhs=expression op=('^~' | '~^' | '^') rhs=expression            # BinaryExpr
  | lhs=expression op='|' rhs=expression                            # BinaryExpr
  | lhs=expression op='and' rhs=expression                          # BinaryExpr
  | lhs=expression op='or' rhs=expression                           # BinaryExpr
  | lhs=expression op='++' rhs=expression                           # BinaryExpr
  | lhs=expression op='<>' rhs=expression                           # BinaryExpr
  | lhs=expression op='||' rhs=expression                           # BinaryExpr
  | '{' port_assign (',' port_assign)* '}'                          # PortExpr
  | 'if' cond=expression
    'then' thenBranch=expression
    'else' elseBranch=expression                                    # ConditionalExpr
  | '(' expression ')'                                              # ParenExpr
  ;

port_assign
    : 'default' ':' rhs=expression
    | lhs=expression ':' rhs=expression
    ;
```
