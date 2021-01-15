const Color = require("color");
const spi = require("spi-device");

const TRANSFER_SPEED = 2500000; // Hz (400ns)

module.exports = class WS281xSPI {
  /**
   * @param nPixels Integer Number of LEDs you have (default: 256)
   * @param bus Integer Index of the bus to use (1 on Pine64, 0 on RPi) (default: 0)
   * @param device Integer Index of the device on the bus to use (default: 0)
   * @param grb Boolean True if your LEDs use GRB (default), or false if RGB
   */
  constructor(nPixels=256, bus=0, device=0, grb=true) {
    this.data = (new Uint32Array(nPixels)).fill(0x0);
    this._spi = spi.openSync(bus, device);
    this.mapping = grb ? [1, 0, 2] : [0, 1, 2];
    this._renderQueue = Promise.resolve();
    this.brightness = 1;
  }

  /**
   * destroy - Close SPI and optinally turn off LEDs
   * After this method is called, the instance is no longer usable
   *
   * @param black Boolean Optional, true if the method should turn off LEDs, false leaves them as they are
   */
  destroy(black=true) {
    if (black) {
      this.data.fill(0x0);
      this.render();
    }
    this._spi.closeSync();
    this._spi = null;
    this.data = null;
  }

  /**
   * render - Render current data to strip
   *
   * @param data Uint32Array Optional data to replace current data with
   */
  render(data) {
    if (data) {
      if (this.data instanceof Uint32Array) this.data.set(data);
      else data.forEach((v, i) => this.data[i] = v);
    }

    this.brightness = Math.min(1, Math.max(0, this.brightness));

    // Convert color data to ws281x PWM wave represented by string of binary
    const waveBinary = this.data.reduce((wave, color) => {
      color = Color(color).rgb().array();
      // Remap colors (to GRB mostly)
      color = [
        color[this.mapping[0]] * this.brightness,
        color[this.mapping[1]] * this.brightness,
        color[this.mapping[2]] * this.brightness
      ];

      // Convert each color component to binary octet and map to ws281x signal
      return wave += (color.map(comp =>
        Array.from(comp.toString(2).padStart(8, 0)).map(bit =>
          "1"+bit+"0" // 1 0 0 => 0; 1 1 0 => 1
        ).join("") // will be 8 * 3 long
      ).join(""));
    }, "0").split("");


    // Convert binary to decimal bytes
    const waveDecimal = [];

    while (waveBinary.length) {
      // Get one byte from the binary wave
      const octet = waveBinary.splice(0, 8).join("");
      // Convert binary to number (0 - 255)
      waveDecimal.push(parseInt(octet, 2));
    }

    // Send the wave to LEDs
    this._renderQueue = this._renderQueue.then(() => new Promise(resolve =>
      this._spi.transfer([{
        sendBuffer: Buffer.from(waveDecimal),
        byteLength: waveDecimal.length,
        speedHz: TRANSFER_SPEED,
      }], resolve)
    ));

    // const messages = [];
    //
    // for (let color of this.data) {
    //   color = Color(color).rgb().array();
    //   // Remap colors (to GRB mostly) if needed
    //   color = [
    //     color[this._mapping[0]],
    //     color[this._mapping[1]],
    //     color[this._mapping[2]]
    //   ];
    //
    //   messages.push({
    //     // Translate decimals to binary and binary to signals
    //     sendBuffer: Buffer.from(color.reduce((arr, byte) => (
    //       arr.push(...Array.from(byte.toString(2).padStart(8, 0)).map(bit =>
    //         SYMBOLS[bit]
    //       )) && arr
    //     ), [])),
    //     byteLength: 3 * 8,
    //     speedHz: TRANSFER_SPEED,
    //   });
    // }
    //
    // while (messages.length) {
    //   const page = messages.splice(0, PAGESIZE);
    //   this._spi.transferSync(page);
    // }
  }
};
