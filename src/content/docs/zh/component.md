---
title: 组件
order: 5
---

# 组件

NetX 语言中的组件对应于硬件设计中的组件，是电路的基本构成模块。
组件在 NetX 中是一等实体，这意味着它们可以参与元编程，例如作为属性传递、存入列表等。

## 定义

组件定义的语法见组件作用域一节。
我们把要点总结如下：

- 组件定义具有可选的属性列表；如果不出现，则认为该组件没有属性。
- 组件定义具有可选的端口列表 `expr -> expr`；如果不出现，则认为该组件没有端口。
  这些表达式应求值为数据（包括导线与捆绑）的列表或空列表。
  特别地，如果组件只有一个输入或输出，该表达式也可以求值为单个数据元素。
  例如，以下组件定义都是合法的：
  
```netx
component A                { /* ... */ }
component B : [] -> [x, y] { /* ... */ }
component C : [] -> z      { /* ... */ }
component D(a) : 
  [x] ++ [y[i] | i in[0..8]] -> 
  if a then z[0] else z[1] { /* ... */ }
```

- 接口定义必须具有非空的输入端口列表，并省略输出端口列表，因为它们是特殊类型的组件（见信号类型一节）。
  例如：
  
```netx
interface A : [x, y]     { /* ... */ } // 合法
interface B : x          { /* ... */ } // 合法
interface C              { /* ... */ } // 错误：接口必须具有输入端口
interface D : [a] -> [z] { /* ... */ } // 错误：不能指定输出端口
```

## 实例化

组件可以在表达式中通过引用其名称并按需提供所需属性来实例化。
每次实例化组件时，都会创建一个新的组件作用域。
组件实例化的语法如下：

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

注意，属性可以按顺序传递给组件，也可以用 `name = value` 语法显式命名，且顺序任意。
例如：

```netx
component A(a, b, c, d) { /* ... */ }
component TEST {
  A(1, 2, 3, 4);                 // 合法：a = 1, b = 2, c = 3, d = 4
  A(1, 2, 3);                    // 错误：必须指定所有属性
  A(a = 1, b = 2, c = 3, d = 4); // 合法
  A(d = 4, b = 2, a = 1, c = 3); // 合法：属性可以按任意顺序指定
}
```

数据（作为特殊组件的导线与捆绑）的实例化是一个特例。
由于命名数据的语义规定，传递给某个数据实例的任何信号都会在同名的所有实例之间共享，因此每次引用同一个数据实例是等价的。
为简单起见，编译器可以不为每次实例化创建新的数据实例，而是复用已有的实例。

## 属性

属性是在表达式中实例化组件时可以绑定到特定实体的名称。
属性可用于创建参数化组件，组件的内部结构可以根据属性的取值而变化。
例如，考虑如下组件定义：

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

该代码定义了一个编码器，它将独热码转换为二进制码。
该组件具有一个属性 `width`，它决定输出二进制码的宽度，并进一步决定输入独热码的宽度。
编码器可以用不同的 `width` 值实例化，从而处理不同规模的独热码。

此外，不仅能以整数值作为属性，还可以用其他组件作为属性——这允许更复杂的参数化与模板化设计。
例如，考虑如下组件定义：

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
  TOWER(AND); // 合法：功能上等价于一个 4 对 1 AND 门
  TOWER(XOR); // 合法：功能上等价于一个 4 对 1 XOR 门
  TOWER(OR);  // 合法：功能上等价于一个 4 对 1 OR 门
}
```

在编译期间，属性 `base` 被绑定到组件 `AND`、`OR` 或 `XOR`，组件体也相应地展开，在同一个名为 `TOWER` 的模式中实例化出不同的组件。

## 数据声明

NetX 中的数据包括导线与捆绑，它们是特殊类型的组件。
数据声明是组件定义的一种特殊形式，其中组件没有属性，且端口固定为一个输入与一个输出。

数据声明的语法如下：

```antlr
data_declaration
  : kind='wire'   declaration_list 'of' type=symbol
  | kind='bundle' declaration_list 'of' type=symbol
  | kind='auto'   declaration_list
  ;

declaration_list : declaration_symbol (',' declaration_symbol)* ;

declaration_symbol : ID ('[' expression ']')* ;
```

要点如下：

- 数据是直通组件，输出的正是它作为输入接收的内容。
- 导线是承载基本信号类型（见信号类型一节）信号的直通组件：n 位宽信号（`of bit(n)`）、时钟信号（`of clock`）与枚举信号（`of enum_ID`）。
- 捆绑是承载捆绑类型（见信号类型一节）信号的直通组件。
  捆绑中的字段可以用点记法访问（见捆绑访问一节）。
- `auto` 关键字可用于声明导线而不指定其类型。
  此时，导线的类型由使用它的上下文推断。
  例如：
  
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
  z <> A <> [x, y]; // 合法：推断 a、b、c 的类型为 bit(32)
  d <> A <> [e, f]; // 合法：推断 a、b、c 的类型为 bit(4)
}
```

  注意，`AND`、`OR`、`XOR` 等内置组件会施加约束，要求其所有输入与输出具有相同的类型，这有助于编译器推断数据实例的类型。
  如果编译器无法推断用 `auto` 声明的导线的类型，或者某个约束被违反，程序将被拒绝。
- 此外，还有一种自动声明数据的便捷方式。
  通常，组件体中的表达式只引用当前作用域中显式定义的组件与数据。
  但为简单起见，你可以使用 `auto expression` 语法，让编译器按需自动声明导线。
  当编译器在表达式中遇到当前作用域尚未定义的名称时，它会隐式创建一根该名称的导线，并从上下文中推断其类型。
  例如：
  
```netx
component A : [a, b] -> [c] {
  wire a, b, c of bit(4);
  /* ... */
}

component B {
  // 合法：编译器自动声明类型为 bit(4) 的导线 x、y、z
  auto x <> A <> [NOT <> y, z]; 
}
```

  注意，自动声明只适用于导线，而不适用于捆绑，这是为了鼓励显式声明复杂数据类型——它们在硬件设计中并不常见，且需要谨慎使用。
