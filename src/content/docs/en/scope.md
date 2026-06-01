---
title: Name and Scope
order: 3
---

# Name and Scope

Scopes are used to specify the visibility of names in the NetX language.

## Global Scope

The global scope is the outermost scope in a NetX program. Names declared in the global scope are accessible from anywhere in the program.
This includes the built-in components, grouped by role:

- **Wiring**: `DUP`, `TO`, `CONCAT`, `SPLIT`
- **Type conversion**: `CAST`, `UCAST`
- **Bitwise logic**: `NOT`, `OR`, `AND`, `XOR`, `NOR`, `NAND`, `XNOR`
- **Comparison**: `EQ`, `NE`, `SLT`, `SLE`, `SGT`, `SGE`, `ULT`, `ULE`, `UGT`, `UGE`
- **Arithmetic and shifts**: `ADD`, `SUB`, `MUL`, `DIV`, `MOD`, `SHL`, `ASHR`, `LSHR`
- **Sequential**: `REGISTER`, `ASYNC_REGISTER`

Note that names of the built-in components can be shadowed by user-defined names in inner scopes.

## Project

A project is a scope for a NetX project, consisting of a set of NetX packages; it is a sub-scope of the global scope.
By default, the project scope is anonymous, but it can be specified using a project configuration file `_netx.toml`.
With proper configuration, it is possible to refer to the project scope using the `import` statement, by the name specified in the configuration file in the NetX code:

```netx
import some_project.some_package.some_component;
```

The configuration file starts with a `project` section specifying the basic information of the project, such as its name, version, and the files to include or exclude. For example, a simple project configuration file may look like this:

```toml
[project]
name = "my_project"
version = "0.1.0"
include = ["src/", "test/"]
exclude = ["build/"]
```

To further specify dependencies on other projects through either a local path or a remote Git repository, use the `dependencies` section.
For example:

```toml
[dependencies]
my_lib = { version = ">=0.1.0", path = "../my_lib" }
std = { version = "0.1.0", git = "git@github.com:netx-lang/netx-std.git"}
```

Here, the `version` field specifies the version constraint of the dependency, supporting a leading operator (`>`, `>=`, `<`, `<=`) or no operator for exact version matching.
Git dependencies can also specify a specific branch, tag, or commit hash using the `branch`, `tag`, or `commit` fields, respectively. For example:

```toml
std = { git = "git@github.com:netx-lang/netx-std.git", commit = "f08d882" }
```

## Package

A package is a scope that contains a set of NetX components, interfaces, and enumerations; it is a sub-scope of a project.
Entities can be accessed by name within the package scope without import.

A package can be defined with a header that specifies whether it is an application or a library.
If the header is not specified, the package is considered an anonymous application by default.
Note that files in the same project starting with the same package name are considered to be in the same package scope.
The syntax of a package definition is as follows:

```antlr
design
  : header? (import_ | component | interface | enum)+
  ;
  
header
  : kind='application' ID ';'
  | kind='library' ID ';'
  ;
```

Here, import statements are used for package management, binding names to entities in other packages.
The import statements start with the `import` keyword, followed by a reference to the entity (or entities) with an optional alias specification.

```antlr
import_
  : 'import' reference ('as' alias)? ';'
  ;

reference
  : ID ('.' ID)* ('.' reference_set)?	# CommonRef
  | ID ('.' ID)* '.' '*'              # WildcardRef
  ;

alias 
  : ID
  | reference_set
  ;

reference_set 
  : '{' ID (',' ID)* '}' 
    ;
```

The reference is a dotted path that can include wildcards or reference sets.
For another package in the project, the reference can be as short as `package.entity`; for a package in another project, the reference should be prefixed with the project name, such as `project.package.entity`.
Using the wildcard reference `*` allows importing all entities in the package, while the reference set allows importing multiple entities at once.
For example, the following import statements are all valid:

```netx
import std.selector.MUX;
import std.random.GALOIS_LFSR as LFSR;
import lib.*;
import lib.{ADDER, MULTIPLIER} as {ADD, MUL};
```

Notably, if two import statements bind the same name to different entities, the latter one will shadow the former.
If import statements in the same package but different files have such naming conflicts, the shadowing order is non-deterministic.

## Component Scope

A component is a fundamental building block in the NetX language; it is a sub-scope of a package.
Specifically, interfaces are special kinds of components that have certain constraints (the section on signal type).
We highlight the following key points about component scopes:

- The paired braces `{ ... }` do not create new subscopes.
  They are only syntactic separators for component bodies, loop bodies, and branch bodies.
- The data declaration includes wire declaration and bundle declaration, both of which create a new binding of the declared name in the current scope.
- Components can have attributes, i.e., names that get bound when the component is instantiated in an expression.
  For example, consider the following component definition:
  
```netx
component ADDER(carry_out) : [a, b] -> if carry_out then [sum, carry] else [sum] {
  wire a, b, sum of bit(32);
  if carry_out then {
    wire carry of bit(1);
  }
  /* ... */
}
```

  If the component is instantiated with `ADDER(true)`, then the created component scope will have a binding of `carry_out` to `true`, which would affect everything in that scope (e.g., the input and output ports, the data declarations, and other expressions inside).
  As a result, the instantiated component would be equivalent to the following component declaration:
  
```netx
component ADDER : [a, b] -> [sum, carry] {
  let carry_out = true;
  wire a, b, sum of bit(32);
  wire carry of bit(1);
  /* ... */
}
```

- The loop `for i in [0..4]` creates a new subscope for each iteration.
  In each iteration, there is a binding of `i` to the current index in the range `[0..4]`, and any name bindings in the subscope are released after the current iteration.
- The macro binding `let x = expr` adds a new binding of `x` to the expression `expr` in the current scope immediately; while the parameterized macro `let x(i) = expr` adds a binding of `x` to $\lambda i.\ \mathit{expr}$.
  Both forms capture free-name bindings at definition time. An ordinary binding resolves its right-hand side before introducing its new name; a parameterized macro additionally binds its own name for recursion.
  For example:
  
```netx
let sum = 0;
wire array[4] of bit(32);  
for i in [0..4] {
  let sum = sum + i; // captures the outer sum = 0 and the current i
  array[i] <> sum;   // connects 0, 1, 2, and 3 in successive iterations
}
```

  Each iteration starts from the same outer `sum = 0`; the inner binding does not update it or accumulate across iterations.
  Without an existing outer `sum`, the ordinary binding `let sum = sum + i` is rejected as an unresolved reference.

The syntax for component and interface declaration is as follows:

```antlr
component
  : 'component' ID attributes? (':' component_type)? component_body
  ;

interface
  : 'interface' ID attributes? ':' type=expression component_body
  ;

component_type
  : from=expression '->' to=expression 
  ;

attributes
  : '(' ID (',' ID)* ')'
  ;

component_body
  : '{' element* '}'
  ;

element
  : binding ';'                             # BindingStatement
  | data_declaration ';'                    # DataDeclaration
  | 'auto' expression ';'                   # MixedInstantiation
  | expression ';'                          # ComponentInstantiation
  | 'for' iterator element                  # Loop
  | 'if' cond=expression
    'then' thenBranch=element
    ('else' elseBranch=element)?            # Branch
  | '{' element* '}'                        # Block
  ;

binding : 'let' symbol '=' expression ;

iterator : ID 'in' expression ;
```

## List Scope

List comprehensions introduce new scopes during their evaluation.
For example, the following list comprehension expression:

```netx
[i * i | i in [0..6], when i % 2 == 1]
```

evaluates to the list `[1, 9, 25]`.

The scoping rules for list comprehensions are as follows:

- For each generator qualifier `x in list`, a new scope is created for each element of `list`. In this scope, `x` is bound to the current element. The scope exists only for the duration of the current iteration.
- The heading expression (e.g., `i * i`) is evaluated after all qualifiers in an iteration have been processed. It is evaluated in the innermost scope created by the right-most generator qualifier, and its result is appended to the resulting list.
  After the evaluation of the heading expression, the scopes created by the generator qualifiers are released in the reverse order of their creation.
- For each filter qualifier `when expr`, the expression `expr` is evaluated in the current scope.
  If it evaluates to `true`, evaluation continues; otherwise, the current iteration is terminated and scopes created by the generator qualifiers are released in the reverse order of their creation.
- For each binding qualifier `let x = expr`, a new binding is introduced in the current scope, i.e., the scope created by the nearest generator qualifier.

For more details on list comprehensions, see the section on list comprehensions.

## Enumerations

Enumerations specify aliases for a set of values.
To access the values of an enumeration, you can use the dot notation, e.g., `COLOR.RED`, or directly `RED` if there is no ambiguity in the package.
The binding of the enumeration values is of the lowest precedence, meaning that if, in the same package, there is a component named `RED`, it will shadow the enumeration value `RED` in `COLOR` regardless of the order of definition---in this case, you can only access the enumeration value using the dot notation, e.g., `COLOR.RED`.

Check the section on meta enumeration for more details on enumeration definitions.
