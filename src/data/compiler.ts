// rv32i benchmark: CPU core snippet and project config.

export const cpuCore = `application rv32i;

import std.selector.*;
import std.utils.REG;

component CORE : [clk, rst, instr, dmem_out] -> [
    imem_addr, dmem_addr, dmem_in, dmem_op, dmem_wr
] {
    wire clk of clock();
    wire rst, dmem_wr of bit(1);
    wire dmem_op of bit(3);
    wire instr, imem_addr, dmem_addr, dmem_in, dmem_out of bit(32);

    let nop = 32'h00000013; // addi x0, x0, 0
    let rd_nonzero(rd) = OR <> [rd[i] | i in [0..5]];
    let reg(v_rst) = REG(pos_edge=true, high_rst=true, rst_value=v_rst) <> [clk#, rst#, TO];

    bundle ifid of IF_ID_PIPE;
    bundle idex of ID_EX_PIPE;
`;

export const netxToml = `[project]
name = "rv32i"
version = "0.1.0"
include = [ "src/" ]

[dependencies]
std = { version = "0.1.0", git = "git@github.com:netx-lang/netx-std.git" }`;
