// NetX code samples shown on the landing page. These are language-neutral.

export const and4 = `component and4 : [a, b, c, d] -> [out] {
    wire a, b, c, d, out of bit(1);
    out <> AND <> (AND || AND) <> [a, b, c, d];
}`;

export const rippleAdder = 
`/*
  The ripple-carry adder computes the sum of two inputs of width bits
  by propagating the carry bit through a chain of full adders.
*/
component ADDER(width) : [a, b] -> [c] {
    wire a, b, c of bit(width);
    let unit(i)  = [#c[i], TO] <> FA <> [a[i]#, b[i]#, TO];
    let chain(i) = if i < 0 then 1'b0 else unit(i) <> chain(i - 1);
    chain(width - 1);
}

// The full adder computes the sum and carry of three bits.
component FA : [a, b, cin] -> [sum, cout] {
    wire a, b, cin, sum, cout of bit(1);
    [sum, cout] <> [TO, OR] 
                <> [HA, TO]
                <> [TO, HA] <> [a, b, cin];
}

// The half adder computes the sum and carry of two bits.
component HA : [a, b] -> [sum, carry] {
    wire a, b, sum, carry of bit(1);
    sum   <> XOR <> [a, b];
    carry <> AND <> [a, b];
}
`;

export const encoder = `component ENCODER(width) : [x] -> [y] {
    let W = 2 ** width;
    wire x of bit(W);
    wire y of bit(width);

    for i in [0..width] {
        y[i] <> OR <> [
            x[j] | j in [0..W],
                   when (j >> i) & 1
        ];
    }
}`;

export const fsm = 
`// import multiplexers from the standard library
import std.selector.MUX;

// define the states of the FSM as an enumeration
enum VGA_H_STATE { H_VISIBLE, H_FRONT, H_SYNC, H_BACK }

// The state machine controls the horizontal timing of a VGA signal. 
component FSM_H : [vga_clk, h_zero] -> [h_state] {
    wire vga_clk of clock;        // the clock signal
    wire h_zero  of bit(1);       // the reset signal
    wire h_state of VGA_H_STATE;
    h_state <> REGISTER(pos_edge = true) <> [vga_clk,
        MUX(1) <> [h_zero, h_state,
            MUX(2) <> {           // decide the next state
                sel : h_state,
                case[H_VISIBLE] : H_FRONT,
                case[H_FRONT]   : H_SYNC,
                case[H_SYNC]    : H_BACK,
                case[H_BACK]    : H_VISIBLE
            }
        ]
    ];
}`;

export const regfile = 
`import std.utils.REG;
import std.selector.MUX;

// A register file with a single write port and two read ports.
component REG_FILE(width, capacity) : 
    [clk, rst, rd_addr_a, rd_addr_b, wr_en, wr_addr, din] 
    -> [dout_a, dout_b] {

    // define the IO signals
    wire clk                           of clock;
    wire rst, wr_en                    of bit(1);
    wire din, dout_a, dout_b           of bit(width);
    wire rd_addr_a, rd_addr_b, wr_addr of bit(capacity);

    // define the internal storage as an array of wires
    let W = 2 ** capacity;
    wire data[W] of bit(width);

    // specify how registers should behave
    let rst_reg = REG (
        pos_edge = true, 
        high_rst = true, 
        rst_value = 0
    );

    // the main logic for address decoding and data routing
    wire wr_mask of bit(W);
    wr_mask <> DECODER(capacity) <> wr_addr;
    for i in [0..W] {
        data[i] <> rst_reg <> [clk, rst, 
            MUX(1) <> { 
                sel : AND <> [wr_en, wr_mask[i]],
                case[1] : din,
                case[0] : data[i]
            }
        ];
    }
    dout_a <> MUX(capacity) <> [rd_addr_a] ++ [data[i] | i in [0..W]];
    dout_b <> MUX(capacity) <> [rd_addr_b] ++ [data[i] | i in [0..W]];
}`;

export const tabs = [
  { id: "adder", code: rippleAdder },
  { id: "fsm", code: fsm },
  { id: "regfile", code: regfile },
] as const;
