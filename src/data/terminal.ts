// Authentic terminal sessions from the RV32I benchmark, one per tool.

export type TermLine =
  | { kind: "cmd"; text: string }
  | { kind: "out"; text: string }
  | { kind: "info"; text: string }
  | { kind: "warn"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "test"; text: string }
  | { kind: "summary"; text: string }
  | { kind: "time"; text: string }
  | { kind: "blank" };

// `nx compile` — source to NXON.
export const compilerSession: TermLine[] = [
  { kind: "cmd", text: "nx compile _netx.toml --top CORE --minimal --output compiled.json" },
  { kind: "info", text: "INFO   Start Parsing: src/alu.nx" },
  { kind: "info", text: "INFO   Start Parsing: src/fpga.nx" },
  { kind: "info", text: "INFO   Start Parsing: src/branch.nx" },
  { kind: "info", text: "INFO   Start Parsing: src/rv32i.nx" },
  { kind: "info", text: "INFO   Start resolving dependency: std" },
  { kind: "info", text: "INFO   Start Parsing: build/std/src/arith.nx" },
  { kind: "info", text: "INFO   Start Parsing: build/std/src/utils.nx" },
  { kind: "info", text: "INFO   Start Parsing: build/std/src/random.nx" },
  { kind: "info", text: "INFO   Start Parsing: build/std/src/memory.nx" },
  { kind: "info", text: "INFO   Start Parsing: build/std/src/selector.nx" },
  { kind: "info", text: "INFO   Start Parsing: build/std/test/memory_test.nx" },
  { kind: "info", text: "INFO   Start Parsing: build/std/test/arith_test.nx" },
  { kind: "info", text: "INFO   Start Parsing: build/std/test/selector_test.nx" },
  { kind: "info", text: "INFO   Start Parsing: build/std/test/random_test.nx" },
  { kind: "warn", text: "WARN   rv32i.nx:64:14:" },
  { kind: "out", text: "  component has unused bits of input instr@(rv32i.nx:547:9)" },
  { kind: "out", text: "  in rv32i.nx:64:14: component IMM_SELECTOR" },
  { kind: "out", text: "  in : component CORE" },
  { kind: "warn", text: "WARN   rv32i.nx:71:42:" },
  { kind: "out", text: "  component has unused bits of input update_pc@(branch.nx:90:9)" },
  { kind: "out", text: "  in rv32i.nx:71:42: component BRANCH_PREDICTOR" },
  { kind: "out", text: "  in : component CORE" },
];

// Build the C++ testbench, then simulate the compiled circuit.
export const simulatorSession: TermLine[] = [
  { kind: "cmd", text: "c++ -O3 -ffast-math -march=native -std=c++23 -o build/rv32i_test main.cpp" },
  { kind: "blank" },
  { kind: "cmd", text: "cat compiled.json | build/rv32i_test" },
  { kind: "blank" },
  { kind: "heading", text: "=== Running tests from 'testcases' ===" },
  { kind: "test", text: "Running test case: \"sra.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"slti.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"bne.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"bgeu.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"lhu.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"lbu.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"lw.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"sltu.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"lb.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"srli.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"beq.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"jal.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"sw.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"xori.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"addi.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"lui.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"blt.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"lh.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"srl.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"slli.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"simple.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"slt.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"ori.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"bltu.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"add.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"xor.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"sh.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"and.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"andi.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"sub.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"sltiu.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"srai.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"or.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"bge.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"auipc.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"jalr.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"sb.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"sll.hex\"	-> Passed!" },
  { kind: "summary", text: "Passed 38/38 test cases" },
  { kind: "time", text: "Elapsed time: 0.140039s" },
  { kind: "blank" },
  { kind: "cmd", text: "cat compiled.json | build/rv32i_test --dir custom_cases" },
  { kind: "blank" },
  { kind: "heading", text: "=== Running tests from 'custom_cases' ===" },
  { kind: "test", text: "Running test case: \"sort.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"gcd.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"poly.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"switch.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"fib.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"matrix.hex\"	-> Passed!" },
  { kind: "test", text: "Running test case: \"prime.hex\"	-> Passed!" },
  { kind: "summary", text: "Passed 7/7 test cases" },
  { kind: "time", text: "Elapsed time: 2.02558s" },
];

// `nx dump dot` — the circuit graph as Graphviz DOT.
export const visualizerSession: TermLine[] = [
  { kind: "cmd", text: "nx dump dot _netx.toml --top CORE -o vis.dot" },
  { kind: "blank" },
  { kind: "cmd", text: "dot -T pdf vis.dot -o vis.pdf" },
];

// `nx dump verilog` — structural Verilog for backend tools.
export const backendSession: TermLine[] = [
  { kind: "cmd", text: "nx dump verilog _netx.toml -t CORE -o circuit.v" },
  { kind: "blank" },
  { kind: "cmd", text: "head -n 16 circuit.v" },
  { kind: "out", text: "module CORE(" },
  { kind: "out", text: "  _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16" },
  { kind: "out", text: ");" },
  { kind: "blank" },
  { kind: "out", text: "/*============================== DATA ==============================*/" },
  { kind: "blank" },
  { kind: "out", text: "/* \"CORE\"; \"\" */" },
  { kind: "out", text: "  input wire _0; // CLOCK rv32i.nx:35:9:clk" },
  { kind: "out", text: "  input wire _1; // rv32i.nx:36:9:rst" },
  { kind: "out", text: "  input wire [31:0] _2; // rv32i.nx:37:9:instr" },
  { kind: "out", text: "  output wire _8; // rv32i.nx:38:9:dmem_wr" },
  { kind: "out", text: "  output wire [2:0] _7; // rv32i.nx:39:9:dmem_op" },
  { kind: "out", text: "  output wire [31:0] _4; // rv32i.nx:40:9:imem_addr" },
  { kind: "out", text: "  output wire [31:0] _5; // rv32i.nx:40:20:dmem_addr" },
  { kind: "out", text: "  output wire [31:0] _6; // rv32i.nx:40:31:dmem_in" },
  { kind: "out", text: "  input wire [31:0] _3; // rv32i.nx:40:40:dmem_out" },
];
