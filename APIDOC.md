# HuskySwap API Documentation

## Endpoint 1 - Getting all products
**Request Format:** /products/all

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns JSON data with a list of all the non purchased products on the website

**Example Request:** /products/all

**Example Response:**

```
[
  {
    "id": 3,
    "username": "joshua",
    "name": "Otter onesie",
    "price": 15,
    "image": "https://m.media-amazon.com/images/I/61qe2rTPpHL._AC_SY879_.jpg",
    "description": "very useful"
  },
  {
    "id": 2,
    "username": "joshua",
    "name": "UW Shirt",
    "price": 10,
    "image": "https://dks.scene7.com/is/image/GolfGalaxy/24CLMMNCWSHPRPPRMWAS?wid=2000&fmt=pjpeg",
    "description": "Only worn once, no stains, size large"
  },
  {
    "id": 1,
    "username": "joshua",
    "name": "Couch",
    "price": 100,
    "image": "https://media.istockphoto.com/id/173585159/photo/random-sofa.jpg?s=1024x1024&w=is&k=20&c=3rRg0KvtqLvYKlQl-qrwVPqe4w7UpoKnFUc4vkWG7dg=",
    "description": "Good as new"
  }
]
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`

## Endpoint 2 - Sign up
**Request Format:** /user/signup body parameters of username, email, password, and password-confirm

**Request Type:** POST

**Returned Data Format**: text

**Description:** Sets up an account for the user. Returns text based on whether or not the login was successful

**Example Request:** /user/signup body parameters of `username=joshua123`, `email=joshua@gmail.com`, `password=password123`, and `password-confirm=password123`

**Example Response:**

```
joshua123's account was succesfully created.
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`
- Possible 400 errors (all plain text):
  - If the submitted username is already in the database, returns error with `Username already in use`
  - If the submitted passwords don't match, returns error with `Passwords don't match`
  - If the request didn't contain a username, returns error with `Missing one or more of the required parameters.`
  - If the request didn't contain a password, returns error with `Missing one or more of the required parameters.`
  - If the request didn't contain a confirmation password, returns error with `Missing one or more of the required parameters.`
  - If the request didn't contain an email, returns error with `Missing one or more of the required parameters.`

## Endpoint 3 - Search for products
**Request Format:** /products/search/:search-query

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns JSON data with a list of the ids of all the products that include the search query in their name and/or description

**Example Request:** /products/search/uw

**Example Response:**

```
[
  {
    "id": 2
  }
]
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`

## Endpoint 4 - Get all purchases conducted by the user
**Request Format:** /user/purchases

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns JSON data with a list of all the products that the user has purchased. User must be logged in for this request.

**Example Request:** /user/purchases

**Example Response:**

```
[
  {
    "id": "PUR0",
    "name": "Otter onesie",
    "seller": "joshua",
    "price": 15,
    "image": "https://m.media-amazon.com/images/I/61qe2rTPpHL._AC_SY879_.jpg",
    "description": "very useful",
    "purchase_date": "2024-11-8"
  }
]
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`
- Possible 401 errors (all plain text):
  - If there is no authorization cookie associated with the request, returns error with `Not logged in.`


## Endpoint 5 - Login
**Request Format:** /user/login with body parameters username and password

**Request Type:** POST

**Returned Data Format**: Text

**Description:** Logs the user into their account and allows them to access otherwise restricted pages. Returns the unique token that corresponds to the user's login session.

**Example Request:** /user/login body parameters of `username=joshua` and `password=password123`

**Example Response:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Impvc2h1YSIsImlhdCI6MTczMzcwMTM2OCwiZXhwIjoxNzM0MzA2MTY4fQ.hdLGoC2WjeNat6zNkOmq-1jOekrfnfeBOFeN9ijwkvI
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`
- Possible 400 errors (all plain text):
  - If the request contained a username that isn't affiliated with any account, returns error with `No such user`
  - If the request contained a password that didn't match the password affiliated with the username, returns error with `Password doesn't match username`
  - If the request didn't contain a username, returns error with `Missing one or more of the required parameters.`
  - If the request didn't contain a password, returns error with `Missing one or more of the required parameters.`


## Endpoint 6 - Get Individual Product Information
**Request Format:** /products/product/:product_id

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Fetches detailed information on a specific product using its unique identifier.

**Example Request:** /products/product/1

**Example Response:**
```
{
  "id": 1,
  "username": "joshua",
  "name": "Couch",
  "price": 100,
  "image": "https://media.istockphoto.com/id/173585159/photo/random-sofa.jpg?s=1024x1024&w=is&k=20&c=3rRg0KvtqLvYKlQl-qrwVPqe4w7UpoKnFUc4vkWG7dg=",
  "description": "Good as new",
  "category": "Furniture",
  "purchased": 0
}
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`
- Possible 400 errors (all plain text):
  - If the product being request has already been sold, returns error with `Product has already been sold`
  - If no products have the id contained in the request, returns error with `Product does not exist`

## Endpoint 7 - Buy Product
**Request Format:** /products/buy with body parameters id and willingToPurchase

**Request Type:** POST

**Returned Data Format**: Text

**Description:** Purchases a specific product based on the id from the body parameter and whether the user is willing to pick up the product. User must be logged in for this request.

**Example Request:** /products/buy body parameters of `id=1` and `willingToPurchase=true`

**Example Response:**
```
PUR1
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`
- Possible 400 errors (all plain text):
  - If the request didn't contain a product id, returns error with `Missing one or more of the required parameters.`
  - If the willing to pick up body parameter isn't equal to "true" and/or is nonexistent, returns error with `Willing to pick up parameter must be true`
  - If no products have the id contained in the request, returns error with `This item doesn't exist`
  - If the item associate with the id contained in the request has already been purchased, returns error with `This item has already been purchased`
  - If the logged in user is also the user who's selling the product, returns error with `You cannot buy an item that you're selling`
- Possible 401 errors (all plain text):
  - If there is no authorization cookie associated with the request, returns error with `Not logged in.`

## Endpoint 8 - Logged in
**Request Format:** /user/logged-in

**Request Type:** GET

**Returned Data Format**: Text

**Description:** Checks if the user is logged in. If they are, then it returns their username, otherwise its response is "false"

**Example Request:** /user/logged-in

**Example Response:**
```
joshi
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`

## Endpoint 9 - Filters products
**Request Format:** /products/filter with query parameters of clothing, furniture, and schoolSupplies

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Gets a list of the ids of all non-purchased products that fit under any of the selected product types (clothing, furniture, and school supplies).

**Example Request:** /products/filter?clothing=Clothing&furniture=Furniture

**Example Response:**
```
[
  {
    "id": 2
  }
]
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`
- Possible 400 errors (all plain text):
  - If the request contains none of the three search queries, returns error with `Missing one or more of the required parameters.`

## Endpoint 10 - List a product for sale
**Request Format:** /products/add with body parameters of name, price, image, description, category

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Adds a product to the product database based on the information from the body parameters. User must be logged in for this request.

**Example Request:** /products/add with body parameters of `name=couch`, `price=500`, `image=https://dks.scene7.com/is/image/GolfGalaxy/24CLMMNCWSHPRPPRMWAS?wid=2000&fmt=pjpeg`, `description=new`, `category=Furniture`

**Example Response:**
```
[
  {
    "id": 4,
    "username": "joshua",
    "name": "couch",
    "price": 500,
    "image": "https://dks.scene7.com/is/image/GolfGalaxy/24CLMMNCWSHPRPPRMWAS?wid=2000&fmt=pjpeg",
    "description": "new",
    "category": "Furniture",
    "purchased": 0
  }
]
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`
- Possible 400 errors (all plain text):
  - If the request doesn't have the name body parameter, returns error with `Missing one or more of the required parameters.`
  - If the request doesn't have the name description parameter, returns error with `Missing one or more of the required parameters.`
  - If the request doesn't have the name image parameter, returns error with `Missing one or more of the required parameters.`
  - If the request doesn't have the name category parameter, returns error with `Missing one or more of the required parameters.`
  - If the request doesn't have the name price parameter, returns error with `Missing one or more of the required parameters.`
  - If the request's category body parameter isn't equal to "Furniture", "Clothing", or "School Supplies", returns error with `Category parameter doesn't match category options`
- Possible 401 errors (all plain text):
  - If there is no authorization cookie associated with the request, returns error with `Not logged in.`

## Endpoint 11 - Analyze a product and its price
**Request Format:** /products/analyze/:name/:description/:price

**Request Type:** GET

**Returned Data Format**: Text

**Description:** Uses AI to analyze a product based on the name, description, and price. It states whether it's a good or bad deal.

**Example Request:** /products/analyze/couch/new/$50

**Example Response:**
```
Yes, a new couch for $50 is a good deal because it is typically much cheaper than the average cost of a new couch.
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something goes wrong on the server, returns error with `Something went wrong; please try again.`
- Possible 400 errors (all plain text):
  - If the resulting analysis is longer than 150 characters, returns error with `Failed to analyze the provided product`