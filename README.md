# LightPAY - Node.js Web API

This is a client API that allow you to interact with LightPAY Web API server in order to receive payment with the digital meal voucher through your web site  **without redirect your customer out of your shop**.
> API functions: 
> - receive payments
> - get payment information
> - refund totally or partially
> - payment cancellation (total refund)

### Before start
In order to get access to your back office you should have a merchant account.
Once you access your back office, you will get `Ceredentials` for both test and production modes.

Please contact us by email : [info@lightpay.lu](mailto:info@lightpay.lu) or visit our website [www.lightpay.lu](www.lightpay.lu)

### About this API
Since LightPAY is smartphone application, the payment will be executed directly in the customer device, the way to implement this API is a bit unique!
- You don't have to handle the payment errors, instead a notification with error description will pop-up at the customer's application.
- You don't need to store the payment token (except for statistic reasons or if you have special reason to do so)
- The payment is not executed in the merchant shop (e.g. visa card), instead it is done in the customer's application.
- You will be notified for all success payment via the `success_url` (see [Back office](#Back office)); and we will not bother you with errors messages :-)

### How work this Client project
- Download the project
- Set your credentials at `src/index.ts`
- this will launch a NodeJs server at port 8000. You can change the port in `src/index.ts`.
- start the NodeJs server with the command below:

```shell script
npm run server
```

Then go to `localhost:8000/api/payments/init` if your credentials is correct, you should see a (complex) Qr-Code appear on the screen ;-)

Use the helpers methods located at `src/Request.ts`:
- getToken (payment init)
- refundPayment
- cancelPayment
- getPaymentStatus
- getPaymentDetails

### Payment procedure
Let's say the customer has placed an order at your shop, and clicked `Pay with LightPAY` button.

1. the merchant shop will create a page to initiate the payment `/v1/web/api/payments/init` [see sample here](public/index.php)
2. a payment token will be received within the response
3. then the merchant shop should:

    a) generate a QR-Code with the payment token : this will be used in case your customer placed the order using a PC, so he can scan the QR-Code within LightPAY application.
    
    b) create a button just below the QR-Code to allow customers to copy/paste the token into the application (in case using a smartphone).

> please see [sample project here](public/index.php), you have full example designed for PC and it is also mobile friendly
    
4. the payment is executed once your customer scan or copy/paste the token on LightPAY application.
5. our server will notify the customer about the payment status (success/error) and will send you the response only in case of success through the `success_url` which you defined in your [Back office](#Back office).

    


### Local testing
If you need to test the API on your locale machine, you can use a service such as `ngrok.com` to redirect the responses from our server to your local machine.
You also need to specify the forwarding url prompted by `ngrok` in your back office.

### Notation
The following table describe the different formats that you encounter when implementing your API.

| Notation | Description                                |
|----------|--------------------------------------------|
| A        | Alphabetic characters (from ‘A’ to ‘Z’ and from ‘a’ to ‘z’) |
| N        | Numeric characters |
| S        | Special characters ('-', '_', '.', '$') |
| AN       | Alphanumeric characters |
| ANS      | Alphanumeric and special characters, use this regex to test  : `/^([\p{L}0-9\-_\.,\&#\$\*=@\/%:;\?\+\s]+-?)+$/` |
| MAP      | List of key/value pairs ​​separated by a “;”. <br><br>Each key/value pair contains the name of the key followed by “=”, followed by a value.<br>The value can be a string only.<br>The list of possible values ​​​​for each key/value pair is provided in the field definition.<br><br>Example: foo=bar;bar=cool |



### Initiate a payment

> note that default `mode` is set to `test`, so please change it to `prod` (in the constructor) when you finish testing

##### ENDPOINTS
| Method    | Path                                                                      |
|:---------:|---------------------------------------------------------------------------|
| POST      | /v1/web/api/payments/init                                                 |

##### REQUEST PARAMETERS
| PARAMETERS     | Mandatory   | Type | Length | Description                                          |
|----------------|:-----------:|:----:|:------:|------------------------------------------------------|
| amount         | YES         | N    | 1-5    |the amount should be a cent formatted ex: 100 = 1€.  |
| ref            | YES         | ANS  | 4-255  |your order reference                        |
| merchant_id    | YES         | AN   | 30-255 |use `consumer_key`                         |
| custom_fields  | NO          | MAP  | 0-1024 |a key=value pair ";" separated, each key/value will be sent with `success_url` as individual `POST` PARAMETERS |

> Be aware, if you intend to set a url or you have a special character such as (éàè...) in a `custom_field` you should encode your string using `UTF-8` (use Utf8_encode() in php)

##### RESPONSE
| PARAMETERS | type    |
|------------|:-------:|
| token      | string  |


```ts
import Request from "./Request";

const request = new Request({
    consumer_key: "",
    api_key: "",
    secret_key: "",
    mode: "test" // prod
});

let amount = 1000; // 10,00€

// this will return a json token
const res = request.post("/v1/web/api/payments/init", {
    'amount': amount,
    'ref': "your order reference (should be unique)",
    "merchant_id": request.consumer_key,
    "custom_fields": "foo=bar;barfoo=foot"
});

// use this token to generate QR-Code
res.token;
```

### Payment response
A payment response can be sent **only** as server-server communication, you should set the `success_url` in your back office. [see Back office](#Back office).

##### ENDPOINTS
| Method    | Path                                                                      |
|:---------:|---------------------------------------------------------------------------|
| POST      | the `succes_url` that you have previously defined in the back office      |

##### RESPONSE
The response is an object consist of:

| Name                      | Type      | Description                                    |
|---------------------------|-----------|------------------------------------------------|
| status                    | string    | a string status `success` |
| code                      | int       | `200` for success `301` otherwise |
| amount                    | int       | the transaction amount |
| currency                  | string    | `EUR` |
| object                    | string    | the object of the request `payment` |
| trx_id                    | string    | **you should store this in your database, as may need it to get the payment information, refund or cancel...**|
| ref                       | string    | your order reference `ref` that you've defined in the payment init |
| Your `custom_fields`      | mixed     | each field will be sent as a POST PARAMETERS |
| date                      | timestamp | a timestamp represent the transaction date |


### Refund a payment
Refund a payment partially or totally.

> Warning
> Only transactions with status `REGISTERED` `PARTIALLY_REFUNDED` `AWAITING_PARTIAL_REFUND` can be refund! <br>

> All other transactions  **CANNOT BE REFUND**

##### ENDPOINTS
| Method    | Path                                                                      |
|:---------:|---------------------------------------------------------------------------|
| POST      | /v1/web/api/payments/refunds                                                 |

##### REQUEST PARAMETERS
| PARAMETERS         | Mandatory   | Type | Length | Description                                          |
|----------------|:-----------:|:----:|:------:|------------------------------------------------------|
| amount         | YES         | N    | 1-5    |the amount should be a cent formatted ex: 100 = 1€.  |
| trx_id         | YES         | ANS  | 4-255  |the `ORIGINAL` transaction Id that you received with the payment response |

##### RESPONSE
| Name                      | Type      | Description                                    |
|---------------------------|-----------|------------------------------------------------|
| status                    | string    | a string status `success` or `error` |
| code                      | int       | `200` for success `301` otherwise |
| amount                    | int       | the transaction amount |
| currency                  | string    | `EUR` |
| object                    | string    | the object of the request `refund` |
| trx_id                    | string    | **be aware you can not use this transaction id for future refund/cancel, use always the original trx_id for those purposes**|
| date                      | timestamp | a timestamp represent the transaction date |


```ts
// Original payment amount it's 10€

// A partial refund
const res = request.post("/v1/web/api/payments/refunds", {
        "trx_id": "trx-5e15c21d4691f-1578484250", 
        "refund_amount": "500"
});
console.log($res);
```

```ts
// A total refund
const res = request.post("/v1/web/api/payments/refunds", {
        "trx_id": "trx-5e15c21d4691f-1578484250", 
        "refund_amount": "1000"
});
console.log(res);
```

### Cancel a payment
You can cancel a payment by providing a `trx_id`.

> Warning
> Only transactions with status `REGISTERED` or `AWAITING_PARTIAL_REFUND` or `PARTIALLY_REFUNDED` can be cancelled <br>


> Other transactions **CANNOT BE CANCELLED**


##### ENDPOINTS
| Method    | Path                                                                      |
|-----------|---------------------------------------------------------------------------|
| POST      | /v1/web/api/payments/cancels                                              |

##### REQUEST PARAMETERS
| PARAMETERS         | Mandatory   | Type | Length | Description                                          |
|----------------|:-----------:|:----:|:------:|------------------------------------------------------|
| trx_id         | YES         | ANS  | 4-255  |the `ORIGINAL` transaction Id that you receive with the payment response |

##### RESPONSE
| Name                      | Type      | Description                                    |
|---------------------------|-----------|------------------------------------------------|
| status                    | string    | a string status `success` or `error` |
| code                      | int       | `200` for success `301` otherwise |
| amount                    | int       | the transaction amount |
| currency                  | string    | `EUR` |
| object                    | string    | the object of the request `refund` |
| trx_id                    | string    | **be aware you can not use this transaction id for future refund/cancel, use always the original trx_id for those purposes**|
| date                      | timestamp | a timestamp represent the transaction date |


```ts
const res = request.post("/v1/web/api/payments/cancels", {
        "trx_id": "trx-5e15c21d4691f-1578484253"
});
console.log(res);
```

### Get payment status
##### ENDPOINTS
| Method    | Path                                                                      |
|-----------|---------------------------------------------------------------------------|
| GET       | /v1/web/api/payments/status                                              |

##### REQUEST PARAMETERS
| PARAMETERS         | Mandatory   | Type | Length | Description                                          |
|----------------|:-----------:|:----:|:------:|------------------------------------------------------|
| trx_id         | YES         | ANS  | 4-255  |the `ORIGINAL` transaction Id that you receive with the payment response |

##### RESPONSE
| Name                      | Type      | Description                                    |
|---------------------------|-----------|------------------------------------------------|
| payment_status            | string    | a string status `REGISTERED` `AWAITING_PARTIAL_REFUND` `PARTIALLY_REFUNDED` `AWAITING_TO_CAPTURED` `CAPTURED` `AWAITING_TOTAL_REFUND` `TOTALLY_REFUNDED` `PARTIALLY_REFUNDED` `CANCELLED` |


```ts
const res = request.post("/v1/web/api/payments/status", {
        "trx_id": "trx-5e15c21d4691f-1578484253"
});
console.log(res);
```


### Get payment information
##### ENDPOINTS
| Method    | Path                                                                      |
|-----------|---------------------------------------------------------------------------|
| GET       | /v1/web/api/payments/details                                              |

##### REQUEST PARAMETERS
| PARAMETERS         | Mandatory   | Type | Length | Description                                          |
|----------------|:-----------:|:----:|:------:|------------------------------------------------------|
| trx_id         | YES         | ANS  | 4-255  |the `ORIGINAL` transaction Id that you receive with the payment response |

##### RESPONSE
| Name                      | Type      | Description                                    |
|---------------------------|-----------|------------------------------------------------|
| status                    | string    | a string status `REGISTERED` `AWAITING_PARTIAL_REFUND` `PARTIALLY_REFUNDED` `AWAITING_TO_CAPTURED` `CAPTURED` `AWAITING_TOTAL_REFUND` `TOTALLY_REFUNDED` `PARTIALLY_REFUNDED` `CANCELLED` |
| amount                    | int       | the transaction amount |
| formatted_amount          | int       | a human readable amount `10,30 €`|
| transaction_id            | string    | transaction Id that you receive with the payment response |
| refunds                   | object    | the history of refund attempts, each one has the flowing parameters `trx_id` `amount` `date` |
| payment_mode              | string    | "Web API" |
| created_at                | timestamp | a timestamp represent the transaction date |


```ts
const res = request.post("/v1/web/api/payments/details", {
        "trx_id": "trx-5e15c21d4691f-1578484253"
});
```

```json
[{
    "amount": 1000,
    "formatted_amount": "10,00€",
    "transaction_id": "trx-5e15c21d4691f-1578484253",
    "status": "REGISTERED",
    "payment_mode": "Web API",
    "created_at": "2020-12-12 12:00:00",
    "refunds": [
        {
            "trx_id": "trx-4e14c41d469f4-1578484768",
            "amount": "200",
            "date": "2020-12-13 11:00:00",
        },
        {
            "trx_id": "trx-f514c4gd56965-1578480747",
            "amount": "300",
            "date": "2020-12-14 11:00:00",
        }
    ]
}]
```



### API
In this project we used a pre-configured PHP client which implement all what you need to make your payment process functional, and ready for you. 
But if you need to implement your own class using your own technology, so it is accepted by our server, you must follow the steps below (signature step is very important!).

> All data in the form must be UTF-8 encoded.

#### Getaways
| Production                      | Demo |
|---------------------------------|------------------------------------|
| https://web.lunch-digi-pay.lu   | https://webdemo.lunch-digi-pay.lu  |


#### Paths
| Path                            | Request method | Description                |
|---------------------------------|----------------|----------------------------|
| /v1/web/api/payments/init       | POST           | Initiate a payment         |
| /v1/web/api/payments/refunds    | POST           | Do a refund request        |
| /v1/web/api/payments/cancels    | POST           | Cancel a payment           |
| /v1/web/api/payments/status     | GET            | Get payment status         |
| /v1/web/api/payments/details    | GET            | Get payment details        |


#### Credentials

| PARAMETERS     | Mandatory   | Description                                          |
|----------------|:-----------:|------------------------------------------------------|
| api_key        | YES         | remember to use the correct one in accordance with `test` or `prod` mode |
| consumer_key   | YES         | remember to use the correct one in accordance with `test` or `prod` mode |
| secret_key     | YES         | remember to use the correct one in accordance with `test` or `prod` mode |

### Responses
All responses will be a `JSON` formatted object.

#### Payment response
The payment response will be sent by a server-server communication, you need to whitelist the IP address range `80.92.90.96/32`.
The only way to get the payment response is via the `success_url`.
Our server will notify the customer about the payment status (success/error) and will send you the response only in case of success through the `success_url` which you defined in your [Back office](#Back office).

 
> please note that responses will be sent as a `POST` request

#### Response body
The response parameters can change depend on the request, see the different examples below.

| Name           | Description                                          |
|----------------|------------------------------------------------------|
| status         | status string represented `success` or `error`  |
| code           | status code `success`:`200` `error`:`300`                      |
| token          | payment token |
| payment_status | payment status [see Status chapter](#Payment status) |
| trx_id         | you should store this one! this is the only way to get information about the transaction  |
| trx_date       | datetime format `YYYY-MM-DD HH:MM:SS`                        |
| shop_id        | your shop ID                       |
| ref            | your order reference                         |
| msg            | text message about the payment status      |
| custom_fields  | if set in the init request, a key=value pair ";" separated, each key/value will be sent with `success_url` as individual `POST` PARAMETERS |


### Payment status
There are 7 types of status :

| Status                    | Description                                          |
|---------------------------|------------------------------------------------------|
| REGISTERED                | the payment was successful and waiting for capturing  |
| CAPTURED                  | the payment has been captured by the bank   |
| AWAITING_TOTAL_REFUND     | waiting for total refund              |
| AWAITING_PARTIAL_REFUND   | waiting for partial refund               |
| TOTALLY_REFUNDED          | the payment has been totally refunded               |
| PARTIALLY_REFUNDED        | the payment has been partially refunded               |
| CANCELED                  | the payment has been canceled (total refund)                   |





### Building a Request
Each request must include the flowing parameters :

#### Body
The request body must be set with each request, if the request method is `GET` you must set the body as an empty string.

> the body or query parameters should `sorted` regardless of the request method (post, get, delete, put...)
> in php use `ksort` function with `SORT_NATURAL` flag


#### Headers
All the flowing headers are mandatory and if they are not set, the server will not accept your request.

#### Time
set the timestamp in the `X-LightPAY-Timestamp` header.

```bash
X-LightPAY-Timestamp: 1578484253
```

#### Data signing
> only `AES-128-CBC` algorithm should be used with `PKCS7` as padding mode (in PHP set to 0 because this is the default mode)

All request parameters must be stringfyed (for objects e.g. body) and concatenated with `+`, then signed. This process need to be done in a very precise order, please check the right order below:
> the result of this signature should be set in the `X-LightPAY-Signature` header

##### <u>Signing order:</u>
1. api_key
2. secret_key
3. consumer_key
4. method
5. url
6. body
7. now

- `key` should be the first 32 characters of the `secret_key`
- `iv` should be the first 32 characters of the `consumer_key`


```bash
// set the signature header
// here SIGN is a dummy function, use your own fuction or see the Signing chapter
X-LightPAY-Signature: SIGN(api_key+secret_key+consumer_key+method+url+body+now)
```

To test your hash, compare it to the PHP openssl_decrypt. 
Do a hash `hello wrold` with the language of your choice, and set you hash to `$yourHash` in the code below to test the result.
> please use the key and IV below for testing 
> If you do not have a PHP environment set, use an online tool such as [extendsclass.com](https://extendsclass.com/php.html) **do not use your test or production there!**

```PHP
$youHash = ""; // past you hash here
$testKey = "d9d359cce9371de02914c42d2786c0d9";
$testIV = "bb78c8065a90e05f1520b8ca17de1295";
$key = pack('H*', substr($testKey, 0, 32));
$iv = hex2bin(substr($testIV, 0, 32));
$decrypted = openssl_decrypt(
    $youHash,
    'AES-128-CBC',
    $key,
    OPENSSL_ZERO_PADDING,
    $iv
);
var_dump($decrypted);
```

#### Authorization
In the `Authorization` header use the `consumer_key` as login and `api_key` as password `base64` encoded

```bash
Authorization: Basic base64_encode(consumer_key:api_key)
```

#### Content-Type
only `application/x-www-form-urlencoded` will be accepted
```bash
Content-Type: application/x-www-form-urlencoded
```

#### X-LightPAY-Credentials
you must concatenate the `api_key` and `secret_key` with the `+`, then you should sign the result with `AES-128-CBC`
> please see the [Signing](#Signing) chapter

```bash
// here SIGN is a dummy function, use your own fuction or see the Signing chapter
X-LightPAY-Credentials: SIGN($this->api_key . "+" . $this->secret_key)
```

### Signing
Use `CryptoJS` for the Javascript world.

> only `AES-128-CBC` algorithm should be used with `PKCS7` as padding mode (in PHP set to 0 because this is the default mode)

> Note that depending on the technology you use, you may sometimes have to compact the hexadecimal key "H" (most significant bit first)

[see other language example](#Other signing example)

- `key` should be the first 32 characters of the `secret_key`
- `iv` should be the first 32 characters of the `consumer_key`


```ts
sign(data): string {

    if (!data) return "";

    try {
        let toSign;

        if (typeof data === "object")
            toSign = '$1$' + data.join("+");
        else
            toSign = '$1$' + data;

        const key = CryptoJS.enc.Hex.parse(this.client.secret_key.substr(0, 32));
        const iv = CryptoJS.enc.Hex.parse(this.client.consumer_key.substr(0, 32));
        const encrypted = CryptoJS.AES.encrypt(toSign, key, {
            iv
            //padding: CryptoJS.pad.ZeroPadding,
        });

        //console.log(encrypted.toString());
        return encrypted.toString();
    } catch (err) {
        console.log("[ERROR] : encryption error")
        console.log(err)
    }
}
```

### Other signing example
- [PHP](https://github.com/LightPAYLuxembourg/Web-PHP-Client#signing)
- [.NET](https://github.com/LightPAYLuxembourg/Web-.NET)

### Back office
Once you have your access to the back office, go to the WEB API page, you will find your credentials there.

#### IMPORTANT
In order to get the payment response you should set the `success_url` in the dedicated field.
> For local testing see [Local testing chapter](#Local testing)



