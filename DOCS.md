# Api docs
pckp's JSON api docs.

## GET `/api/package/<package>`
Gets package info.

### Params
- package: Package name.

### Response
- name: Package name.  
***type***: `string`

- desc: Description.  
***type***: `string`

- long_desc: Long description.  
***type***: `string`

- homepage: Homepage of the package.  
***type***: `string`

- versions: Versions avalible.  
***type***: `array`

### Example
`/api/package/test`

## GET `/api/package/<package>/download`
Downloads the package in a .tar file.

### Params
- package: Package name.

### Response
Responds with a .tar file of the package.

### Example
`/api/package/test/download`

## POST `/api/publish`
Publishes a new package.

### Fields in body
##### \* required
- name*: Package name.  
***type***: `string`

- desc*: Description.  
***type***: `string`

- long_desc: Long description.  
***type***: `string`

- version*: Version number.  
***type***: `string`  
**example**: `1.0.0`

- homepage: Homepage of package.  
***type***: `string`

- token*: Token of account.  
***type***: `string`

- data: Tar file encoded using base64.   
***type***: `string`

### Response
- message: Response message.  
***type***: `string`

### Example
`/api/publish`

## POST `/api/users/register`
Registers a new user.

### Fields in body
##### \* required
- user*: Username of account.  
***type***: `string`

- pass*: Password of account.  
***type***: `string`

### Response
- message: Response message.  
***type***: `string`

- token: JWT token.  
***type***: `string`

### Example
`/api/users/register`

## POST `/api/users/login`
Responds with a JWT token.

### Fields in body
##### \* required
- user*: Username of account.  
***type***: `string`

- pass*: Password of account.  
***type***: `string`

### Response
- message: Response message.  
***type***: `string`
- token: JWT token.  
***type***: `string`

### Example
`/api/users/login`
