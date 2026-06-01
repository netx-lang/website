---
title: NXON 后端表示
order: 7
---

# NXON 后端表示

NXON 后端表示是一种低层的、基于 JSON 的格式，用于描述 NetX 源代码中定义的电路原理图。
该表示会完全展开组件层次，并把所有数组与捆绑展平为单根导线，因此适合仿真器、综合器、可视化器等后端工具使用。

## 顶层结构

展开后的 NXON 表示是一个 JSON 对象，包含两个字段：

- `total`：电路设计中导线的总数。
  注意，如信号类型一节所述，数组与捆绑在该表示中会被展平为单根导线。
- `top_input` 与 `top_output`：两个字符串数组，表示顶层组件头部中定义的原始输入与输出端口名。由于别名分析可能会用别名替换原始端口名，这两个字段保存原始名称，以便于仿真与调试。
- `design`：表示电路设计顶层组件的 JSON 对象。

## 组件

每个组件都表示为一个 JSON 对象，包含以下字段：

- `type`：组件对象该字段设为 `"component"`。
- `id`：组件的唯一标识符。
- `loc`：组件定义在 NetX 源代码中的行列位置，表示为形如 `"row:col"` 的字符串。
- `attribute`：一个 JSON 对象，包含 NetX 源代码中定义的属性键值对（如果有）。
- `inputs`：一个标识符字符串数组，表示该组件应从中读取信号的导线。
- `outputs`：一个标识符字符串数组，表示该组件应向其中写入信号的导线。
- `members`：一个 JSON 对象数组，表示该组件内部的成员组件。

例如，以下是一个简单组件的合法 NXON 表示：

```nxon
{
  "total": 35,
  "design": {
    "type": "component",
    "id": "top",
    "loc": "1:10",
    "input": ["a@0", "b@1"],
    "output": ["c@2"],
    "attribute": {"width": "32"},
    "members": [
      ...
    ]
  }
}
```

注意，输入与输出标识符遵循 `"name@id"` 格式，其中 `name` 是导线名，`id` 是该导线的唯一整数标识符。
在更复杂的情况下，标识符可能采用以下形式：

- `"name@id[selector]"`，用于导线位选。
  例如，`"a@0[1]"` 与 `"a@0[3:1]"` 是导线位选的合法标识符。
- `"arr[0]@4"`、`"arr[1]@5"`、`"package.valid@142"` 等，用于名称已从数组展平或从捆绑拆解而来的导线。
- `"arr[0].valid@4[0]"` 或 `"arr[0]@142[3:1]"`，用于已展平、已拆解并进一步进行位选的导线。

导线名中整数标识符的唯一限制是它们必须唯一，也就是说它们可以是任意整数，但不能有两根导线拥有相同的标识符。

## 导线

每根导线都表示为组件 `members` 数组中的一个 JSON 对象。
导线对象包含以下字段：

- `type`：导线对象该字段设为 `"wire"`。
- `id`：导线的唯一标识符。
- `width`：导线的宽度，表示为整数。
- `loc`：导线声明的源代码位置。

例如，一个导线对象可能如下所示：

```nxon
"members": [
    {"type": "wire", "width": 8, "id": "a@0", "loc": "2:27"},
    {"type": "wire", "width": 8, "id": "b@1", "loc": "2:30"},
    {"type": "wire", "width": 8, "id": "c@2", "loc": "2:9"},
    ...
]
```

## 内置组件

内置组件的表示与用户定义组件类似，包含以下字段：

- `type`：内置组件该字段设为 `"builtin"`。
- `id`：内置组件的唯一标识符。
- `loc`：引用该内置组件的源代码位置。
- `attribute`：一个 JSON 对象，包含 NetX 源代码中定义的属性键值对（用于 `REGISTER` 与 `ASYNC_REGISTER`）。
- `inputs`：一个 JSON 对象，把输入端口名映射到对应的导线标识符。
- `outputs`：一个 JSON 对象，把输出端口名映射到对应的导线标识符。
- `members`：一个 JSON 对象数组，表示该内置组件内部的成员组件。
  注意，内置组件的成员只包含导线，因为内置组件不包含其他子组件。

例如，一个内置组件可能如下所示：

```nxon
"members": [
  {
    "type": "builtin", "id": "REGISTER", "loc": "5:29",
    "input": ["a@2", "clk@0"],
    "output": ["b@3"],
    "attribute": {"pos_edge": "true"}
  },
  {
    "type": "builtin", "id": "OR", "loc": "11:13",
    "input": ["b@3", "c@4"],
    "output": ["clk_3@1"]
  },
  ...
]
```

这里，以美元符号（$）开头的标识符是编译器按需生成的中间导线。

## 示例

对于如下 NetX 源代码：

```netx
component HA : [a, b] -> [sum, carry] {
  wire a, b, sum, carry of bit(1);
  sum <> XOR <> [a, b];
  carry <> AND <> [a, b];
}
component FA : [a, b, cin] -> [sum, cout] {
  wire a, b, cin, sum, cout of bit(1);
  [sum, cout] <> [TO, OR] 
              <> [HA, TO] 
              <> [TO, HA] <> [a, b, cin];
}
```

上述设计展开后的 NXON 表示如下：

```nxon
{
  "total": 8,
  "top_input": ["a", "b", "cin"],
  "top_output": ["sum", "cout"],
  "design": {
    "type": "component",
    "id": "FA",
    "loc": "7:10",
    "input": ["a@0", "b@1", "cin@2"],
    "output": ["sum@3", "cout@4"],
    "members": [
      {"type": "wire", "width": 1, "id": "a@0", "loc": "8:9"},
      {"type": "wire", "width": 1, "id": "b@1", "loc": "8:12"},
      {"type": "wire", "width": 1, "id": "cin@2", "loc": "8:15"},
      {"type": "wire", "width": 1, "id": "sum@3", "loc": "8:20"},
      {"type": "wire", "width": 1, "id": "cout@4", "loc": "8:25"},
      {
        "type": "component", "id": "HA", "loc": "11:24",
        "input": ["b@1", "cin@2"],
        "output": ["sum@5", "carry@6"],
        "members": [
          {"type": "wire", "width": 1, "id": "sum@5", "loc": "2:15"},
          {"type": "wire", "width": 1, "id": "carry@6", "loc": "2:20"},
          {
            "type": "builtin", "id": "XOR", "loc": "3:11",
            "input": ["b@1", "cin@2"],
            "output": ["sum@5"]
          },
          {
            "type": "builtin", "id": "AND", "loc": "4:13",
            "input": ["b@1", "cin@2"],
            "output": ["carry@6"]
          }
        ]
      },
      {
        "type": "component", "id": "HA", "loc": "10:20",
        "input": ["a@0", "sum@5"],
        "output": ["sum@3", "carry@7"],
        "members": [
          {"type": "wire", "width": 1, "id": "carry@7", "loc": "2:20"},
          {
            "type": "builtin", "id": "XOR", "loc": "3:11",
            "input": ["a@0", "sum@5"],
            "output": ["sum@3"]
          },
          {
            "type": "builtin", "id": "AND", "loc": "4:13",
            "input": ["a@0", "sum@5"],
            "output": ["carry@7"]
          }
        ]
      },
      {
        "type": "builtin", "id": "OR", "loc": "9:24",
        "input": ["carry@7", "carry@6"],
        "output": ["cout@4"]
      }
    ]
  }
}
```
