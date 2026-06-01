---
title: 元编程
order: 6
---

# 元编程

NetX 语言的核心是电路表达式，它们与电路原理图紧密对应。
然而，电路原理图往往包含反复出现的模式与结构，仅用基本电路表达式来描述会非常繁琐。
原理图中的这些模式在代码中同样是模式；因此，对电路原理图中可复用的模式进行抽象，就是元编程的一种形式——这种机制让我们能够把代码当作数据来操作，从而提供强大的表达力与灵活性。

## 元别名

元别名允许用户为复杂的电路表达式定义简写记法，使处理复杂设计更加容易。通过创建元别名，用户可以把特定的电路模式封装起来，并在整个设计中复用，而不必每次都重写整个表达式。

### 组件属性

组件属性是在实例化组件时绑定的宏。
关于组件属性的细节见属性一节。

### 枚举

枚举是常量的别名。
枚举定义的语法如下：

```antlr
enum
  : 'enum' ID '{' ID (',' ID)* '}'
  | 'enum' ID '{' ID '=' number ( ',' ID '=' number )* '}'
  ;
```

- 枚举中的所有标识符必须唯一；否则编译器会报错。
- 如果枚举定义时没有给出显式取值，编译器会为每个标识符自动分配一个唯一的整数值：
  - 所有常量都被赋予相同位宽的值，该位宽是表示所有标识符所需的最小宽度。对于 n 个标识符，宽度为 $\lceil \log_2 n \rceil$。
  - 取值按声明顺序从零开始依次分配。
- 如果枚举包含显式取值，则每个标识符被赋予指定的值：
  - 如果所赋的取值宽度不同，编译器会把所有取值扩展到所需的最大宽度，必要时用前导零填充。
  - 所有取值（如适用，填充之后）在枚举内必须唯一；否则编译器会报错。
- 要访问枚举中的某个特定取值，使用点记法，例如 `enum_name.value_name`。如果没有歧义，也可以直接用 `value_name` 引用该取值。

例如：

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
  wire day_1, day_2 of WEEK_DAY;     // day 是 bit(3) 类型的导线
  wire random_1, random_2 of RANDOM; // status 是 bit(7) 类型的导线

  day_1 <> WEEK_DAY.MONDAY; // 合法：赋值为 3'b000
  day_2 <> SUNDAY;          // 合法：赋值为 3'b110
  random_1 <> RANDOM.GOOD;  // 合法：赋值为 7'b0000101
  random_2 <> RANDOM.GREAT; // 合法：赋值为 7'b0000010
}
```

### 基本 let 绑定

基本 let 绑定允许用户在组件作用域内为表达式定义可复用的宏。
基本 let 绑定的语法如下：

```antlr
binding
  : 'let' ID '=' expression
  ;
```

我们把基本 let 绑定的要点总结如下：

- let 绑定是组件作用域局部的，也就是说它只在定义它的组件内可见。
- let 绑定可以用于列表推导。关于列表推导的更多细节见列表作用域一节与列表推导一节。
- let 绑定可以遮蔽当前作用域中已有的名称绑定。关于作用域规则的更多细节见组件作用域一节与列表作用域一节。
- let 绑定是一种宏，在被引用时才惰性求值。
  自由名称在定义作用域中的 `let` 被展开时捕获其绑定。
  后续的名称遮蔽（包括调用处的循环变量和参数）不会改变这些绑定。
  每次引用都会重新求值宏体，生成的组件不会被缓存。
  例如，
  
```netx
component TEST {
  let i = 5;
  let width = 2 ** i;
  wire a[4] of bit(width); // width 求值为 2 ** 5 = 32
  for i in [0..4] {        // i 在循环创建的作用域中被遮蔽
    a[i] <> width;         // width 在每次迭代中始终为 32
  }
}
```

- 每个自由名称都必须在定义处已有绑定；不允许前向引用后续的局部声明。
  若希望位宽随调用处的索引变化，可定义 `let width(i) = 2 ** i` 并调用 `width(i)`。
- 普通绑定 `let x = expr` 是非递归的：右侧表达式引用此前的 `x` 绑定（如果存在）。
  例如，内层的 `let sum = sum + i` 会捕获外层的 `sum` 和当前的 `i`。
- 捕获线网或线束时保留的是该对象的身份，而不是信号值的采样。
  循环中定义的宏捕获当前迭代的绑定；组件中定义的宏捕获当前实例的属性。

## 参数化宏

参数化宏允许用户定义带有可配置参数的可复用模式。
这样可以创建更加灵活、适应性更强的设计。

参数化宏的语法如下：

```antlr
binding
  : 'let' ID '(' ID (',' ID)* ')' '=' expression
  ;
```

我们把参数化宏的要点总结如下：

- 参数化宏采用与基本 let 绑定相同的词法捕获和惰性求值规则，同时还绑定自身的名称以支持递归。
- 定义参数化宏时，宏名在当前作用域中绑定到一个 lambda 表达式。例如：
  
```netx
let macro(i, j, k) = i + j + k;
```

  创建了名称 `macro` 到 lambda 表达式 $\lambda i. \lambda j. \lambda k.\ i + j + k$ 的绑定。调用宏时，先在调用者的作用域中对实参求值。随后在新的作用域中求值宏体，该作用域包含捕获的绑定、宏自身的绑定，以及绑定到实参值的形参。求值完成后，该临时作用域被丢弃。位置调用和具名调用都必须恰好提供所有声明的参数。例如：
  
```netx
component TEST {
  let macro(i, j, k) = i + j + k;
  wire a, b, c of bit(32);
  a <> macro(1, 2, 3);    // 合法：求值为 6
  b <> macro(1, 2);       // 错误：缺少参数 k
  c <> macro(1, 2, 3, 4); // 错误：参数过多
}
```

- 参数化宏可以是递归的，从而可以定义调用自身的函数。例如：
  
```netx
let factorial(n) = 
  if n == 0 
  then 1 
  else n * factorial(n - 1)
;
```

  该示例定义了一个递归宏 `factorial`，用于计算一个数的阶乘。
  即使宏名之后被遮蔽，递归引用仍然绑定到这个宏。
  每次递归调用都有独立的参数绑定。不支持通过后续局部声明实现相互递归。
  再举一例，考虑如下代码片段：
  
```netx
let reg(clk) = REGISTER(pos_edge = true) <> [clk#, TO];
let shift_reg(n, clk) = 
  if n == 0 
  then TO 
  else reg(clk) <> shift_reg(n - 1, clk)
;
```

  该示例定义了一个递归宏 `shift_reg`，用于构造规模为 `n` 的移位寄存器：n 个寄存器串联在一起，每个都与同一个时钟同步。
  每个寄存器的输出连接到下一个寄存器的输入，第一个输入与最后一个输出保持未连接。
  例如，`shift_reg(4, clk)` 求值为 `reg(clk) <> reg(clk) <> reg(clk) <> reg(clk) <> TO`，其中四个寄存器串联在一起，每个都与时钟信号 `clk` 同步。

## 循环

循环允许用户遍历一个取值区间或一个集合，从而在电路设计中生成重复结构。循环的语法如下：

```antlr
element
  : /* ... */
  | 'for' iterator element          # Loop
  ;

iterator
  : ID 'in' expression
  ;
```

- 循环是组件作用域局部的，也就是说它们只能在组件定义内使用。
  循环的作用域规则在组件作用域一节中讨论。
- 循环用于在电路设计中创建重复结构。
  例如，编写如下循环构造：
  
```netx
wire carry[4] of bit(1);
for i in [0..4] {
  let carry_in = if i == 0 then 1'b0 else carry[i - 1];
  [c[i], carry[i]] <> FULL_ADDER <> [a[i], b[i], carry_in];
}
```

  等价于如下递归定义：
  
```netx
let FA(i) = [#c[i], TO] <> FULL_ADDER <> [a[i]#, b[i]#, TO];
let adder(i) = FA(i) <> (
  if i == 0 
  then 1'b0
  else adder(i - 1)
);
adder(4);
```

- 循环可以嵌套，从而通过遍历多个维度或集合来创建复杂的结构。
  例如：
  
```netx
wire a[4][4], b[4] of bit(8);
for i in [0..3] {
  for j in [0..3] {
    a[i][j] <> ADD <> [b[i], b[j]];
  }
}
```

  等价于
  
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

## 分支

分支允许用户根据给定的属性指定不同的组件结构。
分支的语法如下：

```antlr
element
  : /* ... */
  | 'if' cond=expression
    'then' thenBranch=element
    ('else' elseBranch=element)?            # Branch
  ;
```

- 分支是组件作用域局部的，也就是说它们只能在组件定义内使用。
  分支不会引入新的子作用域，因此分支的作用域规则与组件相同。
- 分支用于在电路设计中创建条件结构。
  例如，考虑如下组件定义：
  
```netx
// 注意 ++ 是列表连接运算符
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

  如果该组件以 `ADDER(true)` 实例化，它等价于
  
```netx
component ADDER : [a, b] -> [sum, carry] {
  let has_carry = true;
  wire a, b, sum, carry of bit(1);
  sum <> XOR <> [a, b];
  wire carry of bit(1);
  carry <> AND <> [a, b];
}
```

  如果以 `ADDER(false)` 实例化，它等价于
  
```netx
component ADDER : [a, b] -> [sum] {
  let has_carry = false;
  wire a, b, sum of bit(1);
  sum <> XOR <> [a, b];
}
```

- 分支可以嵌套，从而通过指定多个条件来创建复杂的结构。

## 列表推导

关于列表推导在 NetX 中如何工作，更多细节见列表推导一节与列表类型一节。
这里我们给出一个在元编程中使用列表推导的示例：

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

该代码定义了一个把独热码转换为二进制码的编码器（如上方的电路原理图所示）。
该电路使用 OR 门，根据输入的独热码来判断每个输出位是否应置为 1。
具体来说，当且仅当至少有一个输入位 j 为 1、且 j 的二进制表示的第 i 位也为 1 时，第 i 个输出位才置为 1。

该实现使用循环来处理每个输出位。
对于第 i 个输出位，我们用列表推导收集所有对该位有贡献的输入位置 j——即所有满足 j 的第 i 位等于 1 的位置，并用条件 `(j >> i) & 1` 来检查。

例如，当 `width = 2` 且 `i = 1` 时，列表推导求值为 `[input[1], input[3]]`，它是 `(input[1] || input[3])` 的语法糖，创建出如下门：

```netx
output[1] <> OR <> (input[1] || input[3])
```

## 系统宏

系统宏是提供系统级功能访问的内置宏，使用户能够直接在设计中执行常见操作。
目前支持以下系统宏：

- `log2`：计算整数 n 的以 2 为底的对数。如果 n = 0，该宏返回 0；否则返回 n - 1 的位宽。结果始终是 32 位整数。
- `print`：向控制台输出一条消息。它接受多个参数，将它们连接为单个字符串并打印结果。例如，`print("i = ", i, ", j = ", j)` 会使用 `i` 与 `j` 的当前取值，向控制台打印 `i = 1, j = 2`（不含引号）。
- `contains`：检查给定元素是否存在于某个集合中。
  它返回一个布尔值，表示该元素是否存在。例如，`contains([1, 2, 3], 2)` 返回 `true`。
- `empty`：检查给定集合是否为空。它返回一个布尔值，表示该集合是否没有元素。例如，`empty([])` 返回 `true`。
- `length`：返回一个 32 位整数，表示列表中元素的数量。例如，`length([1, 2, 3])` 返回 `3`。

## 求值顺序

作用域内元编程构造的求值顺序为：

1. 将属性绑定到传入的实体（如果存在）。
1. 按出现顺序求值 let 绑定、循环、分支及其他表达式。
1. 求值组件的输入与输出端口列表。

注意，即使输入与输出端口列表写在组件定义的开头，它们也是最后求值的。
这确保了在求值端口列表之前，列表中出现的数据都已被声明并绑定到正确的实体。
