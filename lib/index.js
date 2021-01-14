const Color = require("color");
const spi = require("spi-device");

const PAGESIZE = 8; // pixels per message
const TRANSFER_SPEED = 2000000;
const SYMBOLS = {
  0: 0x04,
  1: 0x06,
}

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
    this._mapping = grb ? [1, 0, 2] : [0, 1, 2];
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

    const sequence = this.data.reduce((sequence, color) => {
      color = Color(color).rgb().array();
      // Map to GRB if needed
      color = [
        color[this._mapping[0]],
        color[this._mapping[1]],
        color[this._mapping[2]]
      ];
      // Change GRB to binary and binary to PWM symbols
      sequence.push(...color.reduce((arr, item) => (
        arr.push(...Array.from(item.toString(2).padStart(8, 0)).map(bit => (
          SYMBOLS[bit]
        ))) && arr
      ), []));
      return sequence;
    }, []);


    const messages = [];

    while (sequence.length) {
      const subsequence = sequence.splice(0, PAGESIZE * 3);

      messages.push({
        sendBuffer: Buffer.from(subsequence),
        byteLength: subsequence.length,
        speedHz: TRANSFER_SPEED,
      });
    }

    this._spi.transferSync(messages);
  }
};
