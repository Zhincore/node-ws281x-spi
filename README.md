# WS281x-spi
Allows controlling WS281x LEDs over SPI pin on single board computers like Pine64 or Raspberry Pi.

---

# Installation
```
npm i ws281x-spi
```

# Usage
The node proccess needs to run as root to be able to access to SPI.  

Example code on Pine64:
```JS
const Strip = require("ws2812-spi");

// 8 LEDs, Bus index 1, Device index 0
const strip = new Strip(8, 1, 0);

// Set all LEDs to red color
strip.data.fill(0xff0000);

// Send the change to the LEDs
strip.render();

// After 1 second, turn off the strip and exit
setTimeout(_ => strip.destroy(), 1000);
```

# API
## `new WS281xSPI()` - Constructor
Parameters:
+ `nPixels` (Integer) - Number of LEDs you have (default: 256)
+ `bus` (Integer) - Index of the bus to use (1 on Pine64, 0 on RPi) (default: 0)
+ `device` (Integer) - Index of the device on the bus to use (default: 0)
+ `grb` (Boolean) - True if your LEDs use GRB (default), or false if RGB

### `.data` - Parameter defining the color of each individual pixel
Must be either:
+ `Uint8Array` of values that form 0xRRGGBB in hexadecimal form. (eg. `0xff0000` is red)
+ `Array` with values that the library [color](https://www.npmjs.com/package/color) can understand. (Basically any CSS representation of color and more) (eg. `"#ff0000"`, `"red"`, `{r: 255, g: 0, b: 0}`, `[255, 0, 0]` or `"hsl(0deg, 100%, 50%)"`, see the library's documentation for reference)

### `.render()` - Send the current data to the LED strip
You can optionally pass a object similar to `.data` defined above that will replace the values in current `.data` before rendering.  
Parameters:
+ `data` Uint8Array or Array - Optional data to replace current data with. (explained above)

### `.destroy()` - Close the SPI communication and optionally turn off the LEDs
After the method is called, the instance is no longer usable. SPI communication is closed and reference to `.data` is dropped.  
It's a good idea to call this method before exitting the node process.
Parameters:
+ `black` Boolean - True if the LEDs should be turned off (set black color) before destroing, false will keep the LEDs as they are


# Support
If you successfully run this on a setup not listed here, feel free to share with me in issues, as well as your achievements with and thoughts about this library.  

The following has been tested to be functional:  

## SBCs
+ Pine64 (SPI1_MOSI/PD2 pin (19) on [Euler Bus](http://files.pine64.org/doc/Pine%20A64%20Schematic/a64-db-rev%20b-20151217-Plus-Release.pdf))

## LEDs
+ WS2812b

---

# License
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

See <https://www.gnu.org/licenses/>.

# Author
Adam "Zhincore" Žingor - [zhincore.eu](https://zhincore.eu/)
