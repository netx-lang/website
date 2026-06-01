---
title: Lexical Structure
order: 1
---

# Lexical Structure

The lexical elements of the NetX language are as follows:

- White spaces
- Symbols
- Comments
- Identifiers and Keywords
- Literals

In this section, we use the ANTLR regular expression notation to define the lexical elements of the NetX language.
To be specific, we use the following notations:

- `''` encloses a string literal. For example, the  `'hello world'` is the regular expression that matches exactly the string `hello world`.
- The  `.` operator matches any single character.
- The  `~` operator matches any character except those in the set after it.
  For example, the expression  `~('\n')` matches any character except the newline character.
- `|` denotes that the regular expression matches either the left or right side of the operator.
  For example, the expression  `'true' | 'false'` matches either the string  `'true'` or  `'false'`.
- Further, we use  `[]` to enclose a set of characters. The expression matches any single character in the set, such as  `[01]`, which matches either the character `0` or `1`, and  `[a-zA-Z]`, which matches any letter in the English alphabet, either lower or upper case.
- The  `*` operator matches zero or more occurrences of the preceding element.
  For example, the expression  `[1-9][0-9]*` matches any positive integer, which starts with a digit from 1 to 9 and is followed by zero or more digits from 0 to 9.
- The  `+` operator matches one or more occurrences of the preceding element.
  For example, the expression  `[01]+` matches any binary number, which consists of one or more digits that are either `0` or `1`.
- The  `?` operator matches zero or one occurrence of the preceding element.
  For example, the expression  `[0-9]?` matches either a single digit from 0 to 9 or nothing at all.
- The  `-> skip` directive after a regular expression indicates that the matched text should be ignored by the lexer, effectively skipping it.

## White Spaces

White spaces are used to separate tokens in the source code. They include spaces, tabs, and newlines. White spaces are generally ignored by the compiler, except where they are necessary to separate tokens.

```antlr
WHITE_SPACE: [ \t\r\n]+ -> skip;
```

## Comments

Comments are used to annotate the code and are ignored by the compiler. They can be single-line comments, which start with `//`, or multi-line comments, which are enclosed in `/* ... */`.

```antlr
COMMENT: '//' ~('\n')* '\n' -> skip;
BLOCK_COMMENT: '/*' .*? '*/' -> skip;
```

## Literals

Literals are fixed values written directly in the code. They include boolean literals, floating-point literals, and numeric literals of various widths (the bit-width of their binary representation) and radices.

- Boolean: The boolean literals are `true` and `false`.
- Floating-Point: The floating-point literals can be specified with a width.
  The supported widths are 16, 32, and 64 bits corresponding to half-precision, single-precision, and double-precision IEEE 754 formats, respectively.
  For example:  `32'f3.14` is a single-precision floating-point literal representing the value 3.14.
  If no width is specified, the compiler should assume it to be a 32-bit single-precision floating-point number.
- Numeric: Numeric literals can be specified with a width and radix.
  The radix could be `b` (binary), `h` (hexadecimal), `o` (octal), or `d` (decimal).
  The specified value is the sequence of digits in the specified radix. The width is a positive integer, and the value can include underscores for readability.
  For example: `4'b1010` is a binary literal representing a 4-bit number, with the value `1010` in binary.
  For a literal with no width and radix specified, the compiler should assume it to be a 32-bit decimal number.

```antlr
BOOLEAN : 'true' | 'false';
BIN_NUMBER : INTEGER '\'' [bB] [01] [01_]*;
HEX_NUMBER : INTEGER '\'' [hH] [0-9a-fA-F] [0-9a-fA-F_]*;
OCT_NUMBER : INTEGER '\'' [oO] [0-7] [0-7_]*;
DEC_NUMBER : INTEGER '\'' [dD] [0-9] [0-9_]*;
INTEGER : [0-9] [0-9_]*;
FLOAT : INTEGER ('.' INTEGER)?;
SIZED_FLOAT : INTEGER '\'' [fF] FLOAT;
```

For example, the following literals are valid:

```netx
true, false, 4'b1010, 8'hFF, 12'o17, 32'd42, 3.14, 64'F2.71828
```

Note that the given width may not match the digit sequence, in which case the compiler will pad the literal with leading zeros or truncate it to fit the specified width.

## Strings

Strings are sequences of characters enclosed in double quotes. They are only used in the system function `print`.

```antlr
STRING : '"' (~["\\] | '\\' .)* '"';
```

## Symbols

Symbols include operators, delimiting characters, and parentheses used in the syntax of the NetX language.
They fall into the following groups:

- **Circuit assembly**: `<>` (sequential combinator), `||` (parallel combinator), `#` (port decorator)
- **Arithmetic**: `+` (addition), `-` (subtraction), `*` (multiplication), `/` (division), `%` (modulo), `**` (exponentiation)
- **Comparison**: `<`, `<=`, `>`, `>=`, `==`, `!=`, and the unsigned variants `<*`, `<=*`, `>*`, `>=*`
- **Bitwise**: `&` (AND), `|` (OR), `^` (XOR), `~` (NOT), `^~` and `~^` (XNOR)
- **Shift**: `>>` (right), `<<` (left), `>>>` (arithmetic right), `<<<` (arithmetic left)
- **Lists and ranges**: `++` (list concatenation), `..` (range)
- **Delimiters and binding**: `=` (binding), `,` (separator), `->` (port arrow), `;` (terminator), `:` (annotation), `.` (field access), and the brackets `( )`, `[ ]`, `{ }`

The full precedence order is given in the section on operator precedence and associativity.
Note that logical operators are not listed above, as they are written as the keywords `and`, `or`, and `not` in the NetX language.

## Identifiers and Keywords

Identifiers are names used to identify components, data, and other entities in the code.
They must start with a letter or an underscore and can be followed by letters, digits, or underscores.

```antlr
ID : [a-zA-Z_] [a-zA-Z0-9_]*;
```

Identifiers must not be the same as any of the reserved keywords, which are special strings that have a predefined meaning in the NetX language.
The reserved keywords, grouped by role, are:

- **Declarations and imports**: `application`, `library`, `import`, `as`, `component`, `interface`, `enum`
- **Data**: `default`, `wire`, `bundle`, `auto`, `of`
- **Meta-programming**: `let`, `for`, `if`, `then`, `else`, `in`, `when`
- **Literals and logic**: `true`, `false`, `and`, `or`, `not`
