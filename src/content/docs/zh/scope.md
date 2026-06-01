---
title: 名称与作用域
order: 3
---

# 名称与作用域

作用域用于指定 NetX 语言中名称的可见性。

## 全局作用域

全局作用域是 NetX 程序中最外层的作用域。在全局作用域中声明的名称可以从程序中的任何位置访问。
这包括按用途分组的内置组件：

- **连线**：`DUP`、`TO`、`CONCAT`、`SPLIT`
- **类型转换**：`CAST`、`UCAST`
- **位逻辑**：`NOT`、`OR`、`AND`、`XOR`、`NOR`、`NAND`、`XNOR`
- **比较**：`EQ`、`NE`、`SLT`、`SLE`、`SGT`、`SGE`、`ULT`、`ULE`、`UGT`、`UGE`
- **算术与移位**：`ADD`、`SUB`、`MUL`、`DIV`、`MOD`、`SHL`、`ASHR`、`LSHR`
- **时序**：`REGISTER`、`ASYNC_REGISTER`

请注意，内层作用域中的用户定义名称可以遮蔽内置组件的名称。

## 项目

项目是 NetX 项目的一个作用域，由一组 NetX 包组成；它是全局作用域的子作用域。
默认情况下，项目作用域是匿名的，但可以使用项目配置文件 `_netx.toml` 指定该作用域。
经过适当配置后，可以在 NetX 代码中使用 `import` 语句，通过配置文件中指定的名称引用项目作用域：

```netx
import some_project.some_package.some_component;
```

配置文件以 `project` 节开头，用于指定项目的基本信息，例如名称、版本以及要包含或排除的文件。例如，一个简单的项目配置文件可能如下所示：

```toml
[project]
name = "my_project"
version = "0.1.0"
include = ["src/", "test/"]
exclude = ["build/"]
```

若要进一步通过本地路径或远程 Git 仓库指定对其他项目的依赖，请使用 `dependencies` 节。
例如：

```toml
[dependencies]
my_lib = { version = ">=0.1.0", path = "../my_lib" }
std = { version = "0.1.0", git = "git@github.com:netx-lang/netx-std.git"}
```

这里，`version` 字段指定依赖项的版本约束，支持以运算符（`>`、`>=`、`<`、`<=`）开头，也可以不使用运算符来要求精确版本匹配。
Git 依赖项还可以分别使用 `branch`、`tag` 或 `commit` 字段指定特定的分支、标签或提交哈希。例如：

```toml
std = { git = "git@github.com:netx-lang/netx-std.git", commit = "f08d882" }
```

## 包

包是包含一组 NetX 组件、接口和枚举的作用域；它是项目的子作用域。
在包作用域内，无需导入即可通过名称访问实体。

包可以使用一个头部定义，该头部指定它是应用程序还是库。
如果未指定头部，则默认将该包视为匿名应用程序。
请注意，同一项目中以相同包名开头的文件被视为属于同一个包作用域。
包定义的语法如下：

```antlr
design
  : header? (import_ | component | interface | enum)+
  ;
  
header
  : kind='application' ID ';'
  | kind='library' ID ';'
  ;
```

这里，导入语句用于包管理，将名称绑定到其他包中的实体。
导入语句以 `import` 关键字开头，后跟实体（或实体集合）的引用，并可以选择指定别名。

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

引用是一个点分隔的路径，可以包含通配符或引用集合。
对于项目中的另一个包，引用可以短至 `package.entity`；对于另一个项目中的包，引用应以项目名称作为前缀，例如 `project.package.entity`。
使用通配符引用 `*` 可以导入包中的所有实体，而引用集合则允许一次导入多个实体。
例如，以下导入语句都是有效的：

```netx
import std.selector.MUX;
import std.random.GALOIS_LFSR as LFSR;
import lib.*;
import lib.{ADDER, MULTIPLIER} as {ADD, MUL};
```

特别地，如果两个导入语句将同一个名称绑定到不同的实体，后一个导入语句会遮蔽前一个。
如果同一个包中不同文件里的导入语句存在此类命名冲突，则遮蔽顺序是不确定的。

## 组件作用域

组件是 NetX 语言中的基本构建块；它是包的子作用域。
具体来说，接口是具有某些约束的特殊组件（请参阅信号类型一节）。
关于组件作用域，需要注意以下几点：

- 成对的大括号 `{ ... }` 不会创建新的子作用域。
  它们仅作为组件体、循环体和分支体的语法分隔符。
- 数据声明包括线声明和捆绑声明，这两者都会在当前作用域中为声明的名称创建新的绑定。
- 组件可以具有属性，即在组件于表达式中实例化时进行绑定的名称。
  例如，考虑以下组件定义：
  
```netx
component ADDER(carry_out) : [a, b] -> if carry_out then [sum, carry] else [sum] {
  wire a, b, sum of bit(32);
  if carry_out then {
    wire carry of bit(1);
  }
  /* ... */
}
```

  如果使用 `ADDER(true)` 实例化该组件，则创建的组件作用域会将 `carry_out` 绑定到 `true`，这会影响该作用域中的所有内容（例如输入和输出端口、数据声明以及其中的其他表达式）。
  因此，实例化后的组件等价于以下组件声明：
  
```netx
component ADDER : [a, b] -> [sum, carry] {
  let carry_out = true;
  wire a, b, sum of bit(32);
  wire carry of bit(1);
  /* ... */
}
```

- 循环 `for i in [0..4]` 会为每次迭代创建一个新的子作用域。
  在每次迭代中，`i` 都会绑定到范围 `[0..4]` 中的当前索引，并且子作用域中的任何名称绑定都会在当前迭代结束后释放。
- 宏绑定 `let x = expr` 会立即在当前作用域中添加一个将 `x` 绑定到表达式 `expr` 的新绑定；而参数化宏 `let x(i) = expr` 会添加一个将 `x` 绑定到 $\lambda i.\ \mathit{expr}$ 的绑定。
  两种形式都会在定义时捕获自由名称的绑定。普通绑定先在引入新名称之前解析其右侧表达式；参数化宏还会绑定自身的名称以支持递归。
  例如：
  
```netx
let sum = 0;
wire array[4] of bit(32);  
for i in [0..4] {
  let sum = sum + i; // 捕获外层的 sum = 0 和当前的 i
  array[i] <> sum;   // 在连续迭代中分别连接 0、1、2、3
}
```

  每次迭代都从同一个外层 `sum = 0` 开始；内层绑定不会更新它，也不会在迭代之间累加。
  如果不存在外层的 `sum`，普通绑定 `let sum = sum + i` 会因引用无法解析而被拒绝。

组件和接口声明的语法如下：

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

## 列表作用域

列表推导式在求值期间会引入新的作用域。
例如，以下列表推导式：

```netx
[i * i | i in [0..6], when i % 2 == 1]
```

求值结果为列表 `[1, 9, 25]`。

列表推导式的作用域规则如下：

- 对于每个生成器限定符 `x in list`，会为 `list` 中的每个元素创建一个新作用域。在此作用域中，`x` 绑定到当前元素。该作用域仅在当前迭代期间存在。
- 头部表达式（例如 `i * i`）会在一次迭代中处理完所有限定符后求值。它在最右侧生成器限定符所创建的最内层作用域中求值，其结果会追加到结果列表中。
  头部表达式求值完成后，生成器限定符创建的作用域会按照创建顺序的相反顺序释放。
- 对于每个过滤器限定符 `when expr`，表达式 `expr` 会在当前作用域中求值。
  如果求值结果为 `true`，则继续求值；否则终止当前迭代，并按照创建顺序的相反顺序释放生成器限定符创建的作用域。
- 对于每个绑定限定符 `let x = expr`，会在当前作用域中引入一个新绑定，即在最近的生成器限定符所创建的作用域中引入绑定。

有关列表推导式的更多详细信息，请参阅列表推导式一节。

## 枚举

枚举为一组值指定别名。
要访问枚举值，可以使用点表示法，例如 `COLOR.RED`；如果包中不存在歧义，也可以直接使用 `RED`。
枚举值的绑定具有最低优先级，这意味着如果同一个包中存在名为 `RED` 的组件，无论定义顺序如何，该组件都会遮蔽 `COLOR` 中的枚举值 `RED`——此时只能使用点表示法访问该枚举值，例如 `COLOR.RED`。

有关枚举定义的更多详细信息，请参阅元枚举一节。