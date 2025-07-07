# alembaapi

NODE.JS Application - Based on URL parameters will perform verious calls to the Alemba API

**Set the codeType**

| Parameter Name  | Purpose |
| ------------- |------------- |
| call | Logs a ticket   |
| stock | Creates an order/inventory transaction or allocation  |

**Set the title for the HTML H1 on the page**

| Parameter Name  | Type | Purpose |
| ------------- | ------------- |------------- |
| Title  | String | Optional title to dynamically update the page heading.|

For transactions the tile will display the appropriate inventory image type.

Images should be around 250px high and in .png format with transparent backgrounds.

| keyword  | Image | Description |
| ------------- | ------------- |------------- |
| keyboard | img/keyboard.png |Standard Keyboard |
| smartcard  | img/smartcardkeyboard.png | Smartcard Keyboard |
| mouse | img/mouse.png |Standard Mouse |
| barcode | img/bardcodescanner.png | Zebra Barcode Scanner |
| rover | img/rover.png | Epic Rover |
| powermic | img/powermic.png | Powermic |
| monitor | img/monitor.png | Standard Monitor |
| docking | img/dockingstation.png | Docking Station |

**URL Parameters Available for call**

| Parameter Name  | Type | Purpose |
| ------------- | ------------- |------------- |
| receivingGroup | Integer  |Specifies the group that will receive the ticket. |
| customString1  | String | A custom string field used in the ticket payload.|
| configurationItemId  | Integer | Identifies the configuration item related to the ticket.|
| description  | String | Adds the call description to both the Description and DescriptionHTML.|
| type  | Integer | Adds the call category.|
| impact | Integer | Adds the call impact.|
| urgency  | Integer | Adds the call urgency.|

**URL Parameters Available for inventory transaction**

| Parameter Name  | Type | Purpose |
| ------------- | ------------- |------------- |
| purchase | Integer  | Order record for the transaction. |
| transactionStatus | Integer | Provides the status of the transaction for the inventory item. On Hand, In Use etc etc||
