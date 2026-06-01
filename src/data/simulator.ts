// rv32i benchmark: simulation stimuli, based on the paper's case study.

export const simStimuli = `#include <nxsim/simulator.h>
auto ctx  = parse_circuit("circuit.nxon");
auto imem = new Memory("gcd.hex");
auto dmem = new Memory("gcd.data");
auto instr = 0;

ctx.set("rst", 1);
ctx.flip("clk"); ctx.flip("clk");
ctx.set("rst", 0);
while (instr != 0xDEAD10CC) {
    instr = imem->read_word(ctx.get("PC"));
    ctx.set("instr", instr);

    if (ctx.get("dmem_wr") == high)
        dmem->write(ctx.get("dmem_addr"), ctx.get("dmem_in"));
    ctx.set("dmem_out", dmem->read(ctx.get("dmem_addr")));

    ctx.flip("clk"); ctx.flip("clk");
}

assert(ctx.get("x10") == 0x00C0FFEE);`;
