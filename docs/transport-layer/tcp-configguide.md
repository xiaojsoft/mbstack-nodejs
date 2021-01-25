## Modbus/TCP Transport-layer Subsystem Configuration Guide

### Master-side

The master-side TCP transport-layer subsystem is a TCP client. Here is the configuration template:

```
{
    "slave": {
        "host": "[Destination address]",
        "port": 502
    },
    "timeout": {
        "idle": 30000,
        "retry": 1000,
        "establish": 6000
    },
    "parallel": 65536
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
<td>slave.host</td>
<td>&#10005</td>
<td>String</td>
<td>Destination address.</td>
<td></td>
</tr>
<tr>
<td>slave.port</td>
<td>&radic; (Default: 502)</td>
<td>Number (Integer)</td>
<td>Destination port.</td>
<td>[1, 65535]</td>
</tr>
<tr>
<td>timeout.idle</td>
<td>&radic; (Default: 30000)</td>
<td>Number (Integer)</td>
<td>TCP connection idle timeout (in milliseconds).</td>
<td>&ge;1</td>
</tr>
<tr>
<td>timeout.retry</td>
<td>&radic; (Default: 1000)</td>
<td>Number (Integer)</td>
<td>TCP connection retry (reconnect) timeout (in milliseconds).</td>
<td>&ge;1</td>
</tr>
<tr>
<td>timeout.establish</td>
<td>&radic; (Default: 6000)</td>
<td>Number (Integer)</td>
<td>TCP connection establish (connect) timeout (in milliseconds).</td>
<td>&ge;1</td>
</tr>
<tr>
<td>parallel</td>
<td>&radic; (Default: 65536)</td>
<td>Number (Integer)</td>
<td>Maximum incomplete Modbus transaction count.</td>
<td>[1, 65536]</td>
</tr>
</tbody>
</table>

<u>Note about the "parallel" configuration (for master)</u>:
 - A completed Modbus transaction is either:
    - The request (query) that needs no response (answer) and the request frame was transmitted to the slave.
    - The request (query) that needs response (answer), the request frame was transmitted to the slave and the response frame was received.

### Slave-side

The slave-side TCP transport-layer subsystem is a TCP server. Here is the configuration template:

```
{
    "bind": {
        "address": "[Bind address]",
        "port":    502
    },
    "exclusive": true,
    "dualstack": true,
    "max-connections": null,
    "parallel": 1024,
    "timeout": {
        "idle": 60000
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
<td>bind.address</td>
<td>&radic; (Default: "0.0.0.0")</td>
<td>String</td>
<td>TCP server bind address.</td>
<td></td>
</tr>
<tr>
<td>bind.port</td>
<td>&radic; (Default: 502)</td>
<td>Number (Integer)</td>
<td>TCP server bind port.</td>
<td>[0, 65535]</td>
</tr>
<tr>
<td>exclusive</td>
<td>&radic; (Default: false)</td>
<td>Boolean</td>
<td>TCP server port exclusive switch.</td>
<td></td>
</tr>
<tr>
<td>dualstack</td>
<td>&radic; (Default: true)</td>
<td>Boolean</td>
<td>TCP server dualstack (IPv4 and IPv6) support switch.</td>
<td></td>
</tr>
<tr>
<td>max-connections</td>
<td>&radic; (Default: null)</td>
<td>Number (Integer, Nullable)</td>
<td>TCP server maximum connection count.</td>
<td>&ge;1 if connection count is limited.<br/><i>null</i> if not limited.</td>
</tr>
<tr>
<td>parallel</td>
<td>&radic; (Default: 1024)</td>
<td>Number (Integer)</td>
<td>Maximum incomplete Modbus transaction count.</td>
<td>&ge;1</td>
</tr>
<tr>
<td>timeout.idle</td>
<td>&radic; (Default: 30000)</td>
<td>Number (Integer)</td>
<td>TCP connection idle timeout (in milliseconds).</td>
<td>&ge;1</td>
</tr>
</tbody>
</table>

<u>Note about the "parallel" configuration (for slave)</u>:
 - A completed Modbus transaction is either:
    - The request (query) that needs no response (answer) and the request frame was handled by the protocol-layer.
    - The request (query) that needs response (answer), the request frame was handled by the protocol-layer and the response frame was transmitted to the master successfully.
 - The TCP server would stop (pause) receiving frames if the incomplete Modbus transaction count reaches the threshold.

