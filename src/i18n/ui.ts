export const languages = {
  en: "English",
  zh: "中文",
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = "en";

const en = {
  "skip": "Skip to content",
  "nav.docs": "Docs",
  "nav.menu": "Toggle navigation",
  "meta.title": "NetX: A Schematic Programming Language for Hardware Design",
  "meta.description":
    "NetX is a hardware description language that arranges code to resemble circuit schematics, making code-to-circuit consistency a first-class design principle.",

  "hero.tagline": "A Schematic Programming Language for Hardware Design.",
  "hero.lede":
    "NetX arranges code to resemble circuit schematics. With the straightfoward semantics mapping syntax to schematics, we make <em>consistency</em> a first principle—<em>what you design is what you get</em>.",
  "hero.getStarted": "Get started",
  "hero.docs": "Read the docs",
  "hero.paper": "Tech Report",
  "hero.codeCaption": "encoder.nx",

  "overview.kicker": "Overview",
  "overview.title": "The Schematic Programming Model",
  "overview.lead":
    "Write your code schematically, and stay consistent with your intended circuit.",
  "feature.core.title": "Schematic Core",
  "feature.core.body":
    "Arrange code on a breadboard: components are aligned along horizontal and vertical grids via the serial and parallel combinators <code>&lt;&gt;</code> and <code>||</code>. Names become jumper wires modeling complex topologies on the breadboard.",
  "feature.meta.title": "Meta-Programming",
  "feature.meta.body":
    "Patterns in schematics appear exactly as patterns in code, so meta-programming — the abstraction of code patterns — can provide extra expressiveness without sacrificing consistency.",
  "feature.formal.title": "Formal Guarantees",
  "feature.formal.body": 
    "The core language is mechanized and verified in Rocq, providing formal foundations for the reasoning of various schematic properties (e.g., acyclicity and planarity) by directly inspecting source code.",
  "news.title": "News",
  "adder.caption": "A 4-bit ripple-carry adder built from a repeating pattern.",

  "language.kicker": "Language",
  "language.title": "Read the Code, See the Circuit",
  "language.lead":
    "Examples on how code resembles schematics, and how meta-programming become a powerful tool to express complex circuit patterns.",
  "tabs.adder": "Ripple-carry adder",
  "tabs.fsm": "State machine",
  "tabs.regfile": "Register file",
  "language.cta": "Full syntax and semantics are in the <a href=\"{docs}\">language specification</a>.",

  "toolchain.kicker": "Toolchain",
  "toolchain.title": "From Source to Silicon",
  "toolchain.lead":
    "The compiler lowers NetX to <strong>NXON</strong>, a JSON circuit-graph IR used for optimization, simulation, visualization, and backend generation.",
  "tool.compiler.title": "Compiler",
  "tool.compiler.body": "Resolve package dependencies; parse, elaborate, analyze, and optimize NetX source code.",
  "tool.simulator.title": "Simulator",
  "tool.simulator.body": "Interprets NXON as a reactive system; testbenches are written in C++.",
  "tool.visualizer.title": "Visualizer",
  "tool.visualizer.body": "Dumps the circuit graph to Graphviz DOT for inspection and rendering.",
  "tool.backend.title": "Backend",
  "tool.backend.body": "Generates structured Verilog for integration with existing EDA and FPGA flows.",
  "toolchain.fpga.caption": "The RV32I system deployed on a DE2-115 FPGA, running a Scheme REPL.",
  "toolchain.cpuview.caption": "The diagram rendered from the DOT graph of the 5-stage RV32I CPU core.",
  "toolchain.autoplay.pause": "Pause automatic tab switching",
  "toolchain.autoplay.play": "Resume automatic tab switching",

  "terminal.note": "Real output from the RV32I benchmark:",

  "docs.label": "Documentation",
  "docs.sidebarTitle": "Language Specification",
  "docs.toggleSections": "Show sections",
  "docs.footer": "NetX · MIT License",
  "footer.license": "NetX · MIT License",
  "lang.label": "Language",
};

const zh: Record<keyof typeof en, string> = {
  "skip": "跳到正文",
  "nav.docs": "文档",
  "nav.menu": "切换导航",
  "meta.title": "NetX：电路图式的硬件编程语言",
  "meta.description":
    "NetX 是一种硬件描述语言，它让代码的组织形式与电路原理图相呼应，将代码与电路的一致性作为一等设计原则。",

  "hero.tagline": "电路图式的硬件编程语言。",
  "hero.lede":
    "NetX 以一种与电路图相似的形式组织代码结构。我们将电路与代码间的<em>一致性</em>作为语言设计的第一性原理，于是 NetX 直观的语义让电路设计几乎 “所见即所得”。",
  "hero.getStarted": "快速开始",
  "hero.docs": "阅读文档",
  "hero.paper": "技术报告",
  "hero.codeCaption": "encoder.nx",

  "overview.kicker": "概览",
  "overview.title": "电路图式的编程模型",
  "overview.lead":
    "像绘制电路图一样写代码，让代码与期望的电路始终保持一致。",
  "feature.core.title": "核心语言",
  "feature.core.body": "把代码写在一块面包板上：通过串联、并联组合子 <code>&lt;&gt;</code> 与 <code>||</code>，让元件呈格点状排布；用名字表示跳线，用来刻画面包板上更复杂的拓扑结构。",
  "feature.meta.title": "元编程",
  "feature.meta.body": "电路图中出现的重复模式也会以相同形式出现在代码中，因而元编程（对代码模式的抽象）可以在不牺牲一致性的前提下增加表达能力。",
  "feature.formal.title": "形式化保证",
  "feature.formal.body": "核心语言已在 Rocq 中得到了机械化验证，这构成了从源码出发，推理各种电路图上性质（例如无环性与可平面性）的形式化基础。",
  "news.title": "动态",
  "adder.caption": "一个四位行波进位加法器，重复的模式构成了一条链。",

  "language.kicker": "语言",
  "language.title": "读代码，见电路",
  "language.lead": "几个例子：代码如何与电路图呼应，元编程如何成为表达复杂电路模式的有力工具？",
  "tabs.adder": "行波进位加法器",
  "tabs.fsm": "状态机",
  "tabs.regfile": "寄存器堆",
  "language.cta": "完整的语法与语义见<a href=\"{docs}\">语言规范</a>。",

  "toolchain.kicker": "工具链",
  "toolchain.title": "从源码到芯片",
  "toolchain.lead":
    "编译器将 NetX 源码编译到 NXON，一种基于 JSON 的底层电路表示，以便优化、仿真、可视化与后端集成。",
  "tool.compiler.title": "编译器",
  "tool.compiler.body": "从包管理开始，执行编译期计算、分析、优化，将 NetX 源码编译为 NXON。",
  "tool.simulator.title": "仿真器",
  "tool.simulator.body": "用 C++ 编写测试激励，解释执行 NXON 描述的电路系统。",
  "tool.visualizer.title": "可视化",
  "tool.visualizer.body": "将电路图导出为 Graphviz DOT，便于查看与渲染。",
  "tool.backend.title": "后端集成",
  "tool.backend.body": "生成结构化 Verilog，对接现有 EDA 与 FPGA 流程。",
  "toolchain.fpga.caption": "部署在 DE2-115 FPGA 上、运行 Scheme REPL 的 RV32I 系统。",
  "toolchain.cpuview.caption": "由 5 级流水线 RV32I CPU 核心的 DOT 图渲染得到的示意图。",
  "toolchain.autoplay.pause": "暂停自动切换",
  "toolchain.autoplay.play": "继续自动切换",

  "terminal.note": "RV32I 基准测试的真实输出：",

  "docs.label": "文档",
  "docs.sidebarTitle": "语言规范",
  "docs.toggleSections": "展开小节",
  "docs.footer": "NetX · MIT 许可证",
  "footer.license": "NetX · MIT 许可证",
  "lang.label": "语言",
};

const dictionaries = { en, zh } as const;

export type UIKey = keyof typeof en;

export function useTranslations(lang: Lang) {
  const dict = dictionaries[lang] ?? dictionaries[defaultLang];
  return function t(key: UIKey): string {
    return dict[key] ?? dictionaries[defaultLang][key] ?? key;
  };
}
