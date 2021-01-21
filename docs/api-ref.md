## Application Programming Interface (API) Reference

### (Module) Conventions

#### (Constant) MAX_PDU_DATA_LENGTH

Maximum length of the data field of the PDU.

> The value of this constant is always 252 as specified in the specification.

#### (Constant) MAX_PDU_LENGTH

Maximum PDU length.

> MAX_PDU_LENGTH = MAX_PDU_DATA_LENGTH + 1

### (Module) Counters

Following counters are supported:

<table>
<thead>
<th>Counter Number (ID)</th><th>Counter Sub-function Code</th><th>Counter Name</th>
</thead>
<tbody>
<tr><td><i>CNTRNO_BUSMESSAGE</i></td><td><i>CNTRSUBFN_BUSMESSAGE</i></td><td>Bus Message Count.</td></tr>
<tr><td><i>CNTRNO_BUSCOMERROR</i></td><td><i>CNTRSUBFN_BUSCOMERROR</i></td><td>Bus Communication Error Count.</td></tr>
<tr><td><i>CNTRNO_SLVEXCERROR</i></td><td><i>CNTRSUBFN_SLVEXCERROR</i></td><td>Slave Exception Error Count.</td></tr>
<tr><td><i>CNTRNO_SLVMESSAGE</i></td><td><i>CNTRSUBFN_SLVMESSAGE</i></td><td>Slave Message Count.</td></tr>
<tr><td><i>CNTRNO_SLVNORESP</i></td><td><i>CNTRSUBFN_SLVNORESP</i></td><td>Slave No Response Count.</td></tr>
<tr><td><i>CNTRNO_SLVNAK</i></td><td><i>CNTRSUBFN_SLVNAK</i></td><td>Slave NAK Count.</td></tr>
<tr><td><i>CNTRNO_SLVBUSY</i></td><td><i>CNTRSUBFN_SLVBUSY</i></td><td>Slave Busy Count.</td></tr>
<tr><td><i>CNTRNO_BUSCHROVR</i></td><td><i>CNTRSUBFN_BUSCHROVR</i></td><td>Bus Character Overrun Count.</td></tr>
</tbody>
</table>

### (Module) Model

#### (Class) IMBDataModel

Interface of all Modbus data model classes.

##### (Method) IMBDataModel.prototype.transactionLock([cancellator])

Acquire the transaction lock.

<u>Note(s)</u>:
 - (To implementer) This method would be invoked before any transaction started. If the data model needs no lock mechanism that guarantees only one transaction can have access to the data model at anytime, just keep this method empty.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.transactionUnlock()

Release the transaction lock.

<u>Note(s)</u>:
 - (To implementer) This method would be invoked after when current transaction completed. If the data model needs no lock mechanism, just keep this method empty.

##### (Method) IMBDataModel.prototype.select(unitId)

Select an unit (slave) identifier.

<u>Note(s)</u>:
 - (To implementer) If you are implementing a generic Modbus master, just check the unit identifier passed in. If your the unit identifier mismatches, throw a MBInvalidNodeError exception.
 - (To implementer) If you are implementing a Modbus master with multiple unit identifiers, check whether the unit identifier is acceptable. Save the unit identifier and use it in other methods of this class if the unit identifier is acceptable. Otherwise, throw a MBInvalidNodeError exception.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidNodeError</i></td><td>The unit identifier is not accepted.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>unitId</i></td><td><i>Number</i></td><td>The unit identifier.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.prefetchDiscreteInput(address, count[, cancellator])

Prefetch discrete input(s).

<u>Note(s)</u>:
 - (To implementer) This method is used to prefetch information of consequent discrete inputs. In general, if all needed information (including the validity and value of each discrete input) can be read/get synchronously, you can simply leave this empty.
   If some needed information can't be read/get synchronously, you have to prefetch these information to this data model.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The starting address of the discrete input(s) to be prefetched.</td></tr>
<tr><td><i>count</i></td><td><i>Number</i></td><td>The quantity of the discrete input(s) to be prefetched.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.isValidDiscreteInput(address)

Check whether the address of a discrete input is valid.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The input address.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if valid.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.readDiscreteInput(address)

Read the value of specified discrete input.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidNodeError</i></td><td>No unit was selected yet.</td></tr>
<tr><td><i>MBInvalidDataAddressError</i></td><td>The input address is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The input address.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>The discrete input value.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.prefetchCoil(address, count[, cancellator])

Prefetch coil(s).

<u>Note(s)</u>:
 - (To implementer) This method is used to prefetch information of consequent coils. In general, if all needed information (including the validity and value of each coil) can be read/get synchronously, you can simply leave this empty. If some needed information can't be read/get synchronously, you have to prefetch these information to this data model.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The starting address of the coil(s) to be prefetched.</td></tr>
<tr><td><i>count</i></td><td><i>Number</i></td><td>The quantity of the coil(s) to be prefetched.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.isValidCoil(address)

Check whether the address of a coil is valid.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The coil address.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if valid.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.readCoil(address)

Read the value of specified coil.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidNodeError</i></td><td>No unit was selected yet.</td></tr>
<tr><td><i>MBInvalidDataAddressError</i></td><td>The coil address is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The coil address.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>The coil value.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.writeCoil(address, value)

Write the value of specified coil.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidNodeError</i></td><td>No unit was selected yet.</td></tr>
<tr><td><i>MBInvalidDataAddressError</i></td><td>The coil address is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The coil address.</td></tr>
<tr><td><i>value</i></td><td><i>Boolean</i></td><td>The coil value.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.prefetchInputRegister(address, count[, cancellator])

Prefetch input register(s).

<u>Note(s)</u>:
 - (To implementer) This method is used to prefetch information of consequent input registers. In general, if all needed information (including the validity and value of each input register) can be read/get synchronously, you can simply leave this empty.
   If some needed information can't be read/get synchronously, you have to prefetch these information to this data model.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The starting address of the input register(s) to be prefetched.</td></tr>
<tr><td><i>count</i></td><td><i>Number</i></td><td>The quantity of the input register(s) to be prefetched.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.isValidInputRegister(address)

Check whether the address of an input register is valid.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The register address.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if valid.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.readInputRegister(address)

Read the value of specified input register.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidNodeError</i></td><td>No unit was selected yet.</td></tr>
<tr><td><i>MBInvalidDataAddressError</i></td><td>The register address is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The register address.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The register value.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.prefetchHoldingRegister(address, count[, cancellator])

Prefetch holding register(s).

<u>Note(s)</u>:
 - (To implementer) This method is used to prefetch information of consequent holding registers. In general, if all needed information (including the validity and value of each holding register) can be read/get synchronously, you can simply leave this empty.
   If some needed information can't be read/get synchronously, you have to prefetch these information to this data model.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The starting address of the holding register(s) to be prefetched.</td></tr>
<tr><td><i>count</i></td><td><i>Number</i></td><td>The quantity of the holding register(s) to be prefetched.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.isValidHoldingRegister(address)

Check whether the address of a holding register is valid.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The register address.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if valid.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.readHoldingRegister(address)

Read the value of specified holding register.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidNodeError</i></td><td>No unit was selected yet.</td></tr>
<tr><td><i>MBInvalidDataAddressError</i></td><td>The register address is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The register address.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The register value.</td></tr>
</tbody>
</table>

##### (Method) IMBDataModel.prototype.writeHoldingRegister(address, value)

Write the value of specified holding register.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidNodeError</i></td><td>No unit was selected yet.</td></tr>
<tr><td><i>MBInvalidDataAddressError</i></td><td>The register address is invalid.</td></tr>
<tr><td><i>MBInvalidDataValueError</i></td><td>The register value is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>address</i></td><td><i>Number</i></td><td>The register address.</td></tr>
<tr><td><i>value</i></td><td><i>Number</i></td><td>The register value.</td></tr>
</tbody>
</table>

### (Module) ApplicationLayer.Master

#### (Class) IMBMasterServiceInitiator

Interface of all Modbus master service initiator classes.

##### (Method) IMBMasterServiceInitiator.prototype.initiateTransportLayer([cancellator])

Initiate transport-layer.

<u>Note(s) to the implementer</u>:
 - Once this function returned, the transport object would be totally managed by the master service. It is highly <b><u>NOT</u></b> recommended for your upper application to do any operation on the transport object directly.
 - To close the transport, call MBMasterService.prototype.close() instead of closing the transport directly.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
<tr><td><i>MBInitiateError</i></td><td>Failed to initiate transport-layer.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;IMBMasterTransport&gt;</i></td><td>The promise object (resolves with the transport if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

#### (Class) MBMasterServiceOption

Modbus master service options.

##### (Constructor) new MBMasterServiceOption()

New object.

#### (Class) MBMasterService

Modbus master service.

##### (Constructor) new MBMasterService(layerTransport[, options])

New object.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>layerTransport</i></td><td><i>IMBMasterTransport</i></td><td>The transport layer.</td></tr>
</tbody>
</table>

##### (Method) MBMasterService.prototype.query(unitID, cmd[, timeout = null[, cancellator]])

Query one peer (slave).

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>Either the unit identifier or the timeout is invalid.</td></tr>
<tr><td><i>MBTimeoutError</i></td><td>Timeout exceeds.</td></tr>
<tr><td><i>MBParseError</i></td><td>Failed to parse the answer from the peer (slave).</td></tr>
<tr><td><i>MBPeerError</i></td><td>Peer (slave) threw an exception.</td></tr>
<tr><td><i>MBCommunicationError</i></td><td>Communication failed.</td></tr>
<tr><td><i>MBInvalidOperationError</i></td><td>The service was already closed or is going to be closed.</td></tr>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>unitID</i></td><td><i>Number</i></td><td>The unit identifier of the slave.</td></tr>
<tr><td><i>cmd</i></td><td><i>MBMasterProtocolCommand</i></td><td>The command.</td></tr>
<tr><td><i>timeout</i></td><td><i>?Number</i></td><td>The timeout (NULL if not limited).</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;*&gt;</i></td><td>The promise object (resolves with the answer if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) MBMasterService.prototype.wait([cancellator])

Wait for the service to be closed.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) MBMasterService.prototype.isClosed()

Get whether the service was already closed.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if so.</td></tr>
</tbody>
</table>

##### (Method) MBMasterService.prototype.close([forcibly = false])

Close the service.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The service was already closed.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>forcibly</i></td><td><i>Boolean</i></td><td>True if the service should be closed forcibly.</td></tr>
</tbody>
</table>

##### (Static Method) MBMasterService.Create(initiator[, cancellator])

Create a new master service.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
<tr><td><i>MBInitiateError</i></td><td>Failed to initiate transport-layer.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>initiator</i></td><td><i>IMBMasterServiceInitiator</i></td><td>The service initiator.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;MBMasterService&gt;</i></td><td>The promise object (resolves with the master service if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

### ApplicationLayer.Slave

#### (Class) IMBSlaveServiceInitiator

Interface of all Modbus slave service initiator classes.

##### (Method) IMBSlaveServiceInitiator.prototype.initiateTransportLayer([cancellator])

Initiate transport-layer.

<u>Note(s) to the implementer</u>:
 - Once this function returned, the transport object would be totally managed by the slave service. It is highly <b>NOT</b> recommended for your upper application to do any operation on the transport object directly.
 - To close the transport, call <i>MBSlaveService.prototype.close()</i> instead of closing the transport directly.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
<tr><td><i>MBInitiateError</i></td><td>Failed to initiate transport-layer.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;IMBSlaveTransport&gt;</i></td><td>The promise object (resolves with the transport if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveServiceInitiator.prototype.initiateProtocolLayer([cancellator])

Initiate protocol-layer.

<u>Note(s) to the implementer</u>:
 - The protocol-layer returned by this method can be modified on-fly. It means that your application can change the protocol-layer even the slave service is still running.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
<tr><td><i>MBInitiateError</i></td><td>Failed to initiate protocol-layer.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;MBSlaveProtocolLayer&gt;</i></td><td>The promise object (resolves with the protocol-layer if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveServiceInitiator.prototype.initiateDataModel([cancellator])

Initiate data model.

<u>Note(s) to the implementer</u>:
 - The data model returned by this method is NOT managed by the slave service and can be modified on-fly.
   It means that your application can change the data model even the slave service is still running. It also means that it is your upper application's responsibility to dispose resources used by the data model.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
<tr><td><i>MBInitiateError</i></td><td>Failed to initiate protocol-layer.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;IMBDataModel&gt;</i></td><td>The promise object (resolves with the data model if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

#### (Class) MBSlaveServiceOption

Modbus slave service options.

##### (Constructor) new MBSlaveServiceOption()

New object.

##### (Method) MBSlaveServiceOption.prototype.setWorkerCount(wkn)

Set the worker count.

<u>Note(s)</u>:
 - The worker count must be a positive integer.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>Invalid worker count.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>wkn</i></td><td><i>Number</i></td><td>The new worker count.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveServiceOption.prototype.getWorkerCount()

Get the worker count.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The worker count.</td></tr>
</tbody>
</table>

#### (Class) MBSlaveService

Modbus slave service.

##### (Method) MBSlaveService.prototype.resetSlaveMessageCount()

Reset the Slave Message Count counter.

##### (Method) MBSlaveService.prototype.getSlaveMessageCount()

Get the value of the Slave Message Count counter.

<u>Note(s)</u>:
 - The Slave Message Count counter saves the quantity of messages addressed to the slave (including broadcast messages).

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>BigInt</i></td><td>The value.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.resetSlaveNoResponseCount()

Reset the Slave No Response Count counter.

##### (Method) MBSlaveService.prototype.getSlaveNoResponseCount()

Get the value of the Slave No Response Count counter.

<u>Note(s)</u>:
 - The Slave No Response Count counter saves the quantity of messages addressed to the slave (including broadcast messages) and the slave returned no response (neither a normal response nor an exception response).

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>BigInt</i></td><td>The value.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.resetSlaveExceptionErrorCount()

Reset the Slave Exception Error Count counter.

##### (Method) MBSlaveService.prototype.getSlaveExceptionErrorCount()

Get the value of the Slave Exception Error Count counter.

<u>Note(s)</u>:
 - The Slave Exception Error Count counter saves the quantity of exception error detected by the slave (including error detected in broadcast messages even if an exception message is not returned in this case).

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>BigInt</i></td><td>The value.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.resetCounterValue(cntrid)

Reset the value of specified counter.

<u>Note(s)</u>:
 - No action if the counter is not available.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cntrid</i></td><td><i>Number</i></td><td>The counter ID.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.getCounterValue(cntrid)

Get the value of specified counter.

<u>Note(s)</u>:
 - 0n would be returned if the counter is not available.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cntrid</i></td><td><i>Number</i></td><td>The counter ID.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>BigInt</i></td><td>The counter value.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.getAvailableCounters()

Get available counters.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Set&lt;Number&gt;</i></td><td>The set that contains the ID of all available counters.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.resetAllCounters()

Reset the value of all available counters.

##### (Method) MBSlaveService.prototype.getListenOnlySwitch()

Get the value of the listen-only mode switch.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if the listen-only mode switch is on.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.setListenOnlySwitch(en)

Set the value of the listen-only mode switch.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>en</i></td><td><i>Boolean</i></td><td>True if the listen-only mode switch should be turned on.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.wait([cancellator])

Wait for the service to be closed.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.isClosed()

Get whether the service was already closed.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if so.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveService.prototype.close([forcibly = false])

Close the service.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The service was already closed.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>forcibly</i></td><td><i>Boolean</i></td><td>True if the service should be closed forcibly.</td></tr>
</tbody>
</table>

##### (Static Method) MBSlaveService.Create(initiator[, cancellator])

Create a new slave service.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
<tr><td><i>MBInitiateError</i></td><td>Failed to initiate transport-layer, protocol-layer or data model.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>initiator</i></td><td><i>IMBSlaveServiceInitiator</i></td><td>The service initiator.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;MBSlaveService&gt;</i></td><td>The promise object (resolves with the slave service if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

### (Module) ProtocolLayer.Core

#### (Class) MBPDU

Modbus protocol data unit (PDU).

##### (Constructor) new MBPDU(functionCode, data)

New object.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td rowspan="2"><i>MBParameterError</i></td><td>Function code is invalid.</td></tr>
<tr><td>Data is too long (&gt; <i>MAX_PDU_DATA_LENGTH</i>).</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>functionCode</i></td><td><i>Number</i></td><td>The function code.</td></tr>
<tr><td><i>data</i></td><td><i>Buffer</i></td><td>The data.</td></tr>
</tbody>
</table>

##### (Method) MBPDU.prototype.getFunctionCode()

Get the function code.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The function code.</td></tr>
</tbody>
</table>

##### (Method) MBPDU.prototype.getData()

Get the data.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Buffer</i></td><td>The data.</td></tr>
</tbody>
</table>

##### (Static Method) MBPDU.NewException(functionCode, exceptionCode)

Create a new exception PDU.

<u>Note(s)</u>:
 - The function code must be an integer within 0x00 and 0xFF. A <i>MBParameterError</i> would be thrown if the function code is invalid.
 - The exception code must be an integer within 0x00 and 0xFF. A <i>MBParameterError</i> would be thrown if the exception code is invalid.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>Either the function code or the exception code is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>functionCode</i></td><td><i>Number</i></td><td>The function code.</td></tr>
<tr><td><i>exceptionCode</i></td><td><i>Number</i></td><td>The exception code.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBPDU</i></td><td>The PDU.</td></tr>
</tbody>
</table>

### (Module) ProtocolLayer.Master

#### (Class) MBMasterProtocolCommand

Modbus master protocol-layer command.

##### (Constructor) new MBMasterProtocolCommand(queryPDU, ansParser)

New object.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>queryPDU</i></td><td><i>MBPDU</i></td><td>The request (query) protocol data unit (PDU).</td></tr>
<tr><td><i>ansParser</i></td><td><i>?IMBMasterProtocolParser</i></td><td>The response (answer) parser (NULL if no response is needed).</td></tr>
</tbody>
</table>

##### (Method) MBMasterProtocolCommand.prototype.getQueryPDU()

Get the request (query) protocol data unit (PDU).

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBPDU</i></td><td>The PDU.</td></tr>
</tbody>
</table>

##### (Method) MBMasterProtocolCommand.prototype.getAnswerParser()

Get the response (answer) parser.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>?IMBMasterProtocolParser</i></td><td>The parser (NULL if no response is needed).</td></tr>
</tbody>
</table>

#### (Class) IMBMasterProtocolParser

Interface of all Modbus master protocol-layer parser.

##### (Method) IMBMasterProtocolParser.prototype.parse(pdu)

Parse a answer (response) protocol data unit (PDU).

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParseError</i></td><td>Failed to parse.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>pdu</i></td><td><i>MBPDU</i></td><td>The answer (response) protocol data unit (PDU).</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBMasterProtocolParserOut</i></td><td>The parser output.</td></tr>
</tbody>
</table>

#### (Class) MBMasterProtocolParserOut

Modbus master protocol-layer parser output.

##### (Constructor) new MBMasterProtocolParserOut(isExceptionThrown, exceptionCode, data)

New object.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>isExceptionThrown</i></td><td><i>Boolean</i></td><td>True if exception was thrown.</td></tr>
<tr><td><i>exceptionCode</i></td><td><i>?Number</i></td><td>The exception code (NULL if no exception was thrown).</td></tr>
<tr><td><i>data</i></td><td><i>*</i></td><td>The data.</td></tr>
</tbody>
</table>

##### (Method) MBMasterProtocolParserOut.prototype.hasException()

Get whether an exception was thrown.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if so.</td></tr>
</tbody>
</table>

##### (Method) MBMasterProtocolParserOut.prototype.getExceptionCode()

Get the exception code.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The exception code (one of <i>MBEX_*</i>, NULL if no exception was thrown).</td></tr>
</tbody>
</table>

##### (Method) MBMasterProtocolParserOut.prototype.getData()

Get the data.

<u>Note(s)</u>:
 - The type of returned data is function-specific.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>*</i></td><td>The data.</td></tr>
</tbody>
</table>

### (Module) ProtocolLayer.Master.BuiltIns

#### (Function) NewReadCoilsCommand(coilStartAddr, coilValues)

<u>Note(s)</u>:
 - The starting address of the coils must be an integer within 0x0000 ~ 0xFFFF.
 - The count of coils to be written must be within 0x001 and 0x07B0.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>Either the starting address or value array of the coils is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>coilStartAddr</i></td><td><i>Number</i></td><td>The starting address of the coils.</td></tr>
<tr><td><i>coilValues</i></td><td><i>Boolean[]</i></td><td>The value of the coils.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBMasterProtocolCommand</i></td><td>The command.</td></tr>
</tbody>
</table>

#### (Function) NewReadDiscreteInputsCommand(dciStartAddr, dciQuantity)

Create a new read discrete inputs (0x02) command.

<u>Note(s)</u>:
 - The start address of the discrete inputs must be an integer within 0x0000 ~ 0xFFFF.
 - The quantity of discrete inputs must be an integer within 0x000 (0) ~ 0x7D0 (2000).

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>Either the start address or the quantity of discrete inputs is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>dciStartAddr</i></td><td><i>Number</i></td><td>The start address of the discrete inputs.</td></tr>
<tr><td><i>dciQuantity</i></td><td><i>Number</i></td><td>The quantity of the discrete inputs.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBMasterProtocolCommand</i></td><td>The command.</td></tr>
</tbody>
</table>

#### (Function) NewReadHoldingRegistersCommand(hregStartAddr, hregQuantity)

Create a new read holding registers (0x03) command.

<u>Note(s)</u>:
 - The start address of the holding registers must be an integer within 0x0000 ~ 0xFFFF.
 - The quantity of holding registers must be an integer within 0x00 (0) ~ 0x7D (125).

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>Either the start address or the quantity of holding registers is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>hregStartAddr</i></td><td><i>Number</i></td><td>The start address of the holding registers.</td></tr>
<tr><td><i>hregQuantity</i></td><td><i>Number</i></td><td>The quantity of the holding registers.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBMasterProtocolCommand</i></td><td>The command.</td></tr>
</tbody>
</table>

#### (Function) NewReadInputRegistersCommand(iregStartAddr, iregQuantity)

Create a new read input registers (0x04) command.

<u>Note(s)</u>:
 - The start address of the input registers must be an integer within 0x0000 ~ 0xFFFF.
 - The quantity of input registers must be an integer within 0x00 (0) ~ 0x7D (125).

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>Either the start address or the quantity of input registers is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>iregStartAddr</i></td><td><i>Number</i></td><td>The start address of the input registers.</td></tr>
<tr><td><i>iregQuantity</i></td><td><i>Number</i></td><td>The quantity of the input registers.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBMasterProtocolCommand</i></td><td>The command.</td></tr>
</tbody>
</table>

#### (Function) NewWriteSingleCoilCommand(outputAddr, outputValue)

Create a new write single coil (0x05) command.

<u>Note(s)</u>:
 - The output address of the coil must be an integer within 0x0000 ~ 0xFFFF.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>The address of the coil is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>outputAddr</i></td><td><i>Number</i></td><td>The address of the coil.</td></tr>
<tr><td><i>outputValue</i></td><td><i>Boolean</i></td><td>The value of the coil.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBMasterProtocolCommand</i></td><td>The command.</td></tr>
</tbody>
</table>

#### (Function) NewWriteSingleRegisterCommand(hregAddr, hregValue)

Create a new write single register (0x06) command.

<u>Note(s)</u>:
 - The address of the register must be an integer within 0x0000 ~ 0xFFFF.
 - The value of the register must be an integer within 0x0000 ~ 0xFFFF.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>The address of the register is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>hregAddr</i></td><td><i>Number</i></td><td>The address of the register.</td></tr>
<tr><td><i>hregValue</i></td><td><i>Number</i></td><td>The value of the register.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBMasterProtocolCommand</i></td><td>The command.</td></tr>
</tbody>
</table>

#### (Function) NewWriteMultipleCoilsCommand(coilStartAddr, coilValues)

Create a new write multiple coils (0x0F) command.

<u>Note(s)</u>:
 - The starting address of the coils must be an integer within 0x0000 ~ 0xFFFF.
 - The count of coils to be written must be within 0x001 and 0x07B0.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>Either the starting address or value array of the coils is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>coilStartAddr</i></td><td><i>Number</i></td><td>The starting address of the coils.</td></tr>
<tr><td><i>coilValues</i></td><td><i>Boolean[]</i></td><td>The value of the coils.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBMasterProtocolCommand</i></td><td>The command.</td></tr>
</tbody>
</table>

#### (Function) NewWriteMultipleRegistersCommand(hregStartAddr, hregValues)

Create a new write multiple registers (0x10) command.

<u>Note(s)</u>:
 - The starting address of the registers must be an integer within 0x0000 ~ 0xFFFF.
 - The count of registers to be written must be within 0x01 ~ 0x7B.
 - The value of each register to be written must be an integer within 0x0000 ~ 0xFFFF.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>Either the starting address or value array of the registers is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>hregStartAddr</i></td><td><i>Number</i></td><td>The starting address of the registers.</td></tr>
<tr><td><i>hregValues</i></td><td><i>Number[]</i></td><td>The value of the registers.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBMasterProtocolCommand</i></td><td>The command.</td></tr>
</tbody>
</table>

### (Module) ProtocolLayer.Slave

#### (Class) MBSlaveProtocolLayer

Modbus slave protocol-layer.

##### (Constructor) new MBSlaveProtocolLayer()

New object.

##### (Method) MBSlaveProtocolLayer.prototype.getServiceHost()

Get the service host.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBSlaveProtocolServiceHost</i></td><td>The service host.</td></tr>
</tbody>
</table>

#### (Class) IMBSlaveProtocolService

Interface of all Modbus slave protocol-layer service classes.

##### (Method) IMBSlaveProtocolService.prototype.getAssignedFunctionCode()

Get the assigned function code.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The function code.</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveProtocolService.prototype.isAvailableInListenOnlyMode()

Get whether the service is available in listen-only mode.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if so.</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveProtocolService.prototype.handle(model, pdu[, cancellator])

Handle request (query).

<u>Note(s)</u>:
 - The function code in the request (query) protocol data unit (PDU) is assumed to be the same as the assigned function code of this service. No redundant check would be performed when handles the request (query).

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBFunctionProhibitedError</i></td><td>Function prohibited in broadcast message.</td></tr>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>model</i></td><td><i>IMBDataModel</i></td><td>The data model.</td></tr>
<tr><td><i>pdu</i></td><td><i>MBPDU</i></td><td>The request (query) protocol data unit (PDU).</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;?MBPDU&gt;</i></td><td>The promise object (resolves with the response (answer) protocol data unit (PDU) if succeed and response is needed, resolves with NULL if succeed and no response is needed, rejects if error occurred).</td></tr>
</tbody>
</table>

#### (Class) MBSlaveProtocolServiceHost

Modbus slave protocol-layer service host.

##### (Constructor) new MBSlaveProtocolServiceHost()

New object.

##### (Method) MBSlaveProtocolServiceHost.prototype.register(service)

Register a service.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBProtocolServiceExistedError</i></td><td>The service was already existed.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>service</i></td><td><i>IMBSlaveProtocolService</i></td><td>The service.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveProtocolServiceHost.prototype.unregister(service)

Unregister a service.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBProtocolServiceNotExistError</i></td><td>The service doesn't exist.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>service</i></td><td><i>IMBSlaveProtocolService</i></td><td>The service.</td></tr>
</tbody>
</table>

##### (Method) MBSlaveProtocolServiceHost.prototype.handle(model, pdu[, listenOnly = false[, cancellator]])

Handle request (query).

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBFunctionProhibitedError</i></td><td>Function prohibited in broadcast message.</td></tr>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>model</i></td><td><i>IMBDataModel</i></td><td>The data model.</td></tr>
<tr><td><i>pdu</i></td><td><i>MBPDU</i></td><td>The request (query) protocol data unit (PDU).</td></tr>
<tr><td><i>listenOnly</i></td><td><i>Boolean</i></td><td>True if the query is currently being handled in listen-only mode.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;?MBPDU&gt;</i></td><td>The promise object (resolves with the response (answer) protocol data unit (PDU) if succeed and response is needed, resolves with NULL if succeed and no response is needed, rejects if error occurred).</td></tr>
</tbody>
</table>

### (Module) ProtocolLayer.Slave.BuiltIns

#### (Class) MBSlaveProtocolReadCoilsService : IMBSlaveProtocolService

Modbus slave protocol-layer read coils (0x01) service.

##### (Static Member) MBSlaveProtocolReadCoilsService.FUNCTION_CODE

Assigned function code of the slave service.

##### (Static Member) MBSlaveProtocolReadCoilsService.INSTANCE

Slave service instance.

#### (Class) MBSlaveProtocolReadDiscreteInputService : IMBSlaveProtocolService

Modbus slave protocol-layer read discrete input (0x02) service.

##### (Static Member) MBSlaveProtocolReadDiscreteInputService.FUNCTION_CODE

Assigned function code of the slave service.

##### (Static Member) MBSlaveProtocolReadDiscreteInputService.INSTANCE

Slave service instance.

#### (Class) MBSlaveProtocolReadHoldingRegisterService : IMBSlaveProtocolService

Modbus slave protocol-layer read holding register (0x03) service.

##### (Static Member) MBSlaveProtocolReadHoldingRegisterService.FUNCTION_CODE

Assigned function code of the slave service.

##### (Static Member) MBSlaveProtocolReadHoldingRegisterService.INSTANCE

Slave service instance.

#### (Class) MBSlaveProtocolReadInputRegisterService : IMBSlaveProtocolService

Modbus slave protocol-layer read input register (0x04) service.

##### (Static Member) MBSlaveProtocolReadInputRegisterService.FUNCTION_CODE

Assigned function code of the slave service.

##### (Static Member) MBSlaveProtocolReadInputRegisterService.INSTANCE

Slave service instance.

#### (Class) MBSlaveProtocolWriteSingleCoilService : IMBSlaveProtocolService

Modbus slave protocol-layer write single coil (0x05) service.

##### (Static Member) MBSlaveProtocolWriteSingleCoilService.FUNCTION_CODE

Assigned function code of the slave service.

##### (Static Member) MBSlaveProtocolWriteSingleCoilService.INSTANCE

Slave service instance.

#### (Class) MBSlaveProtocolWriteSingleRegisterService : IMBSlaveProtocolService

Modbus slave protocol-layer write single register (0x06) service.

##### (Static Member) MBSlaveProtocolWriteSingleRegisterService.FUNCTION_CODE

Assigned function code of the slave service.

##### (Static Member) MBSlaveProtocolWriteSingleRegisterService.INSTANCE

Slave service instance.

#### (Class) MBSlaveProtocolWriteMultipleCoilsService : IMBSlaveProtocolService

Modbus slave protocol-layer write multiple coils (0x0F) service.

##### (Static Member) MBSlaveProtocolWriteMultipleCoilsService.FUNCTION_CODE

Assigned function code of the slave service.

##### (Static Member) MBSlaveProtocolWriteMultipleCoilsService.INSTANCE

Slave service instance.

#### (Class) MBSlaveProtocolWriteMultipleRegistersService : IMBSlaveProtocolService

Modbus slave protocol-layer write multiple registers (0x10) service.

##### (Static Member) MBSlaveProtocolWriteMultipleRegistersService.FUNCTION_CODE

Assigned function code of the slave service.

##### (Static Member) MBSlaveProtocolWriteMultipleRegistersService.INSTANCE

Slave service instance.

### (Module) ProtocolLayer.Exceptions

This module provides following Modbus exception code constants:

<table>
<thead>
<th>Code (Hex)</th><th>Constant Name</th><th>Description</th>
</thead>
<tbody>
<tr><td>01</td><td>MBEX_ILLEGAL_FUNCTION</td><td>Illegal function.</td></tr>
<tr><td>02</td><td>MBEX_ILLEGAL_DATA_ADDRESS</td><td>Illegal data address.</td></tr>
<tr><td>03</td><td>MBEX_ILLEGAL_DATA_VALUE</td><td>Illegal data value.</td></tr>
<tr><td>04</td><td>MBEX_SERVER_DEVICE_FAILURE</td><td>Server device failure.</td></tr>
<tr><td>05</td><td>MBEX_ACKNOWLEDGE</td><td>Acknowledge.</td></tr>
<tr><td>06</td><td>MBEX_SERVER_DEVICE_BUSY</td><td>Server device busy.</td></tr>
<tr><td>08</td><td>MBEX_MEMORY_PARITY_ERROR</td><td>Memory parity error.</td></tr>
<tr><td>0A</td><td>MBEX_GW_PATH_UNAVAILABLE</td><td>Gateway path unavailable.</td></tr>
<tr><td>0B</td><td>MBEX_GW_TARGET_FAILED</td><td>Gateway target device failed to respond.</td></tr>
</tbody>
</table>

### (Module) TransportLayer.Core

#### (Class) IMBMasterTransport

Interface of all Modbus master transports.

##### (Method) IMBMasterTransport.prototype.query(query[, noAnswer = false[, cancellator]])

Query the slave.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
<tr><td><i>MBInvalidOperationError</i></td><td>Transport was already closed or is going to be closed.</td></tr>
<tr><td><i>MBCommunicationError</i></td><td>Transport-layer communication failed.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>query</i></td><td><i>MBTransportQuery</i></td><td>The query object.</td></tr>
<tr><td><i>noAnswer</i></td><td><i>Boolean</i></td><td>True if response from the slave is not needed.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;?MBTransportAnswer&gt;</i></td><td>The promise object (resolves with the answer if succeed and answer from the slave is needed, resolves with NULL if succeed and answer from the slave is not needed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBMasterTransport.prototype.wait([cancellator])

Wait for the transport to be closed.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBMasterTransport.prototype.isClosed()

Get whether the transport was closed.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if so.</td></tr>
</tbody>
</table>

##### (Method) IMBMasterTransport.prototype.close([forcibly = false])

Close the transport.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>Transport was already closed.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>forcibly</i></td><td><i>Boolean</i></td><td>True if the transport shall be closed forcibly.</td></tr>
</tbody>
</table>

#### (Class) IMBMasterTransportFactory

Interface of all Modbus transport factory classes.

##### (Method) IMBMasterTransportFactory.prototype.getName()

Get the name of the transport.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>String</i></td><td>The name.</td></tr>
</tbody>
</table>

##### (Method) IMBMasterTransportFactory.prototype.create(configdict[, cancellator])

Create a transport instance.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
<tr><td><i>MBConfigurationError</i></td><td>Bad transport configuration.</td></tr>
<tr><td><i>MBCommunicationError</i></td><td>Communication error.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>configdict</i></td><td><i>Object</i></td><td>The transport configuration dictionary.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;IMBMasterTransport&gt;</i></td><td>The promise object (resolves with the transport object if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

#### (Class) IMBSlaveTransaction

Interface of Modbus slave transaction classes.

##### (Method) IMBSlaveTransaction.prototype.getQuery()

Get the the query.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBTransportQuery</i></td><td>The query.</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransaction.prototype.getState()

Get current transaction state.

<u>Note(s)</u>:
 - The slave have following states:
   - <i>IMBSlaveTransaction.STATE_INCOMPLETE</i>: The transaction is still waiting.
   - <i>IMBSlaveTransaction.STATE_CANCELLED</i>: The transaction was cancelled by the transport-layer.
   - <i>IMBSlaveTransaction.STATE_COMPLETE</i>: The transaction was completed.
   - <i>IMBSlaveTransaction.STATE_COMPLETE_WITH_ERROR</i>: The transaction was completed but an error occurred while completing the transaction.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The transaction state (one of <i>IMBSlaveTransaction.STATE_*</i>).</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransaction.prototype.wait([cancellator])

Wait for the transaction to complete or be cancelled.

<u>Note(s)</u>:
 - This method waits for the transaction to fall in one of following states:
   - <i>IMBSlaveTransaction.STATE_COMPLETE</i>
   - <i>IMBSlaveTransaction.STATE_COMPLETE_WITH_ERROR</i>
   - <i>IMBSlaveTransaction.STATE_CANCELLED</i>

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;Number&gt;</i></td><td>The promise object (resolves with the state if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransaction.prototype.answer(ans)

Answer the transaction.

<u>Note(s)</u>:
 - Assumes that class <i>X</i> is an implementation of this interface, any call to this method would take no effect if either <i>X.prototype.answer()</i> or <i>X.prototype.ignore()</i> was called before.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>ans</i></td><td><i>MBTransportAnswer</i></td><td>The answer.</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransaction.prototype.ignore()

Ignore the transaction.

<u>Note(s)</u>:
 - Assumes that class <i>X</i> is an implementation of this interface, any call to this method would take no effect if either <i>X.prototype.answer()</i> or <i>X.prototype.ignore()</i> was called before.

##### (Static Member) IMBSlaveTransaction.STATE_INCOMPLETE

The transaction is still waiting.

##### (Static Member) IMBSlaveTransaction.STATE_CANCELLED

The transaction was cancelled by the transport-layer.

##### (Static Member) IMBSlaveTransaction.STATE_COMPLETE

The transaction was completed.

##### (Static Member) IMBSlaveTransaction.STATE_COMPLETE_WITH_ERROR

The transaction was completed but an error occurred while completing the transaction.

#### (Class) IMBSlaveTransport

Interface of all Modbus slave transport classes.

##### (Method) IMBSlaveTransport.prototype.resetCounterValue(cntrid)

Reset the value of specified counter.

<u>Note(s)</u>:
 - No action if the counter is not available.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cntrid</i></td><td><i>Number</i></td><td>The counter ID.</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransport.prototype.getCounterValue(cntrid)

Get the value of specified counter.

<u>Note(s)</u>:
 - 0n would be returned if the counter is not available.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cntrid</i></td><td><i>Number</i></td><td>The counter ID.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>BigInt</i></td><td>The counter value.</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransport.prototype.getAvailableCounters()

Get available counters.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Set&lt;Number&gt;</i></td><td>The set that contains the ID of all available counters.</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransport.prototype.poll([cancellator])

Poll for a transaction.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>Transport was already closed or is going to be closed.</td></tr>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;IMBSlaveTransaction&gt;</i></td><td>The promise object (resolves with a transaction if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransport.prototype.wait([cancellator])

Wait for the transport to be closed.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransport.prototype.isClosed()

Get whether the transport was already closed.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if so.</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransport.prototype.close([forcibly = false])

Close the transport.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>Transport was already closed.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>forcibly</i></td><td><i>Boolean</i></td><td>True if the transport should be closed forcibly.</td></tr>
</tbody>
</table>

#### (Class) IMBSlaveTransportFactory

Interface of all Modbus slave transport factory classes.

##### (Method) IMBSlaveTransportFactory.prototype.getName()

Get the name of the transport.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>String</i></td><td>The name.</td></tr>
</tbody>
</table>

##### (Method) IMBSlaveTransportFactory.prototype.create(configdict[, cancellator])

Create a transport instance.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
<tr><td><i>MBConfigurationError</i></td><td>Bad transport configuration.</td></tr>
<tr><td><i>MBCommunicationError</i></td><td>Communication error.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>configdict</i></td><td><i>Object</i></td><td>The transport configuration dictionary.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;IMBSlaveTransport&gt;</i></td><td>The promise object (resolves with the transport object if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

#### (Class) MBTransportAnswer

Modbus transport-layer response (answer).

##### (Constructor) new MBTransportAnswer(functionCode, data)

New object.

<u>Note(s)</u>:
 - The function code must be an integer between 0x00 and 0xFF. A <i>MBParameterError</i> would be thrown if the function code is invalid.
 - The <i>Modbus Application Protocol specification</i> specifies that the maximum PDU length is <i>MAX_PDU_LENGTH</i>, so the maximum data length of the PDU is <i>MAX_PDU_LENGTH</i> - 1 (the function code field) = <i>MAX_PDU_DATA_LENGTH</i>. A <i>MBParameterError</i> would be thrown if the data is longer than <i>MAX_PDU_DATA_LENGTH</i>.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td rowspan="2"><i>MBParameterError</i></td><td>Function code is invalid.</td></tr>
<tr><td>Data is too long (&gt; <i>MAX_PDU_DATA_LENGTH</i>).</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>functionCode</i></td><td><i>Number</i></td><td>The response (answer) function code.</td></tr>
<tr><td><i>data</i></td><td><i>Buffer</i></td><td>The response (answer) data.</td></tr>
</tbody>
</table>

##### (Method) MBTransportAnswer.prototype.getFunctionCode()

Get the function code.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The function code.</td></tr>
</tbody>
</table>

##### (Method) MBTransportAnswer.prototype.getData()

Get the data.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Buffer</i></td><td>The data.</td></tr>
</tbody>
</table>

#### (Class) MBTransportQuery

Modbus transport-layer request (query).

##### (Constructor) new MBTransportQuery(unitID, functionCode, data)

New object.

<u>Note(s)</u>:
 - The unit identifier must be an integer between 0x00 and 0xFF. A <i>MBParameterError</i> would be thrown if the unit identifier is invalid.
 - The function code must be an integer between 0x00 and 0xFF. A <i>MBParameterError</i> would be thrown if the function code is invalid.
 - The <i>Modbus Application Protocol specification</i> specifies that the maximum PDU length is <i>MAX_PDU_LENGTH</i>, so the maximum data length of the PDU is <i>MAX_PDU_LENGTH</i> - 1 (the function code field) = <i>MAX_PDU_DATA_LENGTH</i>. A <i>MBParameterError</i> would be thrown if the data is longer than <i>MAX_PDU_DATA_LENGTH</i>.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td rowspan="3"><i>MBParameterError</i></td><td>Unit identifier is invalid.</td></tr>
<tr><td>Function code is invalid.</td></tr>
<tr><td>Data is too long (&gt; <i>MAX_PDU_DATA_LENGTH</i>).</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>unitID</i></td><td><i>Number</i></td><td>The request (query) unit identifier.</td></tr>
<tr><td><i>functionCode</i></td><td><i>Number</i></td><td>The request (query) function code.</td></tr>
<tr><td><i>data</i></td><td><i>Buffer</i></td><td>The request (query) data.</td></tr>
</tbody>
</table>

##### (Method) MBTransportQuery.prototype.getUnitID()

Get the unit identifier.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The unit identifier.</td></tr>
</tbody>
</table>

##### (Method) MBTransportQuery.prototype.getFunctionCode()

Get the function code.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The function code.</td></tr>
</tbody>
</table>

##### (Method) MBTransportQuery.prototype.getData()

Get the data.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Buffer</i></td><td>The data.</td></tr>
</tbody>
</table>

### (Module) TransportLayer.TCP

#### (Class) MBTCPMasterTransport : IMBMasterTransport

Modbus TCP master transport.


#### (Class) MBTCPMasterTransportFactory : IMBMasterTransportFactory

Modbus TCP master transport factory.

##### (Constructor) new MBTCPMasterTransportFactory()

New object.

#### (Class) MBTCPSlaveTransport : IMBSlaveTransport

Modbus TCP slave transport.

##### (Method) MBTCPSlaveTransport.prototype.getBindAddress()

Get the server bind address.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>String</i></td><td>The bind address.</td></tr>
</tbody>
</table>

##### (Method) MBTCPSlaveTransport.prototype.getBindPort()

Get the server bind port.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The bind port.</td></tr>
</tbody>
</table>

#### (Class) MBTCPSlaveTransportFactory : MBTCPSlaveTransportFactory

Modbus TCP slave transport factory.

##### (Constructor) new MBTCPSlaveTransportFactory()

New object.

### (Module) TransportLayer.Serial.RTU

#### (Class) MBRtuMasterTransport : IMBMasterTransport

Modbus RTU master transport.

#### (Class) MBRtuMasterTransportFactory : IMBMasterTransportFactory

Modbus RTU master transport factory.

##### (Constructor) new MBRtuMasterTransportFactory()

New object.

#### (Class) MBRtuSlaveTransport : IMBSlaveTransport

Modbus RTU slave transport.

#### (Class) MBRtuSlaveTransportFactory : IMBSlaveTransportFactory

Modbus RTU slave transport factory.

##### (Constructor) new MBRtuSlaveTransportFactory()

New object.

### (Module) TransportLayer.Serial.ASCII

#### (Class) MBAsciiMasterTransport : IMBMasterTransport

Modbus ASCII master transport.

#### (Class) MBAsciiMasterTransportFactory : IMBMasterTransportFactory

Modbus ASCII master transport factory.

##### (Constructor) new MBAsciiMasterTransportFactory()

New object.

#### (Class) MBAsciiSlaveTransport : IMBSlaveTransport

Modbus ASCII slave transport.

#### (Class) MBAsciiSlaveTransportFactory : IMBSlaveTransportFactory

Modbus ASCII slave transport factory.

##### (Constructor) new MBAsciiSlaveTransportFactory()

New object.

### (Module) TransportLayer.Serial.Driver

#### (Constant) MBSL_DATABIT_*

Following constants that represent the count of data bits are provided:

<table>
<thead>
<th>Constant Name</th><th>Description</th>
</thead>
<tbody>
<tr><td><i>MBSL_DATABIT_7</i></td><td>7 data bits (generally for Modbus/ASCII).</td></tr>
<tr><td><i>MBSL_DATABIT_8</i></td><td>8 data bits (generally for Modbus/RTU).</td></tr>
</tbody>
</table>

#### (Constant) MBSL_PARITY_*

Following constants that represent the parity bit type are provided:

<table>
<thead>
<th>Constant Name</th><th>Description</th>
</thead>
<tbody>
<tr><td><i>MBSL_PARITY_NONE</i></td><td>No parity.</td></tr>
<tr><td><i>MBSL_PARITY_ODD</i></td><td>Odd parity.</td></tr>
<tr><td><i>MBSL_PARITY_EVEN</i></td><td>Even parity.</td></tr>
</tbody>
</table>

#### (Constant) MBSL_STOPBIT_*

Following constants that represent the count of stop bits are provided:

<table>
<thead>
<th>Constant Name</th><th>Description</th>
</thead>
<tbody>
<tr><td><i>MBSL_STOPBIT_1</i></td><td>1 stop bits.</td></tr>
<tr><td><i>MBSL_STOPBIT_2</i></td><td>2 stop bits.</td></tr>
</tbody>
</table>

#### (Class) IMBSerialPort

Interface of all Modbus serial port classes.

##### (Method) IMBSerialPort.prototype.getPortOptions()

Get the serial port options.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBSerialPortOption</i></td><td>The serial port options.</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.timerRestart()

Restart the timer.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.timerSetTickCallback(cb)

Set the timer tick callback.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cb</i></td><td><i>() => void</i></td><td>The tick callback.</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.timerGetTickCallback()

Get the timer tick callback.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>() => void</i></td><td>The tick callback.</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.timerSetInterval(ns)

Set the timer tick interval.

<u>Note(s)</u>:
 - The tick interval must be an integer.
 - Negative tick interval is not allowed.
 - Zero tick interval would cause the timer to be disabled.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>The tick interval is invalid.</td></tr>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>ns</i></td><td><i>Number</i></td><td>The tick interval (unit: nanoseconds).</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.timerGetInterval()

Get the timer tick interval.

<u>Note(s)</u>:
 - Zero tick interval means the timer was disabled.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The tick interval (unit: nanoseconds).</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.rxResetBufferOverrun()

Reset the RX internal buffer overrun flag.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.rxIsBufferOverrun()

Get whether the RX internal buffer overrun flag was set.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if so.</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.rxIsCharacterValid()

Get whether RX current character is valid.

<u>Note(s)</u>:
 - A character is valid means its parity bit and UART frame structure are both correct.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if so.</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.rxGetCharacter()

Get RX current character.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The character.</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.rxNext([cancellator])

Move one character from RX internal buffer to RX current character.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
<tr><td><i>MBDeviceError</i></td><td>Device failure.</td></tr>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves with if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.txTransmit(data[, cancellator])

TX transmit data.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
<tr><td><i>MBDeviceError</i></td><td>Device failure.</td></tr>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>data</i></td><td><i>Buffer</i></td><td>The data.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Promise&lt;void&gt;</i></td><td>The promise object (resolves with if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPort.prototype.dispose()

Dispose the serial port.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBInvalidOperationError</i></td><td>The serial port was already disposed.</td></tr>
</tbody>
</table>

#### (Class) IMBSerialPortDriver

Interface of all Modbus serial port driver classes.

##### (Method) IMBSerialPortDriver.prototype.getDriverName()

Get the driver name.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>String</i></td><td>The driver name.</td></tr>
</tbody>
</table>

##### (Method) IMBSerialPortDriver.prototype.open(dev, options[, cancellator])

Open a serial port.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBDeviceError</i></td><td>Device failure.</td></tr>
<tr><td><i>MBOperationCancelledError</i></td><td>The cancellator was activated.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>dev</i></td><td><i>String</i></td><td>The serial port device path.</td></tr>
<tr><td><i>options</i></td><td><i>MBSerialPortOption</i></td><td>The serial port options.</td></tr>
<tr><td><i>cancellator</i></td><td><i>ConditionalSynchronizer</i></td><td>The cancellator.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>IMBSerialPort</i></td><td>The promise object (resolves with the serial port instance if succeed, rejects if error occurred).</td></tr>
</tbody>
</table>

#### (Class) MBSerialPortOption

Modbus serial port options.

##### (Constructor) MBSerialPortOption()

New object.

<u>Note(s)</u>:
 - The baudrate must be a positive integer.
 - The count of data bits must be one of <i>MBSL_DATABIT_*</i>.
 - The count of stop bits must be one of <i>MBSL_STOPBIT_*</i>.
 - The parity type must be one of <i>MBSL_PARITY_*</i>.

<u>Exception(s)</u>:

<table>
<thead>
<th>Exception Class</th><th>Exception Description</th>
</thead>
<tbody>
<tr><td><i>MBParameterError</i></td><td>The baudrate, the count of data bits, the count of stop bits or the parity type is invalid.</td></tr>
</tbody>
</table>

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>baudrate</i></td><td><i>Number</i></td><td>The baudrate (unit: bit/s).</td></tr>
<tr><td><i>nDataBits</i></td><td><i>Number</i></td><td>The count of data bits (each character) (one of <i>MBSL_DATABIT_*</i>).</td></tr>
<tr><td><i>nStopBits</i></td><td><i>Number</i></td><td>The count of stop bits (each character) (one of <i>MBSL_STOPBIT_*</i>).</td></tr>
<tr><td><i>parity</i></td><td><i>Number</i></td><td>The parity type (one of <i>MBSL_PARITY_*</i>).</td></tr>
</tbody>
</table>

##### (Method) MBSerialPortOption.prototype.getBaudrate()

Get the baudrate.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The baudrate (unit: bit/s).</td></tr>
</tbody>
</table>

##### (Method) MBSerialPortOption.prototype.getDataBits()

Get the count of data bits (each character).

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The count (one of <i>MBSL_DATABIT_*</i>).</td></tr>
</tbody>
</table>

##### (Method) MBSerialPortOption.prototype.getStopBits()

Get the count of stop bits (each character).

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The count (one of <i>MBSL_STOPBIT_*</i>).</td></tr>
</tbody>
</table>

##### (Method) MBSerialPortOption.prototype.getParityType()

Get the parity type.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Number</i></td><td>The parity type (one of <i>MBSL_PARITY_*</i>).</td></tr>
</tbody>
</table>

##### (Method) MBSerialPortOption.prototype.fork()

Get a copy of this option.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBSerialPortOption</i></td><td>The copied serial port option.</td></tr>
</tbody>
</table>

#### (Class) MBSerialPortDriverRegistry

Modbus serial port driver registry.

##### (Constructor) new MBSerialPortDriverRegistry()

New object

##### (Method) MBSerialPortDriverRegistry.prototype.register(driver)

Register a driver.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>driver</i></td><td><i>IMBSerialPortDriver</i></td><td>The driver.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if succeed.</td></tr>
</tbody>
</table>

##### (Method) MBSerialPortDriverRegistry.prototype.unregister(driver)

Unregister a driver.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>driver</i></td><td><i>IMBSerialPortDriver</i></td><td>The driver.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>Boolean</i></td><td>True if succeed.</td></tr>
</tbody>
</table>

##### (Method) MBSerialPortDriverRegistry.prototype.getDriver(name)

Get driver.

<u>Parameter(s)</u>:

<table>
<thead>
<th>Parameter Name</th><th>Parameter Type</th><th>Parameter Description</th>
</thead>
<tbody>
<tr><td><i>name</i></td><td><i>String</i></td><td>The driver name.</td></tr>
</tbody>
</table>

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>?IMBSerialPortDriver</i></td><td>The driver (NULL if not exists).</td></tr>
</tbody>
</table>

##### (Static Method) MBSerialPortDriverRegistry.GetGlobal()

Get global driver registry.

<u>Return value</u>:

<table>
<thead>
<th>Return Type</th><th>Return Description</th>
</thead>
<tbody>
<tr><td><i>MBSerialPortDriverRegistry</i></td><td>The driver registry.</td></tr>
</tbody>
</table>

### (Module) TransportLayer.Serial.Driver.Generic

#### (Class) MBGenericSerialPort : IMBSerialPort
 
Modbus generic serial port.

#### (Class) MBGenericSerialPortDriver : IMBSerialPortDriver

Modbus generic serial port driver.

##### (Constructor) new MBGenericSerialPortDriver()

New object.

##### (Static Member) MBGenericSerialPortDriver.DRIVER_NAME

Driver name.

##### (Static Member) MBGenericSerialPortDriver.INSTANCE

Global driver instance.

### (Module) Errors

Available error classes:

<table>
<thead>
<th>Class Name</th><th>Parent Class</th><th>Description</th>
</thead>
<tbody>
<tr><td><i>MBError</i></td><td><i>Error</i></td><td>Modbus error.</td></tr>
<tr><td><i>MBBugError</i></td><td><i>MBError</i></td><td>Modbus bug error.</td></tr>
<tr><td><i>MBTypeError</i></td><td><i>MBError</i></td><td>Modbus type error.</td></tr>
<tr><td><i>MBParameterError</i></td><td><i>MBError</i></td><td>Modbus parameter error.</td></tr>
<tr><td><i>MBInvalidOperationError</i></td><td><i>MBError</i></td><td>Modbus invalid operation error.</td></tr>
<tr><td><i>MBOperationCancelledError</i></td><td><i>MBError</i></td><td>Modbus operation cancelled error.</td></tr>
<tr><td><i>MBConfigurationError</i></td><td><i>MBError</i></td><td>Modbus configuration error.</td></tr>
<tr><td><i>MBParseError</i></td><td><i>MBError</i></td><td>Modbus parse error.</td></tr>
<tr><td><i>MBCommunicationError</i></td><td><i>MBError</i></td><td>Modbus communication error.</td></tr>
<tr><td><i>MBCommunicationEndOfStreamError</i></td><td><i>MBCommunicationError</i></td><td>Modbus communication end-of-stream error.</td></tr>
<tr><td><i>MBInvalidFrameError</i></td><td><i>MBError</i></td><td>Modbus invalid frame error.</td></tr>
<tr><td><i>MBInvalidNodeError</i></td><td><i>MBError</i></td><td>Modbus invalid node error.</td></tr>
<tr><td><i>MBInvalidDataAddressError</i></td><td><i>MBError</i></td><td>Modbus invalid data address error.</td></tr>
<tr><td><i>MBInvalidDataValueError</i></td><td><i>MBError</i></td><td>Modbus invalid data value error.</td></tr>
<tr><td><i>MBProtocolServiceExistedError</i></td><td><i>MBError</i></td><td>Modbus protocol service existed error.</td></tr>
<tr><td><i>MBProtocolServiceNotExistError</i></td><td><i>MBError</i></td><td>Modbus protocol service not exist error.</td></tr>
<tr><td><i>MBTransportExistedError</i></td><td><i>MBError</i></td><td>Modbus transport existed error.</td></tr>
<tr><td><i>MBTransportNotExistError</i></td><td><i>MBError</i></td><td>Modbus transport not exist error.</td></tr>
<tr><td><i>MBInitiateError</i></td><td><i>MBError</i></td><td>Modbus initiate error.</td></tr>
<tr><td><i>MBPeerError</i></td><td><i>MBError</i></td><td>Modbus peer error.</td></tr>
<tr><td><i>MBTimeoutError</i></td><td><i>MBError</i></td><td>Modbus timeout error.</td></tr>
<tr><td><i>MBDeviceError</i></td><td><i>MBError</i></td><td>Modbus device error.</td></tr>
<tr><td><i>MBFunctionProhibitedError</i></td><td><i>MBError</i></td><td>Modbus function prohibited (in broadcast message) error.</td></tr>
</tbody>
</table>

