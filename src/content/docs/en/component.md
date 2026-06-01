---
title: Component
order: 5
---

# Component

A component in the NetX language corresponds to a component in hardware design, which is the fundamental building block of a circuit.
Components are first-class entities in NetX, meaning they can participate in meta-programming by being passed as attributes, stored in lists, etc.

## Definition

The syntax for component definition is shown in the section on component scope.
We summarize the key points as follows:

- Component definitions have an optional attribute list; if not present, the component is considered to have no attributes.
- Component definitions have an optional port list `expr -> expr`; if not present, the component is considered to have no ports.
  The expressions should evaluate to lists of data (including wires and bundles) or empty lists.
  Specifically, if the component has only one input or output, the expression can also evaluate to a single data element.
  For example, the following component definitions are all valid:
  
```netx
component A                { /* ... */ }
component B : [] -> [x, y] { /* ... */ }
component C : [] -> z      { /* ... */ }
component D(a) : 
  [x] ++ [y[i] | i in[0..8]] -> 
  if a then z[0] else z[1] { /* ... */ }
```

- Interface definitions must have non-empty input port lists and an omitted output port list, since they are special kinds of components (the section on signal type).
  For example:
  
```netx
interface A : [x, y]     { /* ... */ } // Valid
interface B : x          { /* ... */ } // Valid
interface C              { /* ... */ } // Error: interface must have input ports
interface D : [a] -> [z] { /* ... */ } // Error: cannot specify output ports
```

## Instantiation

A component can be instantiated in an expression by referring to its name and providing the required attributes if needed.
Each time a component is instantiated, a new component scope is created.
The syntax for component instantiation is as follows:

```antlr
symbol
  : ID '(' expression (',' expression)* ')'                   # CallSymbol
  | ID '(' attribute_assign (',' attribute_assign)* ')' # CallSymbol
  | ID '(' ')'                                                # CallSymbol
  | ID                                                        # PrimarySymbol
  ;

attribute_assign
    : ID '=' expression
    ;
```

Note that attributes can be passed to the component in order, or they can be explicitly named using the syntax `name = value` in any order.
For example:

```netx
component A(a, b, c, d) { /* ... */ }
component TEST {
  A(1, 2, 3, 4);                 // Valid: a = 1, b = 2, c = 3, d = 4
  A(1, 2, 3);                    // Error: all attributes must be specified
  A(a = 1, b = 2, c = 3, d = 4); // Valid
  A(d = 4, b = 2, a = 1, c = 3); // Valid: attributes can be specified in any order
}
```

The instantiation of data (wires and bundles, as special kinds of components) is a special case.
Since the semantics of named data specify that any signal passed to a data instance is shared among all instances with the same name, referring to the same data instance each time is equivalent.
For simplicity, the compiler may not create a new data instance for each instantiation, but rather reuse the existing one.

## Attribute

Attributes are names that can be bound to specific entities when a component is instantiated in an expression.
Attributes can be used to create parameterized components, where the inner structure of the component can change based on the values of the attributes.
For example, consider the following component definition:

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

The code defines an encoder, which converts one-hot code to binary code.
This component has an attribute `width`, which determines the width of the output binary code and further determines the width of the input one-hot code.
The encoder can be instantiated with different values for `width`, allowing it to handle one-hot codes of varying sizes.

Moreover, not only can integer values appear as attributes, but also other components—this allows for more complex parameterized and templated designs.
For example, consider the following component definition:

```netx
component TOWER(base) : [input] -> [output] {
  wire input of bit(4);
  wire output of bit(1);
  output <> base <> (base || base) <> [
    input[i] | i in [0..3]
  ];
}
```

```netx
component TEST {
  TOWER(AND); // Valid: functionally equivalent to a 4-to-1 AND gate
  TOWER(XOR); // Valid: functionally equivalent to a 4-to-1 XOR gate
  TOWER(OR);  // Valid: functionally equivalent to a 4-to-1 OR gate
}
```

During compilation, the attribute `base` is bound to the component `AND`, `OR`, or `XOR`, and the component body is expanded accordingly, with different components instantiated in the same pattern named `TOWER`.

## Data Declaration

Data in NetX comprise wires and bundles, which are special kinds of components.
A data declaration is a specialized form of component definition in which the component has no attributes and the ports are fixed to a single input and output.

The syntax for data declaration is as follows:

```antlr
data_declaration
  : kind='wire'   declaration_list 'of' type=symbol
  | kind='bundle' declaration_list 'of' type=symbol
  | kind='auto'   declaration_list
  ;

declaration_list : declaration_symbol (',' declaration_symbol)* ;

declaration_symbol : ID ('[' expression ']')* ;
```

Here are the key points:

- Data are pass-through components that output exactly what they receive as input.
- Wires are pass-through components that carry signals of primitive signal types (the section on signal type): n-bit wide signals (`of bit(n)`), clock signals (`of clock`), and enumeration signals (`of enum_ID`).
- Bundles are pass-through components that carry signals of bundle types (the section on signal type).
  Fields in a bundle can be accessed using dot notation (the section on bundle access).
- The `auto` keyword can be used to declare a wire without specifying its type.
  In this case, the type of the wire is inferred from the context in which it is used.
  For example:
  
```netx
component A : [a, b] -> [c] {
  auto a, b, c;
  c <> AND <> [
     OR <> [a, b],
    XOR <> [a, b]
  ];
}

component TEST {
  wire x, y, z of bit(32);
  wire d, e, f of bit(4);
  z <> A <> [x, y]; // Valid: infer bit(32) as the type of a, b, and c
  d <> A <> [e, f]; // Valid: infer bit(4) as the type of a, b, and c
}
```

  Note that built-in components such as `AND`, `OR`, and `XOR` impose constraints requiring that all their inputs and outputs must have the same type, which assists the compiler in inferring the type of the data instance.
  If the compiler cannot infer the type of a wire declared with `auto`, or if a constraint is violated, the program is rejected.
- In addition, there is a convenient way to declare data automatically.
  Normally, the body of a component contains expressions that reference only those components and data explicitly defined in the current scope.
  However, for simplicity, you can use the `auto expression` syntax to let the compiler automatically declare wires as needed.
  When the compiler encounters a name in an expression that is not already defined in the current scope, it will implicitly create a wire with that name and infer its type from the context.
  For example:
  
```netx
component A : [a, b] -> [c] {
  wire a, b, c of bit(4);
  /* ... */
}

component B {
  // Valid: compiler automatically declares wires x, y, z of bit(4)
  auto x <> A <> [NOT <> y, z]; 
}
```

  Note that automatic declaration only works for wires, not bundles, to encourage explicit declaration of complex data types—they are uncommon and need to be used with care in hardware design.
