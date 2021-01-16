## Modbus/RTU Transport-layer Subsystem Configuration Guide

Both master-side and slave-side shares the same configuration template:

```
{
    "device": {
        "driver": "generic",
        "path": "[Device path]",
        "baudrate": 9600,
        "data-bits": 8,
        "parity": "even",
        "stop-bits": 1
    },
    "timing": {
        "scale": 1
    }
}
```

Detailed description:

<table>
<thead>
<th>Name</th>
<th>Optional</th>
<th>Type</th>
<th>Description</th>
<th>Range/Limitation</th>
</thead>
<tbody>
<tr>
<td>device.driver</td>
<td>&radic; (Default: "generic")</td>
<td>String</td>
<td>Device driver.</td>
<td></td>
</tr>
<tr>
<td>device.path</td>
<td>&#10005</td>
<td>String</td>
<td>Device path (e.g. "/dev/ttyUSB0").</td>
<td></td>
</tr>
<tr>
<td>device.baudrate</td>
<td>&#10005</td>
<td>Number (Integer)</td>
<td>UART baudrate (unit: bps).</td>
<td>&ge;1</td>
</tr>
<tr>
<td>device.data-bits</td>
<td>&radic; (Default: 8)</td>
<td>Number (Integer)</td>
<td>UART data bits.</td>
<td>7 (Not recommended) or 8</td>
</tr>
<tr>
<td>device.parity</td>
<td>&radic; (Default: "even")</td>
<td>String</td>
<td>UART parity bit.</td>
<td>"even" for even parity.<br/>"odd" for odd parity.<br/>"none" for no parity.</td>
</tr>
<tr>
<td>device.stop-bits</td>
<td>&radic; (Default: 1)</td>
<td>Number (Integer)</td>
<td>UART stop bits.</td>
<td>1 or 2</td>
</tr>
<tr>
<td>timing.scale</td>
<td>&radic; (Default: 1)</td>
<td>Number (Integer)</td>
<td>RTU timing scale.</td>
<td>[1, 512]</td>
</tr>
</tbody>
</table>

<u>Note about the "timing.scale" configuration</u>:

The Modbus/RTU uses 3.5 character time and 1.5 character time as frame/character delimiter. The timespan is too short for modern non-realtime desktop operating systems. So this option is provided to increase the timespan.

If you specified a timing scale different from 1, *N* character time would become *N * [Timing scale]* character time.

