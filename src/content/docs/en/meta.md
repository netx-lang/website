---
title: Meta-programming
order: 6
---

# Meta-programming

At the core of the NetX language are circuit expressions, which closely correspond to circuit schematics.
However, circuit schematics often contain recurring patterns and structures that are too tedious to specify using only basic circuit expressions.
These patterns in schematics are also patterns in code; thus, abstracting reusable patterns in circuit schematics is a form of meta-programming---the mechanism that enables us to manipulate code as data, providing powerful expressiveness and flexibility.

## Meta-Alias

Meta-aliases allow users to define shorthand notations for complex circuit expressions, making it easier to work with intricate designs. By creating a meta-alias, users can encapsulate a specific circuit pattern and reuse it throughout their designs without having to rewrite the entire expression each time.

### Component Attribute

Component attributes are macros bound when a component is instantiated.
See the section on attribute for details on component attributes.

### Enumeration

Enumerations are aliases to constants.
The syntax for enumeration definition is as follows:

```antlr
enum
  : 'enum' ID '{' ID (',' ID)* '}'
  | 'enum' ID '{' ID '=' number ( ',' ID '=' number )* '}'
  ;
```

- All identifiers in an enumeration must be unique; otherwise, the compiler reports an error.
- If the enumeration is defined without explicit values, each identifier is automatically assigned a unique integer value by the compiler:
  - All constants are assigned values of the same bit width, specifically the minimal width required to represent all identifiers. For n identifiers, the width is $\lceil \log_2 n \rceil$.
  - Values are assigned sequentially in declaration order, starting from zero.
- If the enumeration includes explicit values, each identifier is assigned the specified value:
  - If the assigned values have differing widths, the compiler extends all values to the maximum width required, padding with leading zeros as needed.
  - All values (after padding, if applicable) must be unique within the enumeration; otherwise, the compiler reports an error.
- To access a specific value within an enumeration, use dot notation, e.g., `enum_name.value_name`. If there is no ambiguity, the value can also be referred to directly as `value_name`.

For example:

```netx
enum WEEK_DAY {
  MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

enum RANDOM {
  GOOD = 3'b101,
  BAD = 7'b1111000,
  GREAT = 3'b010
}
```

```netx
component TEST {
  wire day_1, day_2 of WEEK_DAY;     // day is a wire of bit(3) type
  wire random_1, random_2 of RANDOM; // status is a wire of bit(7) type

  day_1 <> WEEK_DAY.MONDAY; // Valid: assign the value 3'b000
  day_2 <> SUNDAY;          // Valid: assign the value 3'b110
  random_1 <> RANDOM.GOOD;  // Valid: assign the value 7'b0000101
  random_2 <> RANDOM.GREAT; // Valid: assign the value 7'b0000010
}
```

### Primitive Let-Binding

Primitive let-binding allows users to define reusable macros for expressions within a component scope.
The syntax for primitive let-binding is as follows:

```antlr
binding
  : 'let' ID '=' expression
  ;
```

We summarize the key points of primitive let-binding as follows:

- Let-binding is local to a component scope, meaning that it is only visible within the component where it is defined.
- Let-binding can be used in list comprehensions. See the section on list scope and the section on list comprehensions for more details on list comprehensions.
- Let-binding may shadow existing name bindings in the current scope. See the section on component scope and the section on list scope for more details on the scoping rules.
- Let-binding is a macro that lazily evaluates the expression when it is referenced.
  Free names capture their bindings when the `let` is elaborated in its defining scope.
  Later shadowing, including loop variables and parameters at the call site, does not change those bindings.
  The body is evaluated afresh on each reference; generated components are not cached.
  For example,
  
```netx
component TEST {
  let i = 5;
  let width = 2 ** i;
  wire a[4] of bit(width); // width is evaluated to 2 ** 5 = 32
  for i in [0..4] {        // i is shadowed in the scope created by the loop
    a[i] <> width;         // width remains 32 in every iteration
  }
}
```

- Every free name must already be bound at the definition site; forward references to later local declarations are rejected.
  To vary the width with the caller's index, define `let width(i) = 2 ** i` and call `width(i)`.
- An ordinary binding `let x = expr` is nonrecursive: its right-hand side sees the previous binding of `x`, if one exists.
  For example, an inner `let sum = sum + i` captures the outer `sum` and the current `i`.
- Capturing a wire or bundle preserves its identity, not a sampled signal value.
  Macros defined inside a loop capture that iteration's bindings; macros inside a component capture that instance's attributes.

## Parameterized Macro

Parameterized macros allow users to define reusable patterns with configurable parameters.
This enables the creation of more flexible and adaptable designs.

The syntax for parameterized macros is as follows:

```antlr
binding
  : 'let' ID '(' ID (',' ID)* ')' '=' expression
  ;
```

We summarize the key points of parameterized macros as follows:

- Parameterized macros use the same lexical capture and lazy evaluation rules as primitive let bindings, but also bind their own name for recursion.
- When a parameterized macro is defined, the macro name is bound to a lambda expression in the current scope. For example:
  
```netx
let macro(i, j, k) = i + j + k;
```

  creates a binding of the name `macro` to the lambda expression $\lambda i. \lambda j. \lambda k.\ i + j + k$. When the macro is invoked, arguments are evaluated in the caller's scope. The body then runs in a fresh scope containing the captured bindings, the macro's self-binding, and its parameters bound to those argument values. After evaluation, this temporary scope is discarded. Both positional and named calls must supply exactly the declared parameters. For example:
  
```netx
component TEST {
  let macro(i, j, k) = i + j + k;
  wire a, b, c of bit(32);
  a <> macro(1, 2, 3);    // Valid: evaluates to 6
  b <> macro(1, 2);       // Error: missing parameter k
  c <> macro(1, 2, 3, 4); // Error: too many parameters
}
```

- Parameterized macros can be recursive, enabling the definition of functions that call themselves. For example:
  
```netx
let factorial(n) = 
  if n == 0 
  then 1 
  else n * factorial(n - 1)
;
```

  The example defines a recursive macro `factorial` that computes the factorial of a number.
  The recursive reference remains bound to this macro even if its name is later shadowed.
  Each recursive call has its own parameter bindings. Mutual recursion through later local declarations is not supported.
  For another example, consider the following code snippet:
  
```netx
let reg(clk) = REGISTER(pos_edge = true) <> [clk#, TO];
let shift_reg(n, clk) = 
  if n == 0 
  then TO 
  else reg(clk) <> shift_reg(n - 1, clk)
;
```

  The example defines a recursive macro `shift_reg` that constructs a shift register of size `n`, where n registers are chained together, each synchronized to the same clock.
  The output of each register is connected to the input of the next, with the first input and last output remaining unconnected.
  For instance, `shift_reg(4, clk)` evaluates to `reg(clk) <> reg(clk) <> reg(clk) <> reg(clk) <> TO`, where four registers are chained together, each synchronized to the clock signal `clk`.

## Loop

Loops allow users to iterate over a range of values or a collection, enabling the generation of repetitive structures in circuit designs. The syntax for loops is as follows:

```antlr
element
  : /* ... */
  | 'for' iterator element          # Loop
  ;

iterator
  : ID 'in' expression
  ;
```

- Loops are local to a component scope, meaning that they can only be used within a component definition.
  The scoping rules for loops are discussed in the section on component scope.
- Loops are used to create repetitive structures in circuit designs.
  For example, writing the loop construct:
  
```netx
wire carry[4] of bit(1);
for i in [0..4] {
  let carry_in = if i == 0 then 1'b0 else carry[i - 1];
  [c[i], carry[i]] <> FULL_ADDER <> [a[i], b[i], carry_in];
}
```

  is equivalent to the recursive definition:
  
```netx
let FA(i) = [#c[i], TO] <> FULL_ADDER <> [a[i]#, b[i]#, TO];
let adder(i) = FA(i) <> (
  if i == 0 
  then 1'b0
  else adder(i - 1)
);
adder(4);
```

- Loops can be nested, allowing for the creation of complex structures by iterating over multiple dimensions or collections.
  For example:
  
```netx
wire a[4][4], b[4] of bit(8);
for i in [0..3] {
  for j in [0..3] {
    a[i][j] <> ADD <> [b[i], b[j]];
  }
}
```

  is equivalent to
  
```netx
wire a[4][4], b[4] of bit(8);
a[0][0] <> ADD <> [b[0], b[0]];    a[2][0] <> ADD <> [b[2], b[0]];
a[0][1] <> ADD <> [b[0], b[1]];    a[2][1] <> ADD <> [b[2], b[1]];
a[0][2] <> ADD <> [b[0], b[2]];    a[2][2] <> ADD <> [b[2], b[2]];
a[0][3] <> ADD <> [b[0], b[3]];    a[2][3] <> ADD <> [b[2], b[3]];
a[1][0] <> ADD <> [b[1], b[0]];    a[3][0] <> ADD <> [b[3], b[0]];
a[1][1] <> ADD <> [b[1], b[1]];    a[3][1] <> ADD <> [b[3], b[1]];
a[1][2] <> ADD <> [b[1], b[2]];    a[3][2] <> ADD <> [b[3], b[2]];
a[1][3] <> ADD <> [b[1], b[3]];    a[3][3] <> ADD <> [b[3], b[3]];
```

## Branch

Branches allow users to specify different component structures based on the given attributes.
The syntax for branches is as follows:

```antlr
element
  : /* ... */
  | 'if' cond=expression
    'then' thenBranch=element
    ('else' elseBranch=element)?            # Branch
  ;
```

- Branches are local to a component scope, meaning that they can only be used within a component definition.
  Branches do not introduce new subscopes, so the scoping rules for branches are the same as those for components.
- Branches are used to create conditional structures in circuit designs.
  For example, consider the following component definition:
  
```netx
// Note that ++ is the list concatenation operator
component ADDER(has_carry) : [a, b] -> 
  [sum] ++ (if has_carry then [carry] else []) {
  wire a, b, sum of bit(1);
  sum <> XOR <> [a, b];
  if has_carry then {
    wire carry of bit(1);
    carry <> AND <> [a, b];
  }
}
```

  If the component is instantiated with `ADDER(true)`, it is equivalent to
  
```netx
component ADDER : [a, b] -> [sum, carry] {
  let has_carry = true;
  wire a, b, sum, carry of bit(1);
  sum <> XOR <> [a, b];
  wire carry of bit(1);
  carry <> AND <> [a, b];
}
```

  and if it is instantiated with `ADDER(false)`, it is equivalent to
  
```netx
component ADDER : [a, b] -> [sum] {
  let has_carry = false;
  wire a, b, sum of bit(1);
  sum <> XOR <> [a, b];
}
```

- Branches can be nested, allowing for the creation of complex structures by specifying multiple conditions.

## List Comprehensions

See the section on list comprehensions and the section on list type for more details on how list comprehensions work in NetX.
Here we provide an example of how to use list comprehensions in meta-programming:

%

```netx
component ENCODER(width) : [input] -> [output] {
  let W = 2**width;
  wire input  of bit(W);
  wire output of bit(width);
  
  for i in [0..width] {
    output[i] <> OR <> [
      input[j] | j in [0..W], when (j >> i) & 1
    ];
  }
}
```

The code defines an encoder that converts one-hot code to binary code (as shown in the circuit schematic above).
The circuit uses OR gates to determine whether each output bit should be set to 1 based on the input one-hot code.
Specifically, the i-th output bit is set to 1 if and only if at least one input bit j is set to 1, where the i-th bit of the binary representation of j is also 1.

The implementation uses a loop to handle each output bit.
For the i-th output bit, we use list comprehension to collect all input positions j that contribute to this bit—that is, all positions where the i-th bit of j equals 1, which is checked using the condition `(j >> i) & 1`.

For instance, with `width = 2` and `i = 1`, the list comprehension evaluates to `[input[1], input[3]]`, which is syntactic sugar for `(input[1] || input[3])`, creating the gate:

```netx
output[1] <> OR <> (input[1] || input[3])
```

## System Macros

System macros are built-in macros that provide access to system-level functionality, enabling users to perform common operations directly within their designs.
Currently, the following system macros are supported:

- `log2`: Computes the base-2 logarithm of an integer n. If n = 0, the macro returns 0; otherwise, it returns the bit-width of n - 1. The result is always a 32-bit integer.
- `print`: Outputs a message to the console. It accepts multiple arguments, concatenates them into a single string, and prints the result. For example, `print("i = ", i, ", j = ", j)` prints `i = 1, j = 2` (without quotes) to the console, using the current values of `i` and `j`.
- `contains`: Checks if a given element is present in a collection.
  It returns a boolean value indicating the presence of the element. For example, `contains([1, 2, 3], 2)` returns `true`.
- `empty`: Checks if a given collection is empty. It returns a boolean value indicating whether the collection has no elements. For example, `empty([])` returns `true`.
- `length`: Returns a 32-bit integer representing the number of elements in a list. For example, `length([1, 2, 3])` returns `3`.

## Evaluation Order

The evaluation order of meta-programming constructs inside a scope is:

1. Binding attributes to entities passed in (if there are any).
1. Evaluating let-bindings, loops, branches, and other expressions in the order of appearance.
1. Evaluating the input and output port lists of the component.

Note that the input and output port lists are evaluated last, even when they are specified in the head of the component definition.
This ensures that all the data appearing in the lists have been declared and bound to the correct entities before the port lists are evaluated.
